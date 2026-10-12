import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const url =
    process.env.SUPABASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function authenticate(req: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { error: "Missing Supabase configuration.", status: 500 };
  }

  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!token) {
    return { error: "Authentication required.", status: 401 };
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { error: "Invalid session.", status: 401 };
  }

  return { supabase, userId: data.user.id };
}

export async function POST(req: Request) {
  try {
    const auth = await authenticate(req);

    if ("error" in auth) {
      return NextResponse.json(
        { ok: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { supabase, userId } = auth;

    const { data: current, error: readError } = await supabase
      .from("user_activity_source")
      .select("provider")
      .eq("user_id", userId)
      .maybeSingle();

    if (readError) {
      return NextResponse.json(
        { ok: false, error: "Failed to check activity source." },
        { status: 500 }
      );
    }

    if (current?.provider && current.provider !== "apple_health") {
      return NextResponse.json(
        {
          ok: false,
          error: "Another activity source is already connected.",
          activeProvider: current.provider,
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    const { error: saveError } = await supabase
      .from("user_activity_source")
      .upsert(
        {
          user_id: userId,
          provider: "apple_health",
          connected_at: now,
          updated_at: now,
        },
        { onConflict: "user_id" }
      );

    if (saveError) {
      return NextResponse.json(
        { ok: false, error: "Failed to connect Apple Health." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      provider: "apple_health",
    });
  } catch (error) {
    console.error("Apple Health connection error:", error);

    return NextResponse.json(
      { ok: false, error: "Unexpected connection error." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await authenticate(req);

    if ("error" in auth) {
      return NextResponse.json(
        { ok: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { supabase, userId } = auth;

    const { error } = await supabase
      .from("user_activity_source")
      .delete()
      .eq("user_id", userId)
      .eq("provider", "apple_health");

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Failed to disconnect Apple Health." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      disconnected: true,
    });
  } catch (error) {
    console.error("Apple Health disconnection error:", error);

    return NextResponse.json(
      { ok: false, error: "Unexpected disconnection error." },
      { status: 500 }
    );
  }
}
