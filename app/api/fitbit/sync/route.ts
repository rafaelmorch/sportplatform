// app/api/fitbit/sync/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const fitbitClientId = process.env.FITBIT_CLIENT_ID!;
const fitbitClientSecret = process.env.FITBIT_CLIENT_SECRET!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // ignore
  }

  if (!resp.ok || !json?.access_token) {
    throw new Error(`Fitbit refresh failed: ${text}`);
  }

  return json as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope?: string;
    user_id?: string;
  };
}

async function fitbitGet(accessToken: string, url: string) {
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await resp.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // ignore
  }

  if (!resp.ok) {
    throw new Error(`Fitbit API failed (${resp.status}): ${text}`);
  }

  return json;
}

type DailyRow = {
  user_id: string;
  fitbit_user_id: string;
  day: string; // YYYY-MM-DD
  steps: number | null;
  calories_out: number | null;
  distance_total: number | null;
  lightly_active_minutes: number | null;
  fairly_active_minutes: number | null;
  very_active_minutes: number | null;
};

function extractTotalDistanceKm(summary: any): number | null {
  // Fitbit summary.distances é array com { activity, distance }
  // "total" normalmente contém a distância total do dia.
  const distances = summary?.distances;
  if (!Array.isArray(distances)) return null;

  const total = distances.find((d: any) => d?.activity === "total");
  const val = total?.distance;
  if (typeof val === "number") return val;

  // fallback: às vezes "loggedActivities" também existe
  const logged = distances.find((d: any) => d?.activity === "loggedActivities");
  if (typeof logged?.distance === "number") return logged.distance;

  return null;
}

export async function GET(req: Request) {
  try {
    // 1) auth
    const userId = await getUserIdFromBearer(req);
    if (!userId) {
      return jsonError(401, "Token inválido ou sessão expirada.", {
        details:
          "invalid JWT: unable to parse or verify signature, token has invalid claims: token is expired",
      });
    }

    // 2) query params
    const { searchParams } = new URL(req.url);
    const afterDateParam = searchParams.get("afterDate"); // YYYY-MM-DD (opcional)

    // default: últimos 30 dias
    const today = new Date();
    const through = yyyyMmDd(today);
    const afterDate =
      afterDateParam && /^\d{4}-\d{2}-\d{2}$/.test(afterDateParam)
        ? afterDateParam
        : yyyyMmDd(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 30)));

    // 3) pegar tokens do fitbit no Supabase
    const { data: tokenRow, error: tokenErr } = await supabaseAdmin
      .from("fitbit_tokens")
      .select("user_id, fitbit_user_id, access_token, refresh_token, expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (tokenErr) return jsonError(500, "Erro ao ler fitbit_tokens.", tokenErr.message);
    if (!tokenRow?.access_token || !tokenRow?.refresh_token) {
      return jsonError(400, "Fitbit não conectado (tokens ausentes).");
    }

    let accessToken = tokenRow.access_token as string;
    const fitbitUserId = tokenRow.fitbit_user_id as string;

    // 4) refresh token se expirado (ou perto)
    const expiresAt = tokenRow.expires_at ? new Date(tokenRow.expires_at as any) : null;
    const now = new Date();
    const isExpiredOrClose =
      !expiresAt || expiresAt.getTime() - now.getTime() < 2 * 60 * 1000; // <2min

    if (isExpiredOrClose) {
      const refreshed = await refreshFitbitToken(tokenRow.refresh_token as string);

      accessToken = refreshed.access_token;

      const newRefresh = refreshed.refresh_token || (tokenRow.refresh_token as string);
      const newExpiresAt = new Date(now.getTime() + refreshed.expires_in * 1000);

      const { error: upErr } = await supabaseAdmin
        .from("fitbit_tokens")
        .update({
          access_token: accessToken,
          refresh_token: newRefresh,
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (upErr) return jsonError(500, "Erro ao atualizar fitbit_tokens.", upErr.message);
    }

    // 5) montar lista de dias a sincronizar (inclusive)
    const startDate = new Date(`${afterDate}T00:00:00Z`);
    const endDate = new Date(`${through}T00:00:00Z`);
    const days = daysBetweenInclusive(startDate, endDate);

    // 6) sync daily summaries (e depois exercícios por dia)
    let fetchedDays = 0;
    let dailySaved = 0;

    let exercisesFetched = 0;
    let exercisesSaved = 0;

    for (const day of days) {
      // Daily summary (1 chamada por dia)
      const dailyJson = await fitbitGet(
        accessToken,
        `https://api.fitbit.com/1/user/-/activities/date/${day}.json`
      );

      fetchedDays += 1;

      const summary = dailyJson?.summary || {};
      const steps = typeof summary.steps === "number" ? summary.steps : null;
      const caloriesOut = typeof summary.caloriesOut === "number" ? summary.caloriesOut : null;
      const distanceTotal = extractTotalDistanceKm(summary);

      const lightly = typeof summary.lightlyActiveMinutes === "number" ? summary.lightlyActiveMinutes : null;
      const fairly = typeof summary.fairlyActiveMinutes === "number" ? summary.fairlyActiveMinutes : null;
      const very = typeof summary.veryActiveMinutes === "number" ? summary.veryActiveMinutes : null;

      const row: DailyRow = {
        user_id: userId,
        fitbit_user_id: fitbitUserId,
        day,
        steps,
        calories_out: caloriesOut,
        distance_total: distanceTotal,
        lightly_active_minutes: lightly,
        fairly_active_minutes: fairly,
        very_active_minutes: very,
      };

      // ✅ OPÇÃO A: se existe → UPDATE, senão INSERT
      const { data: existing, error: exErr } = await supabaseAdmin
        .from("fitbit_daily_summaries")
        .select("user_id, day")
        .eq("user_id", userId)
        .eq("day", day)
        .maybeSingle();

      if (exErr) return jsonError(500, "Erro ao checar fitbit_daily_summaries.", exErr.message);

      if (existing) {
        const { error: updErr } = await supabaseAdmin
          .from("fitbit_daily_summaries")
          .update({
            steps: row.steps,
            calories_out: row.calories_out,
            distance_total: row.distance_total,
            lightly_active_minutes: row.lightly_active_minutes,
            fairly_active_minutes: row.fairly_active_minutes,
            very_active_minutes: row.very_active_minutes,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("day", day);

        if (updErr) return jsonError(500, "Erro ao atualizar fitbit_daily_summaries.", updErr.message);

        dailySaved += 1;
      } else {
        const { error: insErr } = await supabaseAdmin.from("fitbit_daily_summaries").insert({
          ...row,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (insErr) return jsonError(500, "Erro ao inserir fitbit_daily_summaries.", insErr.message);

        dailySaved += 1;
      }

      // Exercícios do dia (o dailyJson.activities já vem com logs do dia)
      const acts = Array.isArray(dailyJson?.activities) ? dailyJson.activities : [];
      if (acts.length > 0) exercisesFetched += acts.length;

      for (const a of acts) {
        // Campos comuns do Fitbit activity log
        const activityId = typeof a?.activityId === "number" ? a.activityId : null;
        const name = typeof a?.name === "string" ? a.name : null;

        const distanceKm = typeof a?.distance === "number" ? a.distance : null; // Fitbit já retorna km
        const stepsEx = typeof a?.steps === "number" ? a.steps : null;

        const startTime = typeof a?.startTime === "string" ? a.startTime : null; // "09:56"
        const logId = typeof a?.logId === "number" ? a.logId : null;

        if (!activityId || !logId) continue;

        // chave única típica: (user_id, activity_id) ou (user_id, activity_id, day) depende do seu schema
        // Pelo seu índice: fitbit_exercises_user_activity_id_key (provavelmente user_id + activity_id)
        // Então usamos upsert por activity_id + user_id (se já existir, ignora)
        const payload: any = {
          user_id: userId,
          fitbit_user_id: fitbitUserId,
          day,
          activity_id: activityId,
          name,
          distance_km: distanceKm,
          steps: stepsEx,
          start_time: startTime,
          raw: a,
          updated_at: new Date().toISOString(),
        };

        // tenta inserir; se já existe, atualiza “raw/updated_at” (para não perder)
        const { error: exInsErr } = await supabaseAdmin
          .from("fitbit_exercises")
          .upsert(payload, { onConflict: "user_id,activity_id" });

        if (exInsErr) return jsonError(500, "Erro ao salvar fitbit_exercises.", exInsErr.message);

        exercisesSaved += 1;
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
      note: "daily_plus_exercises_option_A_update",
    });
  } catch (err: any) {
    return jsonError(500, "Erro inesperado no fitbit sync.", err?.message || String(err));
  }
}
