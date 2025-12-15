// app/api/fitbit/import/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

type FitbitTokenRow = {
  user_id: string;
  fitbit_user_id: string | null;
  access_token: string;
  refresh_token: string;
  token_type: string | null;
  scope: string | null;
  expires_at: string; // timestamptz
};

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function supabaseServer() {
  // ✅ Next 16: cookies() é async
  const cookieStore = await cookies();

  return createServerClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
}

function toYYYYMMDD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function asNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function safeJsonParse(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

async function refreshFitbitTokenIfNeeded(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  token: FitbitTokenRow
): Promise<FitbitTokenRow> {
  const now = Date.now();
  const expiresAt = new Date(token.expires_at).getTime();

  // se expira em <= 60s, renova
  if (Number.isFinite(expiresAt) && expiresAt - now > 60_000) return token;

  const clientId = env("FITBIT_CLIENT_ID");
  const clientSecret = env("FITBIT_CLIENT_SECRET");

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", token.refresh_token);

  const r = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const text = await r.text();
  const data = safeJsonParse(text);

  if (!r.ok) {
    throw new Error(`Fitbit refresh failed (${r.status}): ${text}`);
  }
  if (!data?.access_token || !data?.refresh_token || !data?.expires_in) {
    throw new Error(`Fitbit refresh response unexpected: ${text}`);
  }

  const newExpiresAt = new Date(Date.now() + Number(data.expires_in) * 1000).toISOString();

  const updated: Partial<FitbitTokenRow> = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type ?? token.token_type,
    scope: data.scope ?? token.scope,
    expires_at: newExpiresAt,
    fitbit_user_id: data.user_id ?? token.fitbit_user_id,
  };

  const { error } = await supabase
    .from("fitbit_tokens")
    .update(updated)
    .eq("user_id", token.user_id);

  if (error) throw new Error(`Supabase update fitbit_tokens failed: ${error.message}`);

  return { ...token, ...(updated as FitbitTokenRow) };
}

async function fetchFitbitActivities(accessToken: string, afterDate: string) {
  // Fitbit Activities List API
  // https://api.fitbit.com/1/user/-/activities/list.json?afterDate=YYYY-MM-DD&sort=desc&limit=100&offset=0
  const url = new URL("https://api.fitbit.com/1/user/-/activities/list.json");
  url.searchParams.set("afterDate", afterDate);
  url.searchParams.set("sort", "desc");
  url.searchParams.set("limit", "100");
  url.searchParams.set("offset", "0");

  const r = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await r.text();
  const data = safeJsonParse(text);

  if (!r.ok) throw new Error(`Fitbit activities failed (${r.status}): ${text}`);

  // geralmente vem em `activities`
  const acts = Array.isArray(data?.activities) ? data.activities : [];
  return acts;
}

export async function GET(req: Request) {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) throw new Error(`Supabase auth error: ${userErr.message}`);
    if (!user) return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });

    const url = new URL(req.url);
    const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days") ?? "30")));
    const after = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const afterDate = toYYYYMMDD(after);

    // token do usuário
    const { data: tokenRow, error: tokenErr } = await supabase
      .from("fitbit_tokens")
      .select("user_id, fitbit_user_id, access_token, refresh_token, token_type, scope, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (tokenErr) throw new Error(`Supabase read fitbit_tokens failed: ${tokenErr.message}`);
    if (!tokenRow) {
      return NextResponse.json(
        { ok: false, error: "No Fitbit token found for this user." },
        { status: 400 }
      );
    }

    const freshToken = await refreshFitbitTokenIfNeeded(supabase, tokenRow as FitbitTokenRow);

    const activities = await fetchFitbitActivities(freshToken.access_token, afterDate);

    if (!activities.length) {
      return NextResponse.json({
        ok: true,
        days,
        afterDate,
        fetched: 0,
        inserted_fitbit_activities: 0,
        upserted_user_activities: 0,
      });
    }

    // montar rows p/ fitbit_activities
    const fitbitRows = activities.map((a: any) => {
      const activityId = a?.logId ?? a?.activityLogId ?? a?.activityId ?? null; // tenta achar um id
      const startTime = a?.startTime ?? a?.startDateTime ?? a?.originalStartTime ?? null;
      const durationMs = asNumber(a?.duration, 0); // ms
      const dist = asNumber(a?.distance, 0); // normalmente em km/miles dependendo config; mantemos raw e não assumimos
      const type = (a?.activityName ?? a?.name ?? a?.activityTypeName ?? "Activity") as string;

      return {
        user_id: user.id,
        fitbit_user_id: freshToken.fitbit_user_id ?? null,
        activity_id: Number(activityId ?? 0),
        name: type,
        type: type,
        start_date: startTime ? new Date(startTime).toISOString() : null,
        distance: dist,
        moving_time: Math.round(durationMs / 1000), // segundos
        raw: a,
      };
    });

    // inserir/upsert fitbit_activities
    // (assumindo que existe unique por user_id + activity_id; se não existir, criaremos depois)
    const { data: fitbitInsert, error: fitbitErr } = await supabase
      .from("fitbit_activities")
      .upsert(fitbitRows, { onConflict: "user_id,activity_id" })
      .select("activity_id");

    if (fitbitErr) throw new Error(`Supabase upsert fitbit_activities failed: ${fitbitErr.message}`);

    // montar rows p/ user_activities (provider=fitbit)
    const userActs = activities.map((a: any) => {
      const activityId = a?.logId ?? a?.activityLogId ?? a?.activityId ?? null;
      const startTime = a?.startTime ?? a?.startDateTime ?? a?.originalStartTime ?? null;
      const durationMs = asNumber(a?.duration, 0);
      const minutes = durationMs > 0 ? durationMs / 60000 : 0;
      const type = (a?.activityName ?? a?.name ?? a?.activityTypeName ?? "Activity") as string;

      return {
        user_id: user.id,
        provider: "fitbit",
        external_id: String(activityId ?? ""),
        start_date: startTime ? new Date(startTime).toISOString() : null,
        type,
        minutes,
        raw: a,
      };
    });

    // upsert em user_activities
    // (assumindo unique por user_id + provider + external_id)
    const { data: uaUpsert, error: uaErr } = await supabase
      .from("user_activities")
      .upsert(userActs, { onConflict: "user_id,provider,external_id" })
      .select("external_id");

    if (uaErr) throw new Error(`Supabase upsert user_activities failed: ${uaErr.message}`);

    return NextResponse.json({
      ok: true,
      days,
      afterDate,
      fetched: activities.length,
      inserted_fitbit_activities: fitbitInsert?.length ?? 0,
      upserted_user_activities: uaUpsert?.length ?? 0,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
