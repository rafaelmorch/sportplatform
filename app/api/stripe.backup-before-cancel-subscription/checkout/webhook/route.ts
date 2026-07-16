import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey) return new NextResponse("Missing STRIPE_SECRET_KEY", { status: 500 });
  if (!webhookSecret) return new NextResponse("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
  if (!supabaseUrl || !serviceRole) {
    return new NextResponse("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY", { status: 500 });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" as any });
  const supabase = createClient(supabaseUrl, serviceRole);

  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing stripe-signature header", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    return new NextResponse(`Webhook signature verification failed: ${err?.message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const md = (session.metadata || {}) as Record<string, string>;

      const eventId = md.event_id;
      const userId = md.user_id;
      const nickname = (md.nickname || "").trim();

      // ✅ novos do metadata
      const attendeeWhatsapp = (md.attendee_whatsapp || "").trim();
      const attendeeEmail = (md.attendee_email || "").trim();
      const attendeeName = (md.attendee_name || "").trim();

      if (!eventId || !userId || !nickname) {
        return new NextResponse("Missing metadata: event_id/user_id/nickname", { status: 400 });
      }

      const amountCents = session.amount_total ?? null;
      const currency = (session.currency ?? "usd").toLowerCase();
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : null;

      const { error: upsertErr } = await supabase
        .from("event_registrations")
        .upsert(
          {
            event_id: eventId,
            user_id: userId,
            nickname,
            registered_at: new Date().toISOString(),

            status: "confirmed",

            payment_provider: "stripe",
            payment_status: "paid",
            amount_cents: amountCents,
            currency,
            provider_payment_intent_id: paymentIntentId,
            provider_session_id: session.id,

            // ✅ grava os novos campos
            attendee_whatsapp: attendeeWhatsapp || null,
            attendee_email: attendeeEmail || null,
            attendee_name: attendeeName || null,
          },
          { onConflict: "event_id,user_id" }
        );

      if (upsertErr) {
        return new NextResponse(`Supabase upsert failed: ${upsertErr.message}`, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    return new NextResponse(e?.message || "Webhook handler error", { status: 500 });
  }
}
