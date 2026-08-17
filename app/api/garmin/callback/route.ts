import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  const appUserId =
    request.cookies.get("garmin_oauth_app_user_id")?.value ?? null;

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

  if (!appUserId) {
    return NextResponse.json(
      {
        ok: false,
        stage: "user_link",
        error: "Platform Sports user cookie is missing.",
      },
      { status: 400 }
    );
  }

  const clientId = process.env.GARMIN_CLIENT_ID;
  const clientSecret = process.env.GARMIN_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const supabaseUrl =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE;

  if (
    !clientId ||
    !clientSecret ||
    !appUrl ||
    !supabaseUrl ||
    !serviceRole
  ) {
    return NextResponse.json(
      {
        ok: false,
        stage: "configuration",
        error: "Required environment variables are not configured.",
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

  const garminUserId =
    typeof userPayload?.userId === "string"
      ? userPayload.userId
      : typeof userPayload === "string"
        ? userPayload
        : null;

  if (!garminUserId) {
    return NextResponse.json(
      {
        ok: false,
        stage: "user_id",
        error: "Garmin user ID was not returned.",
      },
      { status: 502 }
    );
  }

  const expiresInSeconds =
    typeof tokenPayload?.expires_in === "number"
      ? tokenPayload.expires_in
      : null;

  const expiresAt = expiresInSeconds
    ? new Date(
        Date.now() + expiresInSeconds * 1000
      ).toISOString()
    : null;

  const supabaseAdmin = createClient(
    supabaseUrl,
    serviceRole,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const { error: upsertError } =
    await supabaseAdmin
      .from("garmin_connections")
      .upsert(
        {
          user_id: appUserId,
          garmin_user_id: garminUserId,
          access_token: tokenPayload.access_token,
          refresh_token:
            tokenPayload.refresh_token ?? null,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

  if (upsertError) {
    console.error(
      "Garmin connection upsert error:",
      upsertError
    );

    return NextResponse.json(
      {
        ok: false,
        stage: "database",
        error: "Failed to save Garmin connection.",
      },
      { status: 500 }
    );
  }

  const { error: linkEventsError } =
    await supabaseAdmin
      .from("garmin_webhook_events")
      .update({
        app_user_id: appUserId,
      })
      .eq("garmin_user_id", garminUserId)
      .is("app_user_id", null);

  if (linkEventsError) {
    console.error(
      "Garmin webhook event linking error:",
      linkEventsError
    );
  }

  const response = NextResponse.redirect(
    `${appUrl.replace(/\/+$/, "")}/integrations?provider=garmin&status=success`
  );

  const clearCookieOptions = {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };

  response.cookies.set(
    "garmin_oauth_state",
    "",
    clearCookieOptions
  );

  response.cookies.set(
    "garmin_oauth_code_verifier",
    "",
    clearCookieOptions
  );

  response.cookies.set(
    "garmin_oauth_app_user_id",
    "",
    clearCookieOptions
  );

  return response;
}
