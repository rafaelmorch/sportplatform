// app/api/strava/auth/route.ts
import { NextResponse } from "next/server";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_REDIRECT_URL = process.env.STRAVA_REDIRECT_URL;

export async function GET() {
  if (!STRAVA_CLIENT_ID || !STRAVA_REDIRECT_URL) {
    console.error("STRAVA_CLIENT_ID ou STRAVA_REDIRECT_URL não configurados.");
    return NextResponse.json(
      { error: "STRAVA_CLIENT_ID ou STRAVA_REDIRECT_URL não configurados." },
      { status: 500 },
    );
  }

  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: STRAVA_REDIRECT_URL,
    response_type: "code",
    scope: "read,activity:read_all",
    approval_prompt: "auto",
  });

  const url = `https://www.strava.com/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(url);
}
