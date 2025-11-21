// app/api/strava/auth/route.ts
import { NextResponse } from "next/server";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_REDIRECT_URL =
  process.env.STRAVA_REDIRECT_URL ?? "https://sportplatform.app/api/strava/callback";

export async function GET() {
  if (!STRAVA_CLIENT_ID || !STRAVA_REDIRECT_URL) {
    return NextResponse.json(
      {
        message:
          "STRAVA_CLIENT_ID ou STRAVA_REDIRECT_URL não configurados no servidor.",
      },
      { status: 500 }
    );
  }

  const state =
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)) ?? "";

  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    response_type: "code",
    redirect_uri: STRAVA_REDIRECT_URL,
    approval_prompt: "auto",
    scope: "read,activity:read_all",
    state,
  });

  const url = `https://www.strava.com/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(url);
}
