import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseYmd(s: string) {
  // aceita YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const dt = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function getUserIdFromBearer(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;

  // valida JWT do Supabase Auth e pega o user
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

type FitbitTokenRow = {
  user_id: string;
  fitbit_user_id: string | null;
  access_token: string;
  refresh_token: string;
  token_type: string | null;
  scope: string | null;
  expires_at: string | null;
  updated_at: string | null;
};

async function getFitbitTokens(userId: string): Promise<FitbitTokenRow | null> {
  const { data, error } = await supabaseAdmin
    .from("fitbit_tokens")
    .select(
      "user_id, fitbit_user_id, access_token, refresh_token, token_type, scope, expires_at, updated_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as FitbitTokenRow;
}

async function updateFitbitTokens(userId: string, patch: Partial<FitbitTokenRow>) {
  const { error } = await supabaseAdmin
    .from("fitbit_tokens")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) throw new Error(`db_upsert_failed: ${error.message}`);
}

async function fitbitRefresh(refreshToken: string) {
  const clientId = process.env.FITBIT_CLIENT_ID!;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET!;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refreshToken);

  const r = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = await r.json();
  if (!r.ok) {
    throw new Error(`Fitbit refresh failed: ${JSON.stringify(json)}`);
  }

  return json as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
    user_id: string;
  };
}

async function fitbitGet(accessToken: string, url: string) {
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(`Fitbit request failed: ${JSON.stringify(json)}`);
  }
  return json;
}

export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromBearer(req);
    if (!userId) {
      return NextResponse.json(
        { message: "Token inválido ou sessão expirada.", details: "unauthorized" },
        { status: 401 }
      );
    }

    const tokens = await getFitbitTokens(userId);
    if (!tokens) {
      return NextResponse.json(
        { message: "Fitbit não conectado.", details: "no_fitbit_tokens" },
        { status: 400 }
      );
    }

    // ✅ afterDate: se vier na URL, USA ELE. Se não vier, usa last 30 days.
    const url = new URL(req.url);
    const afterDateParam = url.searchParams.get("afterDate");

    const todayUTC = new Date();
    const defaultAfter = addDays(new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate())), -30);

    let afterDate = defaultAfter;

    if (afterDateParam) {
      const parsed = parseYmd(afterDateParam);
      if (!parsed) {
        return NextResponse.json(
          { message: "afterDate inválido. Use YYYY-MM-DD.", details: "bad_afterDate" },
          { status: 400 }
        );
      }
      // usa o param (sem “min” errado). Só não deixa ser futuro.
      const maxToday = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate()));
      afterDate = parsed > maxToday ? maxToday : parsed;
    }

    const through = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate()));
    const afterDateStr = ymd(afterDate);
    const throughStr = ymd(through);

    // refresh sempre (simplificado): se o access estiver expirado, refaz.
    // (você já está salvando expires_at; vamos respeitar isso)
    let accessToken = tokens.access_token;
    const exp = tokens.expires_at ? new Date(tokens.expires_at) : null;
    const isExpired = exp ? exp.getTime() <= Date.now() + 60_000 : false;

    if (isExpired) {
      const refreshed = await fitbitRefresh(tokens.refresh_token);

      accessToken = refreshed.access_token;

      const newExpires = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

      await updateFitbitTokens(userId, {
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        token_type: refreshed.token_type,
        scope: refreshed.scope,
        fitbit_user_id: refreshed.user_id,
        expires_at: newExpires,
      });
    }

    // -------------------------
    // 1) DAILY (um por dia)
    // -------------------------
    let fetched = 0;
    let saved = 0;

    // Caminha dia a dia (inclusive)
    for (let d = afterDate; d <= through; d = addDays(d, 1)) {
      const day = ymd(d);

      const json = await fitbitGet(
        accessToken,
        `https://api.fitbit.com/1/user/-/activities/date/${day}.json`
      );

      fetched += 1;

      const summary = json?.summary || {};
      const distances = Array.isArray(summary?.distances) ? summary.distances : [];

      const totalDistance = distances.find((x: any) => x?.activity === "total")?.distance ?? 0;

      // upsert daily (ajuste aqui se o nome da tabela for diferente)
      const payload = {
        user_id: userId,
        day,
        steps: summary?.steps ?? 0,
        calories_out: summary?.caloriesOut ?? 0,
        distance_total: totalDistance ?? 0,
        lightly_active_minutes: summary?.lightlyActiveMinutes ?? 0,
        fairly_active_minutes: summary?.fairlyActiveMinutes ?? 0,
        very_active_minutes: summary?.veryActiveMinutes ?? 0,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseAdmin
        .from("fitbit_daily")
        .upsert(payload, { onConflict: "user_id,day" });

      if (!error) {
        // só conta como "saved" se inseriu/atualizou sem erro
        // (não dá pra saber se mudou; então é “salvou ok”)
        saved += 1;
      }
    }

    // -------------------------
    // 2) EXERCISES (atividades tipo Run/Walk/Hike)
    // -------------------------
    // Aqui a gente usa o list.json com afterDate certinho
    const listUrl =
      `https://api.fitbit.com/1/user/-/activities/list.json` +
      `?afterDate=${encodeURIComponent(afterDateStr)}` +
      `&sort=asc&limit=100&offset=0`;

    const listJson = await fitbitGet(accessToken, listUrl);

    const activities: any[] = Array.isArray(listJson?.activities) ? listJson.activities : [];
    let exercisesSaved = 0;

    for (const a of activities) {
      // normaliza campos principais
      const item = {
        user_id: userId,
        log_id: a?.logId ?? null,
        activity_id: a?.activityId ?? null,
        name: a?.name ?? null,
        activity_parent_name: a?.activityParentName ?? null,
        start_date: a?.startDate ?? null,
        start_time: a?.startTime ?? null,
        duration_ms: a?.duration ?? null,
        distance: a?.distance ?? null,
        steps: a?.steps ?? null,
        calories: a?.calories ?? null,
        updated_at: new Date().toISOString(),
      };

      // upsert exercises (ajuste aqui se o nome da tabela for diferente)
      const { error } = await supabaseAdmin
        .from("fitbit_exercises")
        .upsert(item, { onConflict: "user_id,log_id" });

      if (!error) exercisesSaved += 1;
    }

    return NextResponse.json({
      ok: true,
      user_id: userId,
      fitbit_user_id: tokens.fitbit_user_id,
      afterDate: afterDateStr,
      through: throughStr,
      fetched,
      saved: saved === fetched ? 0 : saved, // evita confusão; daily já existia
      exercises_saved: exercisesSaved,
      note: afterDateParam ? "afterDate_query_applied" : "default_last_30_days",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        message: "Erro inesperado no fitbit sync.",
        details: String(e?.message || e),
      },
      { status: 500 }
    );
  }
}
