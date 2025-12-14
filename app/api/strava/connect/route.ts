import { NextRequest, NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sportsplatform.app";

const STRAVA_CLIENT_ID =
  process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID ?? process.env.STRAVA_CLIENT_ID;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // pode vir como ?state=UUID ou token do app
    const state = searchParams.get("state") ?? "";

    if (!STRAVA_CLIENT_ID) {
      console.error("STRAVA_CLIENT_ID/NEXT_PUBLIC_STRAVA_CLIENT_ID não definido.");
      return NextResponse.json(
        { message: "STRAVA client id não configurado no servidor." },
        { status: 500 }
      );
    }

    // callback "oficial" do Strava no seu site (o mesmo que você já usa)
    const redirectUri = `${SITE_URL}/api/strava/callback`;

    const stravaAuth = new URL("https://www.strava.com/oauth/authorize");
    stravaAuth.searchParams.set("client_id", String(STRAVA_CLIENT_ID));
    stravaAuth.searchParams.set("response_type", "code");
    stravaAuth.searchParams.set("redirect_uri", redirectUri);
    stravaAuth.searchParams.set("approval_prompt", "auto");
    stravaAuth.searchParams.set("scope", "read,activity:read_all");

    if (state) {
      stravaAuth.searchParams.set("state", state);
    }

    return NextResponse.redirect(stravaAuth.toString());
  } catch (err) {
    console.error("Erro ao iniciar OAuth Strava:", err);
    return NextResponse.json(
      { message: "Erro ao iniciar conexão com Strava." },
      { status: 500 }
    );
  }
}
