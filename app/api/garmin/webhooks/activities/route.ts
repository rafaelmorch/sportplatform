import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "garmin-webhook",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    console.log("Garmin webhook received:", JSON.stringify(body));

    if (!body || !Array.isArray(body.activities)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid Garmin activities payload.",
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const rows = body.activities.map((activity: Record<string, unknown>) => ({
      event_type: "activity",
      garmin_user_id:
        typeof activity.userId === "string"
          ? activity.userId
          : null,
      external_id:
        activity.activityId != null
          ? String(activity.activityId)
          : activity.summaryId != null
            ? String(activity.summaryId)
            : null,
      payload: activity,
      processing_status: "pending",
    }));

    for (const row of rows) {
      const { error } = await supabase
        .from("garmin_webhook_events")
        .insert(row);

      if (error && error.code !== "23505") {
        console.error("Garmin webhook Supabase error:", error);

        return NextResponse.json(
          {
            ok: false,
            error: "Failed to persist Garmin activities.",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        ok: true,
        received: rows.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Garmin webhook error:", error);

    return NextResponse.json(
      {
        ok: false,
      },
      { status: 500 }
    );
  }
}

