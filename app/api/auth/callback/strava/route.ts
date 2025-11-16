import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Lê as variáveis do Supabase (somente no servidor)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE são obrigatórios.");
}

// Client do Supabase usando a SERVICE ROLE (apenas em rotas server-side)
const supabase = createClient(supabaseUrl, supabaseServiceRole);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const state = url.searchParams.get("state"); // vamos usar como user_id
    const userId = state && state !== "" ? state : null;

    if (error) {
      console.error("Erro retornado pelo Strava:", error);
      return new NextResponse(
        `Erro ao conectar com o Strava: ${error}`,
        { status: 400 }
      );
    }

    if (!code) {
      return new NextResponse(
        "Nenhum code foi recebido do Strava.",
        { status: 400 }
      );
    }

    // Variáveis do Strava
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Variáveis STRAVA não configuradas corretamente:", {
        clientId,
        clientSecret,
      });
      return new NextResponse(
        "Erro: variáveis STRAVA_CLIENT_ID ou STRAVA_CLIENT_SECRET não definidas.",
        { status: 500 }
      );
    }

    // Body para trocar o code pelo token
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    });

    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Erro Strava ao trocar code pelo token:", errorText);

      return new NextResponse(
        `Erro ao trocar o code pelo token no Strava:\n\n${errorText}`,
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();

    console.log("Strava tokenData =>", tokenData);

    const athleteId = tokenData.athlete?.id;
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const tokenType = tokenData.token_type;
    const expiresAt = tokenData.expires_at;

    if (!athleteId || !accessToken || !refreshToken || !tokenType || !expiresAt) {
      console.error("Dados incompletos retornados pelo Strava:", tokenData);
      return new NextResponse(
        "Dados incompletos retornados pelo Strava ao trocar o code pelo token.",
        { status: 500 }
      );
    }

    // Monta dados para upsert
    const upsertData: any = {
      athlete_id: athleteId,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: tokenType,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    };

    // Se veio um userId no state, salva junto
    if (userId) {
      upsertData.user_id = userId;
    }

    // 🔹 Salvar (ou atualizar) no Supabase: tabela public.strava_tokens
    const { error: dbError } = await supabase
      .from("strava_tokens")
      .upsert(upsertData, {
        onConflict: "athlete_id", // se já existir esse athlete_id, atualiza
      });

    if (dbError) {
      console.error("Erro ao salvar tokens do Strava no Supabase:", dbError);
      return new NextResponse(
        "Falha ao salvar os tokens do Strava no banco de dados.",
        { status: 500 }
      );
    }

    // Resposta de sucesso (por enquanto em JSON)
    return NextResponse.json(
      {
        message: "Conexão com Strava realizada e salva no Supabase com sucesso.",
        athlete_id: athleteId,
        user_id: userId,
        token_type: tokenType,
        expires_at: expiresAt,
        access_token_last4: String(accessToken).slice(-4),
        refresh_token_last4: String(refreshToken).slice(-4),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erro inesperado no callback do Strava:", err);
    return new NextResponse(
      "Erro inesperado ao processar o callback do Strava.",
      { status: 500 }
    );
  }
}
