import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processChallengeCompletions } from "@/lib/membership/processChallengeCompletions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const expectedSecret =
      process.env.INTERNAL_API_SECRET?.trim();

    const receivedSecret =
      req.headers.get("x-internal-secret")?.trim();

    if (
      !expectedSecret ||
      !receivedSecret ||
      receivedSecret !== expectedSecret
    ) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const userId =
      typeof body?.userId === "string"
        ? body.userId.trim()
        : "";

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "userId is required." },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.SUPABASE_URL?.trim();

    const serviceRole =
      (
        process.env.SUPABASE_SERVICE_ROLE_KEY ??
        process.env.SUPABASE_SERVICE_ROLE
      )?.trim();

    if (!supabaseUrl || !serviceRole) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing Supabase server configuration.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRole,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const result =
      await processChallengeCompletions({
        supabase,
        userId,
      });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
