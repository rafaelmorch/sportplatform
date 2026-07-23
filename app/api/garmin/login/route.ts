import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function toBase64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function GET() {
  const clientId = process.env.GARMIN_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId) {
    return NextResponse.json(
      { error: "GARMIN_CLIENT_ID is not configured." },
      { status: 500 }
    );
  }

  if (!appUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL is not configured." },
      { status: 500 }
    );
  }

  const normalizedAppUrl = appUrl.replace(/\/+$/, "");
  const redirectUri = `${normalizedAppUrl}/api/garmin/callback`;

  const codeVerifier = toBase64Url(randomBytes(64));
  const codeChallenge = toBase64Url(
    createHash("sha256").update(codeVerifier).digest()
  );
  const state = toBase64Url(randomBytes(32));

  const authorizationUrl = new URL(
    "https://connect.garmin.com/oauth2Confirm"
  );

  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizationUrl);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 10 * 60,
    path: "/",
  };

  response.cookies.set("garmin_oauth_state", state, cookieOptions);
  response.cookies.set(
    "garmin_oauth_code_verifier",
    codeVerifier,
    cookieOptions
  );

  return response;
}
