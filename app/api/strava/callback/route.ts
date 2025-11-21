// app/api/strava/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REDIRECT_URL = process.env.STRAVA_REDIRECT_URL;

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;

// Cliente ADMIN (server-side) – pode escrever em qualquer tabela
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

type StravaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix (segundos)
  token_type?: string;
  athlete: { id: number; firstname?: string; lastname?: string };
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state"); // usado para receber o user_id

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

    // 1) Trocar o "code" pelo access_token / refresh_token no Strava
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

    // 2) Tentar extrair user_id do state (vem da tela de integração)
    let userId: string | null = null;
    if (state && /^[0-9a-fA-F-]{36}$/.test(state)) {
      userId = state;
    } else {
      console.warn(
        "State ausente ou não é um UUID válido. Nenhum user_id será associado:",
        state
      );
    }

    const nowIso = new Date().toISOString();
    const expiresIso = new Date(expires_at * 1000).toISOString();

    // 3) Salvar / atualizar tokens no Supabase
    //    Aqui estamos usando athlete_id como chave única (onConflict)
    const { error: dbError } = await supabaseAdmin
      .from("strava_tokens")
      .upsert(
        {
          athlete_id: athleteId,
          access_token,
          refresh_token,
          token_type: token_type ?? "Bearer",
          expires_at: expiresIso,
          user_id: userId,
          updated_at: nowIso,
        },
        {
          onConflict: "athlete_id",
        }
      );

    if (dbError) {
      console.error("Erro ao salvar tokens no Supabase:", dbError);
      return NextResponse.json(
        {
          message:
            "Conexão com Strava feita, mas houve erro ao salvar os tokens no Supabase.",
          dbError,
        },
        { status: 500 }
      );
    }

    // 4) Redirecionar para página de sucesso (ou dashboard)
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;

    const redirectUrl = new URL("/strava/success", baseUrl);
    redirectUrl.searchParams.set("athlete_id", String(athleteId));

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("Erro inesperado no callback do Strava:", err);
    return NextResponse.json(
      { message: "Erro inesperado no callback do Strava." },
      { status: 500 }
    );
  }
}
