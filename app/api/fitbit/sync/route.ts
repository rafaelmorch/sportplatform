// app/api/fitbit/sync/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const fitbitClientId = process.env.FITBIT_CLIENT_ID!;
const fitbitClientSecret = process.env.FITBIT_CLIENT_SECRET!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/* ---------------- helpers ---------------- */

function jsonError(status: number, message: string, details?: any) {
  return NextResponse.json(
    { message, ...(details ? { details } : {}) },
    { status }
  );
}

function yyyyMmDd(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetweenInclusive(start: Date, end: Date) {
  const out: string[] = [];
  const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

  while (cur.getTime() <= last.getTime()) {
    out.push(yyyyMmDd(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

async function getUserIdFromBearer(req: Request) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const jwt = auth.slice("Bearer ".length).trim();
  const { data, error } = await supabaseAdmin.auth.getUser(jwt);

  if (error || !data?.user?.id) return null;
  return data.user.id;
}

async function refreshFitbitToken(refreshToken: string) {
  const basic = Buffer.from(`${fitbitClientId}:${fitbitClientSecret}`).toString("base64");

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refreshToken);

  const resp = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const text = await resp.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Fitbit refresh failed (invalid JSON): ${text}`);
  }

  if (!resp.ok || !json?.access_token) {
    throw new Error(`Fitbit refresh failed: ${text}`);
  }

  return json as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

async function fitbitGet(accessToken: string, url: string) {
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await resp.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Fitbit API invalid JSON (${resp.status}): ${text}`);
  }

  if (!resp.ok) {
    throw new Error(`Fitbit API failed (${resp.status}): ${text}`);
  }

  return json;
}

function extractTotalDistanceKm(summary: any): number | null {
  const distances = summary?.distances;
  if (!Array.isArray(distances)) return null;

  const total = distances.find((d: any) => d?.activity === "total");
  if (typeof total?.distance === "number") return total.distance;

  const logged = distances.find((d: any) => d?.activity === "loggedActivities");
  if (typeof logged?.distance === "number") return logged.distance;

  return null;
}

/* ---------------- route ---------------- */

export async function GET(req: Request) {
  try {
    /* 1) auth */
    const userId = await getUserIdFromBearer(req);
    if (!userId) {
      return jsonError(401, "Token inválido ou sessão expirada.");
    }

    /* 2) datas */
    const { searchParams } = new URL(req.url);
    const afterDateParam = searchParams.get("afterDate");

    const today = new Date();
    const through = yyyyMmDd(today);

    const afterDate =
      afterDateParam && /^\d{4}-\d{2}-\d{2}$/.test(afterDateParam)
        ? afterDateParam
        : yyyyMmDd(
            new Date(
              Date.UTC(
                today.getUTCFullYear(),
                today.getUTCMonth(),
                today.getUTCDate() - 30
              )
            )
          );

    /* 3) tokens */
    const { data: tokenRow, error: tokenErr } = await supabaseAdmin
      .from("fitbit_tokens")
      .select("user_id, fitbit_user_id, access_token, refresh_token, expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (tokenErr) return jsonError(500, "Erro ao ler fitbit_tokens.", tokenErr.message);
    if (!tokenRow?.access_token || !tokenRow?.refresh_token) {
      return jsonError(400, "Fitbit não conectado.");
    }

    let accessToken = tokenRow.access_token as string;
    const fitbitUserId = tokenRow.fitbit_user_id as string;

    /* 4) refresh token */
    const expiresAt = tokenRow.expires_at ? new Date(tokenRow.expires_at as any) : null;
    const now = new Date();

    if (!expiresAt || expiresAt.getTime() - now.getTime() < 2 * 60 * 1000) {
      const refreshed = await refreshFitbitToken(tokenRow.refresh_token as string);

      accessToken = refreshed.access_token;
      const newExpiresAt = new Date(now.getTime() + refreshed.expires_in * 1000);

      const { error: upErr } = await supabaseAdmin
        .from("fitbit_tokens")
        .update({
          access_token: accessToken,
          refresh_token: refreshed.refresh_token ?? tokenRow.refresh_token,
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (upErr) return jsonError(500, "Erro ao atualizar fitbit_tokens.", upErr.message);
    }

    /* 5) dias */
    const days = daysBetweenInclusive(
      new Date(`${afterDate}T00:00:00Z`),
      new Date(`${through}T00:00:00Z`)
    );

    let fetchedDays = 0;
    let dailySaved = 0;
    let exercisesFetched = 0;
    let exercisesSaved = 0;

    /* 6) loop */
    for (const day of days) {
      const dailyJson = await fitbitGet(
        accessToken,
        `https://api.fitbit.com/1/user/-/activities/date/${day}.json`
      );

      fetchedDays++;

      const summary = dailyJson.summary || {};

      const dailyRow = {
        user_id: userId,
        fitbit_user_id: fitbitUserId,
        day,
        steps: typeof summary.steps === "number" ? summary.steps : null,
        calories_out: typeof summary.caloriesOut === "number" ? summary.caloriesOut : null,
        distance_total: extractTotalDistanceKm(summary),
        lightly_active_minutes:
          typeof summary.lightlyActiveMinutes === "number"
            ? summary.lightlyActiveMinutes
            : null,
        fairly_active_minutes:
          typeof summary.fairlyActiveMinutes === "number"
            ? summary.fairlyActiveMinutes
            : null,
        very_active_minutes:
          typeof summary.veryActiveMinutes === "number"
            ? summary.veryActiveMinutes
            : null,
        updated_at: new Date().toISOString(),
      };

      await supabaseAdmin
        .from("fitbit_daily_summaries")
        .upsert(
          { ...dailyRow, created_at: new Date().toISOString() },
          { onConflict: "user_id,day" }
        );

      dailySaved++;

      const acts = Array.isArray(dailyJson.activities) ? dailyJson.activities : [];
      exercisesFetched += acts.length;

      for (const a of acts) {
        if (!a?.logId) continue;

        const payload = {
          user_id: userId,
          fitbit_user_id: fitbitUserId,
          log_id: a.logId,
          day,
          activity_id: a.activityId ?? null,
          name: a.name ?? null,
          description: a.description ?? null,
          duration_ms: a.duration ?? null,
          distance_km: typeof a.distance === "number" ? a.distance : null,
          steps: typeof a.steps === "number" ? a.steps : null,
          calories: typeof a.calories === "number" ? a.calories : null,
          start_time: a.startTime ?? null,
          last_modified: a.lastModified ? new Date(a.lastModified).toISOString() : null,
          raw: a,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin
          .from("fitbit_exercises")
          .upsert(payload, { onConflict: "user_id,log_id" });

        if (error) {
          return jsonError(500, "Erro ao salvar fitbit_exercises.", error.message);
        }

        exercisesSaved++;
      }
    }

    return NextResponse.json({
      ok: true,
      user_id: userId,
      fitbit_user_id: fitbitUserId,
      afterDate,
      through,
      fetched_days: fetchedDays,
      daily_saved: dailySaved,
      exercises_fetched: exercisesFetched,
      exercises_saved: exercisesSaved,
      note: "fitbit_daily_and_exercises_OK",
    });
  } catch (err: any) {
    return jsonError(500, "Erro inesperado no fitbit sync.", err?.message || String(err));
  }
}
