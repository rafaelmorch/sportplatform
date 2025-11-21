// app/api/strava/callback/route.ts
import { NextResponse } from "next/server";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

// Supabase (SERVER) – usa SERVICE_ROLE para poder inserir na tabela
function createServiceClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE não configurados.");
  }

  // import dinâmico para evitar problemas em edge runtimes
  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, serviceRoleKey);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.json(
        { message: "Erro retornado pelo Strava", error },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { message: "Code não recebido do Strava." },
        { status: 400 }
      );
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    const redirectUri = process.env.STRAVA_REDIRECT_URL;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        {
          message:
            "STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET ou STRAVA_REDIRECT_URL não configurados.",
        },
        { status: 500 }
      );
    }

    // 1) Trocar o code pelo access_token no Strava
    const tokenResponse = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return NextResponse.json(
        {
          message: "Erro ao trocar o code pelo token no Strava.",
          stravaError: tokenData,
        },
        { status: 400 }
      );
    }

    const {
      access_token,
      refresh_token,
      expires_at,
      token_type,
      athlete,
    } = tokenData;

    const athlete_id = athlete?.id;

    if (!athlete_id || !access_token || !refresh_token) {
      return NextResponse.json(
        {
          message: "Resposta do Strava incompleta.",
          tokenData,
        },
        { status: 500 }
      );
    }

    // 2) Salvar / atualizar no Supabase (tabela: strava_tokens)
    const supabase = createServiceClient();

    const { error: dbError } = await supabase.from("strava_tokens").upsert(
      {
        athlete_id,
        access_token,
        refresh_token,
        expires_at,
        token_type,
        // user_id: podemos ligar depois ao usuário logado
      },
      {
        onConflict: "athlete_id",
      }
    );

    if (dbError) {
      return NextResponse.json(
        {
          message: "Erro ao salvar tokens no Supabase.",
          supabaseError: dbError.message,
        },
        { status: 500 }
      );
    }

    // 3) Resposta amigável
    return NextResponse.json({
      message: "Conexão com Strava realizada e salva no Supabase com sucesso.",
      athlete_id,
      token_type,
      expires_at,
      access_token_last4: access_token.slice(-4),
      refresh_token_last4: refresh_token.slice(-4),
    });
  } catch (err: any) {
    console.error("Erro geral no callback do Strava:", err);
    return NextResponse.json(
      {
        message: "Erro inesperado no callback do Strava.",
        error: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}
