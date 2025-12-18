// app/api/stripe/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return new NextResponse("Missing STRIPE_SECRET_KEY", { status: 500 });
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://sportsplatform.app";

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRole) {
      return new NextResponse("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY", {
        status: 500,
      });
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-02-24.acacia" as any,
    });

    const supabase = createClient(supabaseUrl, serviceRole);

    const body = await req.json();
    const eventId = body?.eventId as string | undefined;
    const nickname = body?.nickname as string | undefined;
    const userId = body?.userId as string | undefined;

    if (!eventId || !nickname || !userId) {
      return new NextResponse("Missing eventId, nickname, or userId", {
        status: 400,
      });
    }

    const nick = nickname.trim();
    if (nick.length < 2 || nick.length > 24) {
      return new NextResponse("Invalid nickname length", { status: 400 });
    }

    // Busca evento
    const { data: event, error: evErr } = await supabase
      .from("events")
      .select("id,title,price_cents")
      .eq("id", eventId)
      .single();

    if (evErr || !event) {
      return new NextResponse(evErr?.message || "Event not found", {
        status: 404,
      });
    }

    const priceCents = Number(event.price_cents ?? 0);
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      return new NextResponse("Event is free; no checkout required", {
        status: 400,
      });
    }

    // Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${event.title || "Event"} (Sports Platform)`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/events/${eventId}?paid=1`,
      cancel_url: `${siteUrl}/events/${eventId}?canceled=1`,
      metadata: {
        event_id: eventId,
        user_id: userId,
        nickname: nick,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return new NextResponse(e?.message || "Checkout error", { status: 500 });
  }
}
