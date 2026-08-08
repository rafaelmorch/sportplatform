import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GARMIN_TOKEN_URL =
  "https://diauth.garmin.com/di-oauth2-service/oauth/token";

const GARMIN_USER_ID_URL =
  "https://apis.garmin.com/wellness-api/rest/user/id";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.json(
      { ok: false, stage: "authorization", error },
      { status: 400 }
    );
  }

  if (!code || !state) {
    return NextResponse.json(
      {
        ok: false,
        stage: "callback",
        error: "Missing Garmin authorization code or state.",
      },
      { status: 400 }
    );
  }

  const cookieState =
    request.cookies.get("garmin_oauth_state")?.value ?? null;

  const codeVerifier =
    request.cookies.get("garmin_oauth_code_verifier")?.value ?? null;

  if (!cookieState || state !== cookieState) {
    return NextResponse.json(
      {
        ok: false,
        stage: "state_validation",
        error: "Garmin OAuth state mismatch.",
      },
      { status: 400 }
    );
  }

  if (!codeVerifier) {
    return NextResponse.json(
      {
        ok: false,
        stage: "pkce",
        error: "Garmin OAuth code verifier cookie is missing.",
      },
      { status: 400 }
    );
  }

  const clientId = process.env.GARMIN_CLIENT_ID;
  const clientSecret = process.env.GARMIN_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !clientSecret || !appUrl) {
    return NextResponse.json(
      {
        ok: false,
        stage: "configuration",
        error: "Garmin environment variables are not configured.",
      },
      { status: 500 }
    );
  }

  const redirectUri =
    `${appUrl.replace(/\/+$/, "")}/api/garmin/callback`;

  const basicAuth = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    state,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
  });

  const tokenResponse = await fetch(GARMIN_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: tokenBody.toString(),
    cache: "no-store",
  });

  const tokenPayload = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenPayload?.access_token) {
    return NextResponse.json(
      {
        ok: false,
        stage: "token_exchange",
        status: tokenResponse.status,
      },
      { status: 502 }
    );
  }

  const userResponse = await fetch(GARMIN_USER_ID_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const userPayload = await userResponse.json();

  if (!userResponse.ok) {
    return NextResponse.json(
      {
        ok: false,
        stage: "user_id",
        status: userResponse.status,
        garminResponse: userPayload,
      },
      { status: 502 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    stage: "user_id",
    user: userPayload,
  });

  response.cookies.set("garmin_oauth_state", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("garmin_oauth_code_verifier", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
