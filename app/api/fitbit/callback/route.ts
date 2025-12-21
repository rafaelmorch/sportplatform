import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // aqui vamos usar como user_id
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    const SITE_URL =
      process.env.NEXT_PUBLIC_SITE_URL || "https://sportsplatform.app";

    if (error) {
      return NextResponse.redirect(
        `${SITE_URL}/integrations?provider=fitbit&status=error&message=${encodeURIComponent(
          `${error}: ${errorDescription ?? ""}`.trim()
        )}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${SITE_URL}/integrations?provider=fitbit&status=error&message=${encodeURIComponent(
          "missing_code"
        )}`
      );
    }

    if (!state) {
      return NextResponse.redirect(
        `${SITE_URL}/integrations?provider=fitbit&status=error&message=${encodeURIComponent(
          "missing_state_user_id"
        )}`
      );
    }

    // ====== Exchange code -> tokens (Fitbit) ======
    const FITBIT_CLIENT_ID = requiredEnv("FITBIT_CLIENT_ID");
    const FITBIT_CLIENT_SECRET = requiredEnv("FITBIT_CLIENT_SECRET");
    const FITBIT_REDIRECT_URL = requiredEnv("FITBIT_REDIRECT_URL");

    const basic = Buffer.from(
      `${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`
    ).toString("base64");

    const body = new URLSearchParams();
    body.set("client_id", FITBIT_CLIENT_ID);
    body.set("grant_type", "authorization_code");
    body.set("redirect_uri", FITBIT_REDIRECT_URL);
    body.set("code", code);

    const tokenRes = await fetch("https://api.fitbit.com/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const tokenJson: any = await tokenRes.json();

    if (!tokenRes.ok) {
      return NextResponse.redirect(
        `${SITE_URL}/integrations?provider=fitbit&status=error&message=${encodeURIComponent(
          `token_exchange_failed: ${JSON.stringify(tokenJson)}`
        )}`
      );
    }

    const fitbitUserId = tokenJson.user_id as string | undefined;
    const accessToken = tokenJson.access_token as string | undefined;
    const refreshToken = tokenJson.refresh_token as string | undefined;
    const expiresIn = tokenJson.expires_in as number | undefined;
    const scope = tokenJson.scope as string | undefined;
    const tokenType = tokenJson.token_type as string | undefined;

    if (!fitbitUserId || !accessToken || !refreshToken) {
      return NextResponse.redirect(
        `${SITE_URL}/integrations?provider=fitbit&status=error&message=${encodeURIComponent(
          "invalid_token_payload"
        )}`
      );
    }

    const expiresAt =
      typeof expiresIn === "number"
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : null;

    // ====== Save tokens on Supabase (server-side) ======
    const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRole = requiredEnv("SUPABASE_SERVICE_ROLE");

    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false },
    });

    const userId = state;

    const { error: upsertError } = await admin.from("fitbit_tokens").upsert(
      {
        user_id: userId,
        fitbit_user_id: fitbitUserId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        scope: scope ?? null,
        token_type: tokenType ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,fitbit_user_id" }
    );

    if (upsertError) {
      return NextResponse.redirect(
        `${SITE_URL}/integrations?provider=fitbit&status=error&message=${encodeURIComponent(
          `db_upsert_failed: ${upsertError.message}`
        )}`
      );
    }

    return NextResponse.redirect(
      `${SITE_URL}/integrations?provider=fitbit&status=success&fitbit_user_id=${encodeURIComponent(
        fitbitUserId
      )}`
    );
  } catch (e: any) {
    const SITE_URL =
      process.env.NEXT_PUBLIC_SITE_URL || "https://sportsplatform.app";
    return NextResponse.redirect(
      `${SITE_URL}/integrations?provider=fitbit&status=error&message=${encodeURIComponent(
        e?.message ?? "unknown_error"
      )}`
    );
  }
}
