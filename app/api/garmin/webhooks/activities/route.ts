import { NextRequest, NextResponse, after } from "next/server";
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
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid JSON payload.",
      },
      { status: 400 }
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray((body as { activities?: unknown }).activities)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid Garmin activities payload.",
      },
      { status: 400 }
    );
  }

  const activities = (body as {
    activities: Record<string, unknown>[];
  }).activities;

  console.log(
    "Garmin webhook received:",
    JSON.stringify({ activities })
  );

  after(async () => {
    try {
      const supabase = createSupabaseServerClient();

      for (const activity of activities) {
        const row = {
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
        };

        const { error } = await supabase
          .from("garmin_webhook_events")
          .insert(row);

        if (error && error.code !== "23505") {
          console.error(
            "Garmin webhook Supabase error:",
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "Garmin webhook background processing error:",
        error
      );
    }
  });

  return NextResponse.json(
    {
      ok: true,
      received: activities.length,
    },
    { status: 200 }
  );
}
