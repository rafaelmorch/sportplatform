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

export async function GET(request: NextRequest) {
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

  const { data, error } = await supabaseAdmin
    .from("garmin_connections")
    .select("garmin_user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) {
    console.error("Garmin status error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to check Garmin connection.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    connected: !!data?.garmin_user_id,
  });
}
