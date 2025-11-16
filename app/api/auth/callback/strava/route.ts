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

    // Lê as variáveis de ambiente
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    const redirectUri = process.env.STRAVA_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("Variáveis de ambiente STRAVA não configuradas corretamente.");
      return new NextResponse(
        "Erro de configuração: variáveis STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET ou STRAVA_REDIRECT_URI não definidas.",
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

    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Falha ao trocar code por token no Strava:", errorText);
      return new NextResponse(
        "Erro ao trocar o code pelo token no Strava.",
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();

    console.log("Strava tokenData =>", tokenData);

    // POR ENQUANTO: apenas mostrar o resultado na tela para teste
    return NextResponse.json(
      {
        message: "Conexão com Strava realizada com sucesso.",
        received_code: code,
        token_type: tokenData.token_type,
        access_token_last4: tokenData.access_token?.slice(-4),
        athlete_id: tokenData.athlete?.id,
        expires_at: tokenData.expires_at,
        refresh_token_last4: tokenData.refresh_token?.slice(-4),
        // Se quiser ver tudo, pode descomentar a linha abaixo (cuidado, mostra o token inteiro):
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
