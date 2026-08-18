import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function pickAuthBearer(req: NextRequest): string | null {
  const header =
    req.headers.get("authorization") ??
    req.headers.get("Authorization");

  if (!header) return null;

  const match = header.match(/^Bearer\s+(.+)$/i);

  return match ? match[1].trim() : null;
}

export async function POST(request: NextRequest) {
  const supabaseUrl =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE;

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

  const { data: connection, error: connectionError } =
    await supabaseAdmin
      .from("garmin_connections")
      .select("garmin_user_id, access_token")
      .eq("user_id", userData.user.id)
      .maybeSingle();

  if (connectionError) {
    console.error(
      "Garmin revoke connection lookup error:",
      connectionError
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load Garmin connection.",
      },
      { status: 500 }
    );
  }

  if (!connection?.access_token) {
    return NextResponse.json(
      {
        ok: false,
        error: "Garmin account is not connected.",
      },
      { status: 404 }
    );
  }

  const garminResponse = await fetch(
    "https://apis.garmin.com/wellness-api/rest/user/registration",
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
      },
    }
  );

  if (garminResponse.status !== 204) {
    const errorText =
      await garminResponse.text().catch(() => "");

    console.error(
      "Garmin deregistration request failed:",
      garminResponse.status,
      errorText
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Garmin deregistration request failed.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    deregistration_requested: true,
  });
}
