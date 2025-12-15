// app/api/fitbit/import/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type FitbitTokenRow = {
  user_id: string;
  fitbit_user_id: string | null;
  access_token: string;
  refresh_token: string;
  token_type: string | null;
  scope: string | null;
  expires_at: string | null;
};

function json(ok: boolean, payload: any, status = 200) {
  return NextResponse.json({ ok, ...payload }, { status });
}

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function toYYYYMMDD(d: Date) {
  const yyyy = d.getUTCFullYear().toString().padStart(4, "0");
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = d.getUTCDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function minutesFromFitbitActivity(a: any): number {
  // Fitbit normalmente traz duration em ms
  const ms =
    (typeof a?.activeDuration === "number" ? a.activeDuration : null) ??
    (typeof a?.duration === "number" ? a.duration : null) ??
    0;

  const min = ms / 1000 / 60;
  if (!Number.isFinite(min) || min <= 0) return 0;
  return Math.round(min * 10) / 10;
}

function typeFromFitbitActivity(a: any): string {
  // tenta padronizar um pouco (mas raw guarda tudo)
  const n = (a?.activityName || a?.name || a?.activityTypeId || "").toString();
  if (!n) return "Activity";
  return n;
}

async function refreshFitbitToken(refreshToken: string) {
  const clientId = getEnv("FITBIT_CLIENT_ID");
  const clientSecret = getEnv("FITBIT_CLIENT_SECRET");

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

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

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(
      `Fitbit refresh failed (${resp.status}): ${JSON.stringify(data)}`
    );
  }

  return data as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type?: string;
    scope?: string;
    user_id?: string;
  };
}

async function fetchFitbitActivities(accessToken: string, afterDate: string) {
  // Lista atividades do usuário (Fitbit)
  // docs: /1/user/-/activities/list.json
  const url = new URL("https://api.fitbit.com/1/user/-/activities/list.json");
  url.searchParams.set("afterDate", afterDate);
  url.searchParams.set("sort", "desc");
  url.searchParams.set("limit", "100");
  url.searchParams.set("offset", "0");

  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(
      `Fitbit activities failed (${resp.status}): ${JSON.stringify(data)}`
    );
  }

  // normalmente vem data.activities
  const acts = Array.isArray((data as any)?.activities)
    ? (data as any).activities
    : [];
  return acts as any[];
}

export async function GET(req: Request) {
  try {
    // ✅ Next 16: cookies() é async
    await cookies(); // só pra garantir que não quebra build caso exista uso futuro

    const url = new URL(req.url);
    const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days") ?? "30")));

    // ✅ APP deve mandar Authorization: Bearer <supabase_access_token>
    const auth = req.headers.get("authorization") || "";
    const token = auth.toLowerCase().startsWith("bearer ")
      ? auth.slice(7).trim()
      : "";

    if (!token) {
      return json(false, { error: "Supabase auth error: Auth session missing! (send Authorization: Bearer <token>)" }, 401);
    }

    const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseAnon = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    const supabaseServiceRole = getEnv("SUPABASE_SERVICE_ROLE");

    // 1) valida token e descobre user_id
    const supabaseAuth = createClient(supabaseUrl, supabaseAnon, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json(false, { error: `Supabase auth error: ${userErr?.message ?? "invalid token"}` }, 401);
    }
    const userId = userData.user.id;

    // 2) pega tokens do fitbit
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
      auth: { persistSession: false },
    });

    const { data: tokenRow, error: tokenRowErr } = await supabaseAdmin
      .from("fitbit_tokens")
      .select("user_id, fitbit_user_id, access_token, refresh_token, token_type, scope, expires_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<FitbitTokenRow>();

    if (tokenRowErr) {
      return json(false, { error: `DB error reading fitbit_tokens: ${tokenRowErr.message}` }, 500);
    }
    if (!tokenRow) {
      return json(false, { error: "No fitbit_tokens found for this user. Connect Fitbit first." }, 400);
    }

    let accessToken = tokenRow.access_token;
    let refreshToken = tokenRow.refresh_token;

    // 3) se expirou, refresh
    const expiresAt = tokenRow.expires_at ? new Date(tokenRow.expires_at).getTime() : 0;
    const now = Date.now();
    if (expiresAt && now >= expiresAt - 30_000) {
      const refreshed = await refreshFitbitToken(refreshToken);
      accessToken = refreshed.access_token;
      refreshToken = refreshed.refresh_token || refreshToken;

      const newExpiresAt = new Date(now + refreshed.expires_in * 1000).toISOString();

      await supabaseAdmin.from("fitbit_tokens").update({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: refreshed.token_type ?? tokenRow.token_type,
        scope: refreshed.scope ?? tokenRow.scope,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
    }

    // 4) busca atividades
    const after = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const afterDate = toYYYYMMDD(after);

    const activities = await fetchFitbitActivities(accessToken, afterDate);

    // 5) grava em fitbit_activities e também em user_activities
    let insertedFitbit = 0;
    let insertedUserActivities = 0;

    for (const a of activities) {
      const activityId = (a?.logId ?? a?.activityLogId ?? a?.id ?? "").toString();
      if (!activityId) continue;

      const start = (a?.startTime ?? a?.originalStartTime ?? a?.startDateTime ?? "").toString();
      const startDate = start ? new Date(start).toISOString() : null;

      const minutes = minutesFromFitbitActivity(a);
      const type = typeFromFitbitActivity(a);

      // fitbit_activities
      const { error: faErr } = await supabaseAdmin
        .from("fitbit_activities")
        .upsert(
          {
            user_id: userId,
            fitbit_user_id: tokenRow.fitbit_user_id,
            activity_id: Number.isFinite(Number(activityId)) ? Number(activityId) : null,
            name: (a?.activityName ?? a?.name ?? null) as string | null,
            type: type,
            start_date: startDate,
            distance: (typeof a?.distance === "number" ? a.distance : null),
            moving_time: minutes > 0 ? Math.round(minutes * 60) : null, // segundos
            raw: a,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,activity_id" } as any
        );

      if (!faErr) insertedFitbit++;

      // user_activities (schema: user_id, provider, external_id, start_date, type, minutes, raw)
      const { error: uaErr } = await supabaseAdmin
        .from("user_activities")
        .upsert(
          {
            user_id: userId,
            provider: "fitbit",
            external_id: activityId,
            start_date: startDate,
            type: type,
            minutes: minutes,
            raw: a,
          },
          { onConflict: "user_id,provider,external_id" } as any
        );

      if (!uaErr) insertedUserActivities++;
    }

    return json(true, {
      user_id: userId,
      days,
      fetched: activities.length,
      upserted_fitbit_activities: insertedFitbit,
      upserted_user_activities: insertedUserActivities,
    });
  } catch (e: any) {
    return json(false, { error: e?.message ?? String(e) }, 500);
  }
}
