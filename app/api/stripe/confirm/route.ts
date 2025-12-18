import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!secretKey) return new NextResponse("Missing STRIPE_SECRET_KEY", { status: 500 });
    if (!supabaseUrl || !serviceRole)
      return new NextResponse("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY", { status: 500 });

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");

    if (!sessionId) return new NextResponse("Missing session_id", { status: 400 });

    const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" as any });
    const supabase = createClient(supabaseUrl, serviceRole);

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (!session) return new NextResponse("Session not found", { status: 404 });

    // Stripe pode retornar payment_status: "paid" quando completou
    if (session.payment_status !== "paid") {
      return new NextResponse(`Not paid (payment_status=${session.payment_status})`, { status: 402 });
    }

    const md = (session.metadata || {}) as Record<string, string>;
    const eventId = (md.event_id || "").trim();
    const userId = (md.user_id || "").trim();
    const nickname = (md.nickname || "").trim();

    if (!eventId || !userId || !nickname) {
      return new NextResponse("Missing metadata: event_id/user_id/nickname", { status: 400 });
    }

    const amountCents = session.amount_total ?? null;
    const currency = (session.currency ?? "usd").toLowerCase();
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent as any)?.id || null;

    const providerSessionId = session.id;

    // ✅ Upsert idempotente (precisa ter unique(event_id,user_id) ou pelo menos não duplicar)
    const { error: upsertErr } = await supabase
      .from("event_registrations")
      .upsert(
        {
          event_id: eventId,
          user_id: userId,
          nickname,
          registered_at: new Date().toISOString(),
          payment_provider: "stripe",
          payment_status: "paid",
          amount_cents: amountCents,
          currency,
          provider_session_id: providerSessionId,
          provider_payment_intent_id: paymentIntentId,
          status: "confirmed",
        } as any,
        { onConflict: "event_id,user_id" }
      );

    if (upsertErr) {
      return new NextResponse(`Supabase upsert failed: ${upsertErr.message}`, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return new NextResponse(e?.message || "Confirm error", { status: 500 });
  }
}
