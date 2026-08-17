import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function toBase64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function pickAuthBearer(req: NextRequest): string | null {
  const header =
    req.headers.get("authorization") ??
    req.headers.get("Authorization");

  if (!header) return null;

  const match = header.match(/^Bearer\s+(.+)$/i);

  return match ? match[1].trim() : null;
}

export async function POST(request: NextRequest) {
  const clientId = process.env.GARMIN_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const supabaseUrl =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE;

  if (!clientId || !appUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "Garmin environment variables are not configured.",
      },
      { status: 500 }
    );
  }

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json(
      {
        ok: false,
        error: "Supabase server environment variables are not configured.",
      },
      { status: 500 }
    );
  }

  const jwt = pickAuthBearer(request);

  if (!jwt) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing Authorization Bearer token.",
      },
      { status: 401 }
    );
  }

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

  const {
    data: userData,
    error: userError,
  } = await supabaseAdmin.auth.getUser(jwt);

  if (userError || !userData?.user) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid or expired Platform Sports session.",
      },
      { status: 401 }
    );
  }

  const appUserId = userData.user.id;

  const normalizedAppUrl =
    appUrl.replace(/\/+$/, "");

  const redirectUri =
    `${normalizedAppUrl}/api/garmin/callback`;

  const codeVerifier =
    toBase64Url(randomBytes(64));

  const codeChallenge =
    toBase64Url(
      createHash("sha256")
        .update(codeVerifier)
        .digest()
    );

  const state =
    toBase64Url(randomBytes(32));

  const authorizationUrl =
    new URL(
      "https://connect.garmin.com/oauth2Confirm"
    );

  authorizationUrl.searchParams.set(
    "client_id",
    clientId
  );

  authorizationUrl.searchParams.set(
    "response_type",
    "code"
  );

  authorizationUrl.searchParams.set(
    "redirect_uri",
    redirectUri
  );

  authorizationUrl.searchParams.set(
    "code_challenge",
    codeChallenge
  );

  authorizationUrl.searchParams.set(
    "code_challenge_method",
    "S256"
  );

  authorizationUrl.searchParams.set(
    "state",
    state
  );

  const response = NextResponse.json({
    ok: true,
    authorizationUrl:
      authorizationUrl.toString(),
  });

  const cookieOptions = {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 10 * 60,
    path: "/",
  };

  response.cookies.set(
    "garmin_oauth_state",
    state,
    cookieOptions
  );

  response.cookies.set(
    "garmin_oauth_code_verifier",
    codeVerifier,
    cookieOptions
  );

  response.cookies.set(
    "garmin_oauth_app_user_id",
    appUserId,
    cookieOptions
  );

  return response;
}
