// app/api/fitbit/sync/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID!;
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

type FitbitTokenRow = {
  user_id: string;
  fitbit_user_id: string;
  access_token: string;
  refresh_token: string;
  token_type: string | null;
  scope: string | null;
  expires_at: string | null; // timestamptz
};

function jsonError(status: number, message: string, details?: any) {
  return NextResponse.json({ message, details }, { status });
}

function toISODate(d: Date) {
  // YYYY-MM-DD
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

async function refreshFitbitToken(refresh_token: string) {
  const basic = Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString("base64");

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refresh_token);

  const res = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const txt = await res.text();
  if (!res.ok) {
    throw new Error(`Fitbit refresh failed: ${txt}`);
  }
  return JSON.parse(txt) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope?: string;
    user_id?: string;
  };
}

async function fitbitGet(accessToken: string, url: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const txt = await res.text();
  if (!res.ok) {
    throw new Error(`Fitbit GET failed (${res.status}): ${txt}`);
  }
  return JSON.parse(txt);
}

export async function GET(req: Request) {
  try {
    // 1) validar JWT do Supabase enviado pelo client
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return jsonError(401, "Token inválido ou sessão expirada.", "missing Authorization Bearer token");
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return jsonError(401, "Token inválido ou sessão expirada.", userErr?.message || "invalid user");
    }
    const user_id = userData.user.id;

    // 2) carregar tokens do Fitbit no banco
    const { data: tokenRow, error: tokenErr } = await supabaseAdmin
      .from("fitbit_tokens")
      .select("user_id, fitbit_user_id, access_token, refresh_token, token_type, scope, expires_at")
      .eq("user_id", user_id)
      .maybeSingle<FitbitTokenRow>();

    if (tokenErr) return jsonError(500, "Erro ao buscar tokens do Fitbit.", tokenErr.message);
    if (!tokenRow) return jsonError(400, "Usuário não conectado ao Fitbit.");

    let access_token = tokenRow.access_token;
    let refresh_token = tokenRow.refresh_token;
    const fitbit_user_id = tokenRow.fitbit_user_id;

    // 3) refresh se expirado (ou perto de expirar)
    const now = new Date();
    const expiresAt = tokenRow.expires_at ? new Date(tokenRow.expires_at) : null;
    const needsRefresh = !expiresAt || expiresAt.getTime() - now.getTime() < 2 * 60 * 1000; // < 2 min

    if (needsRefresh) {
      const refreshed = await refreshFitbitToken(refresh_token);

      access_token = refreshed.access_token;
      refresh_token = refreshed.refresh_token;

      const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

      const { error: upErr } = await supabaseAdmin
        .from("fitbit_tokens")
        .update({
          access_token,
          refresh_token,
          expires_at: newExpiresAt,
          token_type: refreshed.token_type,
          scope: refreshed.scope ?? tokenRow.scope,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user_id);

      if (upErr) {
        return jsonError(500, "Erro ao atualizar refresh token do Fitbit.", upErr.message);
      }
    }

    // 4) definir janela: últimos 30 dias, mas se já tiver daily salvo, começa do max(day)
    const today = new Date();
    const through = toISODate(today);

    const thirtyDaysAgo = addDays(today, -30);
    let afterDate = toISODate(thirtyDaysAgo);

    const { data: maxDayRow } = await supabaseAdmin
      .from("fitbit_daily")
      .select("day")
      .eq("user_id", user_id)
      .order("day", { ascending: false })
      .limit(1)
      .maybeSingle<{ day: string }>();

    if (maxDayRow?.day) {
      // começa do dia seguinte ao último salvo
      afterDate = toISODate(addDays(new Date(maxDayRow.day), 1));
    }

    // se afterDate > today, não faz nada
    if (new Date(afterDate) > today) {
      return NextResponse.json({
        ok: true,
        user_id,
        fitbit_user_id,
        afterDate,
        through,
        fetched: 0,
        saved: 0,
        exercises_saved: 0,
        note: "nothing_to_sync",
      });
    }

    // 5) loop por dia: pega /activities/date/{day}.json
    let fetched = 0;
    let saved = 0;
    let exercisesSaved = 0;

    for (let d = new Date(afterDate); d <= today; d = addDays(d, 1)) {
      const day = toISODate(d);

      const url = `https://api.fitbit.com/1/user/-/activities/date/${day}.json`;
      const payload = await fitbitGet(access_token, url);

      fetched++;

      // DAILY summary
      const summary = payload?.summary ?? {};
      const distancesArr = Array.isArray(summary?.distances) ? summary.distances : [];
      const totalDistance =
        distancesArr.find((x: any) => x.activity === "total")?.distance ??
        distancesArr.find((x: any) => x.activity === "loggedActivities")?.distance ??
        0;

      const dailyRow = {
        user_id,
        fitbit_user_id,
        day,
        steps: Number(summary?.steps ?? 0),
        calories_out: Number(summary?.caloriesOut ?? 0),
        distance_total: Number(totalDistance ?? 0),
        lightly_active_minutes: Number(summary?.lightlyActiveMinutes ?? 0),
        fairly_active_minutes: Number(summary?.fairlyActiveMinutes ?? 0),
        very_active_minutes: Number(summary?.veryActiveMinutes ?? 0),
        updated_at: new Date().toISOString(),
      };

      // upsert daily (precisa ter unique (user_id, day) na fitbit_daily)
      const { error: dailyErr } = await supabaseAdmin
        .from("fitbit_daily")
        .upsert(dailyRow, { onConflict: "user_id,day" });

      if (!dailyErr) saved++;

      // EXERCISES logs (payload.activities[])
      const acts = Array.isArray(payload?.activities) ? payload.activities : [];
      if (acts.length) {
        const rows = acts.map((a: any) => ({
          user_id,
          fitbit_user_id,
          log_id: Number(a.logId),
          day,
          start_time: a.startTime ?? null,
          activity_id: a.activityId ?? null,
          name: a.name ?? null,
          description: a.description ?? null,
          duration_ms: a.duration ?? null,
          distance_km: a.distance ?? null,
          steps: a.steps ?? null,
          calories: a.calories ?? null,
          last_modified: a.lastModified ? new Date(a.lastModified).toISOString() : null,
          updated_at: new Date().toISOString(),
        }));

        const { error: exErr } = await supabaseAdmin
          .from("fitbit_exercises")
          .upsert(rows, { onConflict: "log_id" });

        if (!exErr) exercisesSaved += rows.length;
      }
    }

    return NextResponse.json({
      ok: true,
      user_id,
      fitbit_user_id,
      afterDate,
      through,
      fetched,
      saved,
      exercises_saved: exercisesSaved,
      note: "daily_plus_exercises",
    });
  } catch (e: any) {
    return jsonError(500, "Erro inesperado no fitbit sync.", e?.message || String(e));
  }
}
