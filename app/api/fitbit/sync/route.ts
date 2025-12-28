// app/api/fitbit/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID!;
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET!;

type FitbitTokenRow = {
  user_id: string;
  fitbit_user_id: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_type: string | null; // "Bearer"
  scope: string | null;
  expires_at: string | null; // timestamptz
  updated_at?: string | null;
};

function pickAuthBearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function toBasicAuth(clientId: string, clientSecret: string) {
  // Node runtime -> Buffer ok
  return "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

async function refreshFitbitToken(refreshToken: string) {
  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refreshToken);

  const res = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: toBasicAuth(FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(`Fitbit refresh failed: ${JSON.stringify(json)}`);
  }

  return json as {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    scope?: string;
    expires_in?: number; // seconds
    user_id?: string; // fitbit user id
  };
}

function isoFromExpiresInSeconds(expiresIn: number): string {
  const ms = Date.now() + expiresIn * 1000;
  return new Date(ms).toISOString();
}

async function fetchFitbitActivities(accessToken: string) {
  // Endpoint simples e útil pra teste:
  // https://dev.fitbit.com/build/reference/web-api/activity/get-activity-log-list/
  // Pega lista de atividades recentes (não depende de dataset de “intraday”)
  const url = new URL("https://api.fitbit.com/1/user/-/activities/list.json");
  url.searchParams.set("sort", "desc");
  url.searchParams.set("limit", "20");
  url.searchParams.set("offset", "0");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(`Fitbit activities failed: ${JSON.stringify(json)}`);
  }

  return json;
}

export async function GET(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return NextResponse.json({ message: "Supabase env não configurado." }, { status: 500 });
    }
    if (!FITBIT_CLIENT_ID || !FITBIT_CLIENT_SECRET) {
      return NextResponse.json({ message: "Fitbit env não configurado (FITBIT_CLIENT_ID/SECRET)." }, { status: 500 });
    }

    // 1) Auth do usuário (Supabase JWT)
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

    // 2) Busca tokens Fitbit do usuário
    const { data: tokenRow, error: tokenErr } = await supabaseAdmin
      .from("fitbit_tokens")
      .select("user_id, fitbit_user_id, access_token, refresh_token, token_type, scope, expires_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenErr) {
      return NextResponse.json({ message: "Erro ao ler fitbit_tokens.", details: tokenErr.message }, { status: 500 });
    }

    const row = tokenRow as FitbitTokenRow | null;

    if (!row?.access_token) {
      return NextResponse.json({ message: "Usuário não está conectado ao Fitbit (sem access_token)." }, { status: 400 });
    }

    let accessToken = row.access_token;
    let refreshToken = row.refresh_token;

    // 3) Refresh se expirar (ou perto)
    const expiresAtIso = row.expires_at;
    const expiresAtMs = expiresAtIso ? new Date(expiresAtIso).getTime() : 0;
    const nowMs = Date.now();

    if (refreshToken && expiresAtMs && expiresAtMs - nowMs < 60_000) {
      const refreshed = await refreshFitbitToken(refreshToken);

      accessToken = refreshed.access_token;
      refreshToken = refreshed.refresh_token ?? refreshToken;

      const newExpiresIso =
        typeof refreshed.expires_in === "number"
          ? isoFromExpiresInSeconds(refreshed.expires_in)
          : new Date(nowMs + 3600 * 1000).toISOString(); // fallback 1h

      const { error: upErr } = await supabaseAdmin
        .from("fitbit_tokens")
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: refreshed.token_type ?? row.token_type ?? "Bearer",
          scope: refreshed.scope ?? row.scope,
          expires_at: newExpiresIso,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (upErr) {
        // não bloqueia o teste
        console.error("Erro ao atualizar fitbit_tokens refresh:", upErr);
      }
    }

    // 4) Puxa atividades do Fitbit (SEM salvar)
    const activitiesJson = await fetchFitbitActivities(accessToken);

    // resposta “amigável” (sem vazar tokens)
    const activities = activitiesJson?.activities ?? null;
    const summary = activitiesJson?.summary ?? null;

    return NextResponse.json({
      ok: true,
      user_id: userId,
      fitbit_user_id: row.fitbit_user_id,
      fetched_count: Array.isArray(activities) ? activities.length : 0,
      summary,
      activities, // pra você ver o payload e decidirmos o mapeamento depois
    });
  } catch (e: any) {
    console.error("Erro inesperado no fitbit sync:", e);
    return NextResponse.json(
      { message: "Erro inesperado no fitbit sync.", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
