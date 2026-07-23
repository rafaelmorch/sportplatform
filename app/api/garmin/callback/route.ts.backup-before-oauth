import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const cookieState =
    request.cookies.get("garmin_oauth_state")?.value ?? null;

  const codeVerifier =
    request.cookies.get("garmin_oauth_code_verifier")?.value ?? null;

  return NextResponse.json({
    error,
    code,
    state,
    cookieState,
    stateMatches: state === cookieState,
    hasCodeVerifier: !!codeVerifier,
  });
}
