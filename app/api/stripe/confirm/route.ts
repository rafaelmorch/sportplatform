import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!secretKey) return new NextResponse("Missing STRIPE_SECRET_KEY", { status: 500 });
    if (!supabaseUrl || !serviceRole)
      return new NextResponse("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY", { status: 500 });

    const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" as any });
    const supabase = createClient(supabaseUrl, serviceRole);

    const body = await req.json().catch(() => null);
    const sessionId: string | undefined = body?.session_id;

    if (!sessionId) return new NextResponse("Missing session_id", { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) return new NextResponse("Session not found", { status: 404 });
    if (session.payment_status !== "paid") {
      return new NextResponse(`Payment not completed: ${session.payment_status}`, { status: 400 });
    }

    const metadata = (session.metadata || {}) as Record<string, string>;
    const eventId = metadata.event_id;
    const userId = metadata.user_id;
    const nickname = (metadata.nickname || "").trim();

    const attendeeWhatsapp = (metadata.attendee_whatsapp || "").trim() || null;
    const attendeeEmail = (metadata.attendee_email || "").trim() || null;
    const attendeeName = (metadata.attendee_name || "").trim() || null;

    if (!eventId || !userId || !nickname) {
      return new NextResponse("Missing metadata: event_id/user_id/nickname", { status: 400 });
    }

    const amountCents = session.amount_total ?? null;
    const currency = (session.currency ?? "usd").toLowerCase();
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : null;

    // ✅ Idempotente: se já tiver, só atualiza
    const { error: upsertErr } = await supabase
      .from("event_registrations")
      .upsert(
        {
          event_id: eventId,
          user_id: userId,
          nickname,
          attendee_whatsapp: attendeeWhatsapp,
          attendee_email: attendeeEmail,
          attendee_name: attendeeName,
          registered_at: new Date().toISOString(),
          status: "confirmed",
          payment_provider: "stripe",
          payment_status: "paid",
          amount_cents: amountCents,
          currency,
          provider_session_id: session.id,
          provider_payment_intent_id: paymentIntentId,
        },
        { onConflict: "event_id,user_id" }
      );

    if (upsertErr) {
      return new NextResponse(`Supabase upsert failed: ${upsertErr.message}`, { status: 500 });
    }

    return NextResponse.json({ ok: true, eventId, userId });
  } catch (e: any) {
    return new NextResponse(e?.message || "Confirm failed", { status: 500 });
  }
}
