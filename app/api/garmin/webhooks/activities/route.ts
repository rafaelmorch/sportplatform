import { NextRequest, NextResponse } from "next/server";

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

    return NextResponse.json(
      {
        ok: true,
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
