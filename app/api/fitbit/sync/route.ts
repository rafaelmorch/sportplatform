// app/api/fitbit/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID!;
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET!;

type FitbitRefreshResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  scope?: string;
  token_type?: string;
  user_id: string; // Fitbit user id (ex: "CX66WN")
};

function pickAuthBearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function toIso(ms: number) {
  return new Date(ms).toISOString();
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

// Fitbit refresh token (OAuth2)
async function refreshFitbitToken(refreshToken: string) {
  const basic = Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString("base64");

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refreshToken);

  const res = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = (await res.json()) as any;

  if (!res.ok) {
    throw new Error(`Fitbit refresh failed: ${JSON.stringify(json)}`);
  }

  return json as FitbitRefreshResponse;
}

// GET daily summary for a specific day
async function fetchDailySummary(accessToken: string, day: string) {
  const url = `https://api.fitbit.com/1/user/-/activities/date/${day}.json`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const json = (await res.json()) as any;

  if (!res.ok) {
    throw new Error(`Fitbit daily summary failed: ${JSON.stringify(json)}`);
  }

  return json;
}

function pickDistanceKm(distances: any[] | undefined, activityName: string): number | null {
  const arr = Array.isArray(distances) ? distances : [];
  const found = arr.find((x) => (x?.activity ?? "") === activityName);
  const v = found?.distance;
  if (typeof v === "number") return v;
  return null;
}

export async function GET(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return NextResponse.json({ message: "Supabase env não configurado." }, { status: 500 });
    }
    if (!FITBIT_CLIENT_ID || !FITBIT_CLIENT_SECRET) {
      return NextResponse.json({ message: "Fitbit env não configurado." }, { status: 500 });
    }

    // 1) Auth do usuário (JWT do Supabase)
    const jwt = pickAuthBearer(req);
    if (!jwt) {
      return NextResponse.json({ message: "Missing Authorization Bearer token." }, { status: 401 });
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { message: "Token inválido ou sessão expirada.", details: userErr?.message },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // 2) Pega tokens Fitbit do usuário
    // Esperado: fitbit_tokens(user_id, fitbit_user_id, access_token, refresh_token, expires_at, updated_at)
    const { data: tokenRow, error: tokenErr } = await supabaseAdmin
      .from("fitbit_tokens")
      .select("fitbit_user_id, access_token, refresh_token, expires_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenErr) {
      return NextResponse.json(
        { message: "Erro ao ler fitbit_tokens.", details: tokenErr.message },
        { status: 500 }
      );
    }

    if (!tokenRow?.access_token || !tokenRow?.refresh_token || !tokenRow?.fitbit_user_id) {
      return NextResponse.json(
        { message: "Usuário não está conectado ao Fitbit (sem tokens)." },
        { status: 400 }
      );
    }

    let accessToken = tokenRow.access_token as string;
    let refreshToken = tokenRow.refresh_token as string;
    const fitbitUserId = tokenRow.fitbit_user_id as string;

    // expires_at pode ser ISO string (timestamptz) ou null
    const expiresAtIso = (tokenRow.expires_at as string | null) ?? null;
    const expiresAtMs = expiresAtIso ? new Date(expiresAtIso).getTime() : 0;
    const nowMs = Date.now();

    // 3) Refresh se expirado (ou faltando < 60s)
    if (expiresAtMs && expiresAtMs - nowMs < 60_000) {
      const refreshed = await refreshFitbitToken(refreshToken);
      accessToken = refreshed.access_token;
      refreshToken = refreshed.refresh_token ?? refreshToken;

      const newExpiresMs = Date.now() + (refreshed.expires_in ?? 3600) * 1000;
      const newExpiresIso = toIso(newExpiresMs);

      const { error: upErr } = await supabaseAdmin
        .from("fitbit_tokens")
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: newExpiresIso,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("fitbit_user_id", fitbitUserId);

      if (upErr) {
        console.error("Erro ao atualizar fitbit_tokens:", upErr);
      }
    }

    // 4) Define o afterDate (incremental)
    // - se já temos dados em fitbit_daily_summaries, pega o último dia salvo e volta 3 dias de buffer
    // - se não, pega last 30 days
    let startDay = addDays(todayUtc(), -30);

    const { data: lastRow, error: lastErr } = await supabaseAdmin
      .from("fitbit_daily_summaries")
      .select("day")
      .eq("user_id", userId)
      .order("day", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastErr) {
      return NextResponse.json(
        { message: "Erro ao ler último day (fitbit_daily_summaries).", details: lastErr.message },
        { status: 500 }
      );
    }

    if (lastRow?.day) {
      const lastDay = String(lastRow.day); // vem como 'YYYY-MM-DD'
      startDay = addDays(lastDay, -3); // buffer
    }

    const endDay = todayUtc();

    // 5) Busca summary por dia (loop)
    let fetched = 0;
    let saved = 0;

    const rowsToUpsert: any[] = [];

    for (let day = startDay; day <= endDay; day = addDays(day, 1)) {
      const json = await fetchDailySummary(accessToken, day);
      fetched += 1;

      const summary = json?.summary ?? {};
      const distances = summary?.distances ?? [];

      rowsToUpsert.push({
        user_id: userId,
        fitbit_user_id: fitbitUserId,
        day,

        calories_out: typeof summary.caloriesOut === "number" ? summary.caloriesOut : null,
        activity_calories:
          typeof summary.activityCalories === "number" ? summary.activityCalories : null,
        calories_bmr: typeof summary.caloriesBMR === "number" ? summary.caloriesBMR : null,

        steps: typeof summary.steps === "number" ? summary.steps : null,
        sedentary_minutes:
          typeof summary.sedentaryMinutes === "number" ? summary.sedentaryMinutes : null,
        lightly_active_minutes:
          typeof summary.lightlyActiveMinutes === "number" ? summary.lightlyActiveMinutes : null,
        fairly_active_minutes:
          typeof summary.fairlyActiveMinutes === "number" ? summary.fairlyActiveMinutes : null,
        very_active_minutes:
          typeof summary.veryActiveMinutes === "number" ? summary.veryActiveMinutes : null,

        distance_total_km: pickDistanceKm(distances, "total"),
        distance_tracker_km: pickDistanceKm(distances, "tracker"),
        distance_logged_activities_km: pickDistanceKm(distances, "loggedActivities"),

        raw: json,
        updated_at: new Date().toISOString(),
      });
    }

    // 6) Upsert no Supabase (PK: user_id + day)
    if (rowsToUpsert.length > 0) {
      const { error: upErr } = await supabaseAdmin
        .from("fitbit_daily_summaries")
        .upsert(rowsToUpsert, { onConflict: "user_id,day" });

      if (upErr) {
        return NextResponse.json(
          { message: "Erro ao upsert em fitbit_daily_summaries.", details: upErr.message },
          { status: 500 }
        );
      }

      saved = rowsToUpsert.length;
    }

    return NextResponse.json({
      ok: true,
      user_id: userId,
      fitbit_user_id: fitbitUserId,
      afterDate: startDay,
      through: endDay,
      fetched,
      saved,
      note: lastRow?.day ? "incremental_with_buffer" : "first_sync_last_30_days",
    });
  } catch (e: any) {
    console.error("Erro inesperado no fitbit sync:", e);
    return NextResponse.json(
      { message: "Erro inesperado no fitbit sync.", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
