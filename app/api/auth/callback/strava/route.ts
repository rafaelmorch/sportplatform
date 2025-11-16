import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

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

    // Variáveis de ambiente
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    const redirectUri = process.env.STRAVA_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("Variáveis STRAVA não configuradas corretamente:", {
        clientId, clientSecret, redirectUri
      });
      return new NextResponse(
        "Erro: variáveis STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET ou STRAVA_REDIRECT_URI não definidas.",
        { status: 500 }
      );
    }

    // Monta o body para trocar o code pelo token
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    // POST para o Strava
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    // Se o Strava deu erro, mostrar o erro completo
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Erro Strava ao trocar code pelo token:", errorText);
      
      return new NextResponse(
        `Erro ao trocar o code pelo token no Strava:\n\n${errorText}`,
        { status: 500 }
      );
    }

    // Se deu certo, pegar o token JSON
    const tokenData = await tokenResponse.json();

    console.log("Strava tokenData =>", tokenData);

    // Retornar resultado simplificado (debug apenas)
    return NextResponse.json(
      {
        message: "Conexão com Strava realizada com sucesso.",
        received_code: code,
        athlete_id: tokenData.athlete?.id,
        token_type: tokenData.token_type,
        expires_at: tokenData.expires_at,
        access_token_last4: tokenData.access_token?.slice(-4),
        refresh_token_last4: tokenData.refresh_token?.slice(-4),
        // Para debug completo, descomente:
        // raw: tokenData,
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
