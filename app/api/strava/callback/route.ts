import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ garante Buffer disponível (Node runtime)
export const runtime = "nodejs";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REDIRECT_URL = process.env.STRAVA_REDIRECT_URL;

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

type StravaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix seconds
  token_type?: string;
  athlete: { id: number; firstname?: string; lastname?: string };
};

type StravaActivity = {
  id: number;
  name?: string | null;
  type?: string | null;
  sport_type?: string | null;
  start_date?: string | null;
  distance?: number | null;
  moving_time?: number | null;
  total_elevation_gain?: number | null;
};

function isUuid(v: string) {
  return /^[0-9a-fA-F-]{36}$/.test(v);
}

async function fetchStravaActivities(params: {
  accessToken: string;
  afterUnixSeconds?: number; // pega atividades depois desse timestamp
  maxPages?: number;
  perPage?: number;
}) {
  const { accessToken, afterUnixSeconds, maxPages = 3, perPage = 50 } = params;

  const all: StravaActivity[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = new URL("https://www.strava.com/api/v3/athlete/activities");
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));
    if (afterUnixSeconds && afterUnixSeconds > 0) {
      url.searchParams.set("after", String(afterUnixSeconds));
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const json = (await res.json()) as any;

    if (!res.ok) {
      console.error("Erro Strava /athlete/activities:", json);
      throw new Error(
        `Strava activities failed: ${res.status} ${JSON.stringify(json)}`
      );
    }

    const pageItems = (Array.isArray(json) ? json : []) as StravaActivity[];
    all.push(...pageItems);

    // se veio menos que perPage, acabou
    if (pageItems.length < perPage) break;
  }

  return all;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state"); // esperado: user.id (uuid)

    if (error) {
      console.error("Erro retornado pelo Strava:", error);
      return NextResponse.json(
        { message: "Erro retornado pelo Strava.", error },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { message: "Code não recebido do Strava." },
        { status: 400 }
      );
    }

    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REDIRECT_URL) {
      console.error("Variáveis STRAVA não configuradas corretamente.");
      return NextResponse.json(
        {
          message:
            "STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET ou STRAVA_REDIRECT_URL não configurados.",
        },
        { status: 500 }
      );
    }

    // 1) Trocar code por tokens no Strava
    const tokenRes = await fetch("https://www.strava.com/api/v3/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: STRAVA_REDIRECT_URL,
      }),
    });

    const tokenJson = (await tokenRes.json()) as StravaTokenResponse & {
      [key: string]: any;
    };

    if (!tokenRes.ok) {
      console.error("Erro Strava /oauth/token:", tokenJson);
      return NextResponse.json(
        {
          message: "Erro ao trocar o code pelo token no Strava.",
          strava_error: tokenJson,
        },
        { status: 400 }
      );
    }

    const { access_token, refresh_token, expires_at, token_type, athlete } =
      tokenJson;

    if (!athlete?.id) {
      console.error("Resposta do Strava sem athlete.id:", tokenJson);
      return NextResponse.json(
        { message: "Resposta do Strava sem athlete.id." },
        { status: 400 }
      );
    }

    const athleteId = athlete.id;

    // 2) Resolver user_id (do Supabase) vindo no state
    let userId: string | null = null;
    if (state && isUuid(state)) {
      userId = state;
    } else if (state) {
      console.warn("State inválido no callback do Strava:", state);
    }

    // 3) Salvar tokens no Supabase
    const nowIso = new Date().toISOString();
    const expiresIso = new Date(expires_at * 1000).toISOString();

    const { error: dbError } = await supabaseAdmin.from("strava_tokens").upsert(
      {
        athlete_id: athleteId,
        access_token,
        refresh_token,
        token_type: token_type ?? "Bearer",
        expires_at: expiresIso,
        user_id: userId,
        updated_at: nowIso,
      },
      { onConflict: "athlete_id" }
    );

    if (dbError) {
      console.error("Erro ao salvar tokens do Strava no Supabase:", dbError);
      return NextResponse.json(
        {
          message:
            "Conexão com Strava feita, mas houve erro ao salvar os tokens no Supabase.",
          dbError,
        },
        { status: 500 }
      );
    }

    // 3.5) Marcar a integração preferida (evita somar Strava + Fitbit)
    if (userId) {
      const { error: prefErr } = await supabaseAdmin
        .from("user_integrations")
        .upsert(
          {
            user_id: userId,
            preferred_provider: "strava",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (prefErr) {
        console.error("Erro ao salvar user_integrations (strava):", prefErr);
        // não bloqueia o fluxo
      }
    }

    // ✅ 4) SYNC AUTOMÁTICO: puxar atividades e salvar em strava_activities
    // estratégia simples e segura: pegar últimos 120 dias (pega o que você acabou de criar)
    const afterUnix = Math.floor(Date.now() / 1000) - 120 * 24 * 60 * 60;

    let syncedCount = 0;
    try {
      const activities = await fetchStravaActivities({
        accessToken: access_token,
        afterUnixSeconds: afterUnix,
        maxPages: 5, // 5 páginas x 50 = até 250 atividades recentes
        perPage: 50,
      });

      if (activities.length > 0) {
        const rows = activities.map((a) => ({
          // IMPORTANTÍSSIMO:
          // aqui assumimos que sua coluna "id" aceita string (ex: text).
          // se for UUID, isso vai falhar — mas pelo seu dashboard e tipos, tende a ser text.
          id: String(a.id),
          athlete_id: athleteId,
          name: a.name ?? null,
          type: a.type ?? null,
          sport_type: a.sport_type ?? null,
          start_date: a.start_date ?? null,
          distance: a.distance ?? null,
          moving_time: a.moving_time ?? null,
          total_elevation_gain: a.total_elevation_gain ?? null,
        }));

        // tenta upsert por "id"
        const { error: upsertErr } = await supabaseAdmin
          .from("strava_activities")
          .upsert(rows, { onConflict: "id" });

        if (upsertErr) {
          // fallback se não existir constraint/unique em id
          console.error("Upsert strava_activities falhou:", upsertErr);

          // tenta insert simples (pode duplicar se rodar várias vezes, mas pelo menos traz as atividades)
          const { error: insertErr } = await supabaseAdmin
            .from("strava_activities")
            .insert(rows);

          if (insertErr) {
            console.error("Insert strava_activities também falhou:", insertErr);
          } else {
            syncedCount = rows.length;
          }
        } else {
          syncedCount = rows.length;
        }
      }
    } catch (syncErr) {
      console.error("SYNC Strava falhou (não bloqueia login):", syncErr);
      // não bloqueia o redirect
    }

    // 5) Redirect final (web)
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;

    const redirectUrl = new URL("/integrations", baseUrl);
    redirectUrl.searchParams.set("provider", "strava");
    redirectUrl.searchParams.set("status", "success");
    redirectUrl.searchParams.set("athlete_id", String(athleteId));
    redirectUrl.searchParams.set("synced", String(syncedCount)); // só pra debug (opcional)

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("Erro inesperado no callback do Strava:", err);
    return NextResponse.json(
      { message: "Erro inesperado no callback do Strava." },
      { status: 500 }
    );
  }
}
