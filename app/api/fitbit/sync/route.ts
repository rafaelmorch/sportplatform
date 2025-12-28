// app/api/fitbit/sync/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth) return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function toISODate(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function verifyUserIdFromJwt(jwt: string) {
  // verifica o JWT do usuário via Supabase Auth
  const supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data?.user?.id) {
    return { userId: null as string | null, details: error?.message || "invalid_user" };
  }
  return { userId: data.user.id, details: null as string | null };
}

async function fitbitRefreshToken(refreshToken: string) {
  const clientId = process.env.FITBIT_CLIENT_ID!;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET!;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

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

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Fitbit refresh failed: ${JSON.stringify(json)}`);
  }

  return {
    access_token: json.access_token as string,
    refresh_token: (json.refresh_token as string) || refreshToken,
    token_type: json.token_type as string,
    scope: json.scope as string,
    expires_in: json.expires_in as number, // segundos
    user_id: json.user_id as string,
  };
}

async function fitbitGetDay(accessToken: string, day: string) {
  const url = `https://api.fitbit.com/1/user/-/activities/date/${day}.json`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Fitbit day failed (${day}): ${JSON.stringify(json)}`);
  }
  return json;
}

export async function GET(req: Request) {
  try {
    const jwt = getBearerToken(req);
    if (!jwt) {
      return NextResponse.json(
        { message: "Token ausente." },
        { status: 401 }
      );
    }

    const { userId, details } = await verifyUserIdFromJwt(jwt);
    if (!userId) {
      return NextResponse.json(
        { message: "Token inválido ou sessão expirada.", details },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // pega tokens do fitbit desse user
    const { data: tokenRow, error: tokenErr } = await supabase
      .from("fitbit_tokens")
      .select("user_id, fitbit_user_id, access_token, refresh_token, expires_at, token_type, scope")
      .eq("user_id", userId)
      .maybeSingle();

    if (tokenErr || !tokenRow?.refresh_token) {
      return NextResponse.json(
        { message: "Fitbit não conectado (tokens não encontrados).", details: tokenErr?.message },
        { status: 400 }
      );
    }

    // sempre tenta refresh (mais simples/robusto)
    const refreshed = await fitbitRefreshToken(tokenRow.refresh_token);

    const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

    const { error: updErr } = await supabase
      .from("fitbit_tokens")
      .update({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        token_type: refreshed.token_type,
        scope: refreshed.scope,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updErr) {
      return NextResponse.json(
        { message: "Falha ao atualizar tokens do Fitbit.", details: updErr.message },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const afterDateParam = url.searchParams.get("afterDate"); // opcional

    const today = new Date();
    const through = toISODate(today);

    // padrão: últimos 30 dias (inclui hoje)
    const defaultAfter = toISODate(addDays(today, -30));
    const afterDate = (afterDateParam && /^\d{4}-\d{2}-\d{2}$/.test(afterDateParam))
      ? afterDateParam
      : defaultAfter;

    // loop de dias
    const start = new Date(`${afterDate}T00:00:00.000Z`);
    const end = new Date(`${through}T00:00:00.000Z`);

    let fetchedDays = 0;
    let savedDays = 0;
    let exercisesFetched = 0;
    let exercisesSaved = 0;

    for (let d = start; d <= end; d = addDays(d, 1)) {
      const day = toISODate(d);

      const dayJson = await fitbitGetDay(refreshed.access_token, day);
      fetchedDays++;

      // daily summary
      const summary = dayJson?.summary || {};
      const distances = Array.isArray(summary?.distances) ? summary.distances : [];
      const totalDistanceObj = distances.find((x: any) => x?.activity === "total");
      const totalDistance = totalDistanceObj?.distance ?? null;

      const dailyRow = {
        user_id: userId,
        fitbit_user_id: refreshed.user_id || tokenRow.fitbit_user_id,
        day,
        steps: summary?.steps ?? 0,
        calories_out: summary?.caloriesOut ?? null,
        distance_total: totalDistance,
        lightly_active_minutes: summary?.lightlyActiveMinutes ?? null,
        fairly_active_minutes: summary?.fairlyActiveMinutes ?? null,
        very_active_minutes: summary?.veryActiveMinutes ?? null,
        raw: dayJson,
        updated_at: new Date().toISOString(),
      };

      const { error: dailyErr } = await supabase
        .from("fitbit_daily_summaries")
        .upsert(dailyRow, { onConflict: "user_id,day" });

      if (!dailyErr) savedDays++;

      // exercises/activities do dia
      const activities = Array.isArray(dayJson?.activities) ? dayJson.activities : [];
      exercisesFetched += activities.length;

      if (activities.length > 0) {
        const exerciseRows = activities.map((a: any) => {
          const startTime = a?.startTime ? String(a.startTime) : "00:00";
          const startDateTime = `${day}T${startTime}:00.000Z`;

          return {
            user_id: userId,
            fitbit_user_id: refreshed.user_id || tokenRow.fitbit_user_id,
            activity_id: a?.logId,                 // BIGINT na sua tabela
            name: a?.name ?? null,
            type: a?.activityParentName ?? a?.activityName ?? a?.name ?? null,
            start_date: startDateTime,
            distance: a?.distance ?? null,
            moving_time: a?.duration ? Math.round(Number(a.duration) / 1000) : null, // segundos
            raw: a,
            updated_at: new Date().toISOString(),
          };
        });

        const { error: exErr } = await supabase
          .from("fitbit_exercises")
          .upsert(exerciseRows, { onConflict: "user_id,activity_id" });

        if (!exErr) exercisesSaved += exerciseRows.length;
      }
    }

    return NextResponse.json({
      ok: true,
      user_id: userId,
      fitbit_user_id: refreshed.user_id || tokenRow.fitbit_user_id,
      afterDate,
      through,
      fetched_days: fetchedDays,
      daily_saved: savedDays,
      exercises_fetched: exercisesFetched,
      exercises_saved: exercisesSaved,
      note: "daily_plus_exercises",
    });
  } catch (e: any) {
    return NextResponse.json(
      { message: "Erro inesperado no fitbit sync.", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
