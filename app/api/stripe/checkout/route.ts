import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function sanitizePhone(s: string): string {
  return (s ?? "").trim().replace(/[^\d+]/g, "");
}

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
    const eventId: string | undefined = body?.eventId;
    const userId: string | undefined = body?.userId;
    const nicknameRaw: string | undefined = body?.nickname;

    // ✅ novo
    const attendeeWhatsappRaw: string | undefined = body?.attendeeWhatsapp;

    if (!eventId || !userId || !nicknameRaw) {
      return new NextResponse("Missing eventId/userId/nickname", { status: 400 });
    }

    const nickname = String(nicknameRaw).trim();
    if (nickname.length < 2 || nickname.length > 24) {
      return new NextResponse("Nickname must be between 2 and 24 characters.", { status: 400 });
    }

    // ✅ WhatsApp obrigatório (para eventos pagos também)
    const attendeeWhatsapp = sanitizePhone(String(attendeeWhatsappRaw ?? ""));
    if (attendeeWhatsapp.length < 8) {
      return new NextResponse("Missing/invalid attendeeWhatsapp (include country code, ex: +1407...)", { status: 400 });
    }

    // ✅ Não selecionar currency (coluna não existe)
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("id,title,price_cents")
      .eq("id", eventId)
      .single();

    if (evErr || !ev) return new NextResponse(`Event not found: ${evErr?.message || ""}`, { status: 404 });

    const priceCents = Number((ev as any).price_cents ?? 0);
    if (!(priceCents > 0)) return new NextResponse("This event is free. No checkout needed.", { status: 400 });

    const currency = "usd"; // ✅ fixo
    const title = String((ev as any).title ?? "Event");

    const origin = req.headers.get("origin") || "https://sportsplatform.app";

    const successUrl = `${origin}/events/${eventId}?paid=1&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/events/${eventId}?canceled=1`;

    // ✅ opcional: puxar email do user no auth (admin) pra guardar no metadata também
    let attendeeEmail: string | null = null;
    try {
      const { data } = await supabase.auth.admin.getUserById(userId);
      attendeeEmail = data?.user?.email ?? null;
    } catch {
      attendeeEmail = null;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: priceCents,
            product_data: { name: `${title} (Sports Platform)` },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        event_id: eventId,
        user_id: userId,
        nickname,
        attendee_whatsapp: attendeeWhatsapp, // ✅ novo
        attendee_email: attendeeEmail ?? "", // ✅ opcional
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return new NextResponse(e?.message || "Failed to create checkout session", { status: 500 });
  }
}
