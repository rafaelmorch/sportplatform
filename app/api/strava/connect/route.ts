import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_REDIRECT_URL = process.env.STRAVA_REDIRECT_URL!;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state") ?? "";

    if (!STRAVA_CLIENT_ID || !STRAVA_REDIRECT_URL) {
      return NextResponse.json(
        { message: "STRAVA_CLIENT_ID ou STRAVA_REDIRECT_URL não configurados." },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      client_id: STRAVA_CLIENT_ID,
      response_type: "code",
      redirect_uri: STRAVA_REDIRECT_URL,
      approval_prompt: "auto",
      scope: "read,activity:read_all",
    });

    if (state) params.set("state", state);

    const url = `https://www.strava.com/oauth/authorize?${params.toString()}`;
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("Erro ao iniciar OAuth do Strava:", err);
    return NextResponse.json(
      { message: "Erro ao iniciar conexão com Strava." },
      { status: 500 }
    );
  }
}
