// app/api/strava/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;

type StravaRefreshResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix seconds
  token_type?: string;
  athlete?: { id: number };
};

type StravaActivity = {
  id: number;
  athlete?: { id: number };
  name?: string;
  type?: string;
  sport_type?: string;
  start_date?: string; // ISO
  start_date_local?: string; // ISO
  timezone?: string;
  distance?: number; // meters
  moving_time?: number; // seconds
  elapsed_time?: number; // seconds
  total_elevation_gain?: number; // meters
  average_speed?: number;
  max_speed?: number;
  trainer?: boolean;
  commute?: boolean;
  private?: boolean;
  flagged?: boolean;
  map?: { summary_polyline?: string | null };
};

function pickAuthBearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

async function refreshStravaToken(refreshToken: string) {
  const res = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const json = (await res.json()) as StravaRefreshResponse & { [k: string]: any };

  if (!res.ok) {
    throw new Error(`Strava refresh failed: ${JSON.stringify(json)}`);
  }

  return json;
}

function toIsoFromUnixSeconds(s: number): string {
  return new Date(s * 1000).toISOString();
}

export async function GET(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return NextResponse.json({ message: "Supabase env não configurado." }, { status: 500 });
    }
    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
      return NextResponse.json({ message: "Strava env não configurado." }, { status: 500 });
    }

    // 1) Autentica usuário via JWT do Supabase (enviado pelo client)
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

    // 2) Busca tokens Strava do usuário
    const { data: tokenRow, error: tokenErr } = await supabaseAdmin
      .from("strava_tokens")
      .select("athlete_id, access_token, refresh_token, expires_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenErr) {
      return NextResponse.json(
        { message: "Erro ao ler strava_tokens.", details: tokenErr.message },
        { status: 500 }
      );
    }

    if (!tokenRow?.athlete_id || !tokenRow?.access_token) {
      return NextResponse.json(
        { message: "Usuário não está conectado ao Strava (sem tokens)." },
        { status: 400 }
      );
    }

    let accessToken = tokenRow.access_token as string;
    let refreshToken = (tokenRow.refresh_token as string) ?? null;

    // expires_at no seu banco está como ISO string
    const expiresAtIso = tokenRow.expires_at as string | null;
    const expiresAtMs = expiresAtIso ? new Date(expiresAtIso).getTime() : 0;
    const nowMs = Date.now();

    // 3) Refresh se estiver expirado (ou perto)
    if (refreshToken && expiresAtMs && expiresAtMs - nowMs < 60_000) {
      const refreshed = await refreshStravaToken(refreshToken);

      accessToken = refreshed.access_token;
      refreshToken = refreshed.refresh_token ?? refreshToken;

      const newExpiresIso = toIsoFromUnixSeconds(refreshed.expires_at);

      const { error: upErr } = await supabaseAdmin
        .from("strava_tokens")
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: newExpiresIso,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("athlete_id", tokenRow.athlete_id);

      if (upErr) {
        console.error("Erro ao atualizar tokens refreshed:", upErr);
      }
    }

    const athleteId = tokenRow.athlete_id as number;

    // 4) Incremental sync: pega o maior start_date do athlete no banco
    const { data: lastRow, error: lastErr } = await supabaseAdmin
      .from("strava_activities")
      .select("start_date")
      .eq("athlete_id", athleteId)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastErr) {
      return NextResponse.json(
        { message: "Erro ao ler último start_date.", details: lastErr.message },
        { status: 500 }
      );
    }

    // "after" do Strava é unix seconds. Buffer 24h.
    let afterUnix: number | null = null;
    if (lastRow?.start_date) {
      const lastMs = new Date(lastRow.start_date).getTime();
      if (!Number.isNaN(lastMs) && lastMs > 0) {
        afterUnix = Math.floor((lastMs - 24 * 3600 * 1000) / 1000);
      }
    }

    // 5) Buscar atividades do Strava (paginado)
    const perPage = 200;
    let page = 1;
    const all: StravaActivity[] = [];

    while (true) {
      const url = new URL("https://www.strava.com/api/v3/athlete/activities");
      url.searchParams.set("per_page", String(perPage));
      url.searchParams.set("page", String(page));
      if (afterUnix) url.searchParams.set("after", String(afterUnix));

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const json = (await res.json()) as any;

      if (!res.ok) {
        console.error("Erro Strava athlete/activities:", json);
        return NextResponse.json(
          { message: "Erro ao buscar activities no Strava.", strava_error: json },
          { status: 400 }
        );
      }

      const batch = (json as StravaActivity[]) ?? [];
      all.push(...batch);

      if (batch.length < perPage) break;
      page += 1;
      if (page > 20) break; // trava de segurança
    }

    // 6) Upsert no Supabase (CORRIGIDO: usa activity_id e NÃO mexe no id uuid)
    if (all.length > 0) {
      const nowIso = new Date().toISOString();

      const rows = all
        .filter((a) => a?.id && a?.start_date)
        .map((a) => ({
          activity_id: a.id, // ✅ ID do Strava vai aqui
          athlete_id: athleteId,
          name: a.name ?? null,
          type: a.type ?? null,
          sport_type: a.sport_type ?? null,
          start_date: a.start_date ?? null,
          start_date_local: a.start_date_local ?? null,
          timezone: a.timezone ?? null,
          distance: a.distance ?? null,
          moving_time: a.moving_time ?? null,
          elapsed_time: a.elapsed_time ?? null,
          total_elevation_gain: a.total_elevation_gain ?? null,
          average_speed: a.average_speed ?? null,
          max_speed: a.max_speed ?? null,
          is_trainer: a.trainer ?? null,
          is_commute: a.commute ?? null,
          is_private: a.private ?? null,
          is_flagged: a.flagged ?? null,
          map_summary_polyline: a.map?.summary_polyline ?? null,
          raw: a, // ✅ guarda o json
          updated_at: nowIso,
        }));

      const { error: insErr } = await supabaseAdmin
        .from("strava_activities")
        .upsert(rows, { onConflict: "activity_id" }); // ✅ chave correta

      if (insErr) {
        return NextResponse.json(
          { message: "Erro ao upsert em strava_activities.", details: insErr.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      user_id: userId,
      athlete_id: athleteId,
      fetched: all.length,
      note: afterUnix ? "incremental_after" : "full_fetch_first_time",
    });
  } catch (e: any) {
    console.error("Erro inesperado no sync:", e);
    return NextResponse.json(
      { message: "Erro inesperado no sync.", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
