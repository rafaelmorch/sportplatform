import { NextRequest, NextResponse, after } from "next/server";

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

  after(async () => {
    try {
      console.log("Garmin webhook received:", JSON.stringify(body));
    } catch (error) {
      console.error("Garmin dailies background processing error:", error);
    }
  });

  return NextResponse.json(
    {
      ok: true,
    },
    { status: 200 }
  );
}
