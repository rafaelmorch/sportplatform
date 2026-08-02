import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const stripeSecretKey =
      process.env.STRIPE_SECRET_KEY?.trim();

    const priceId =
      process.env.STRIPE_PERFORMANCE_AI_PRICE_ID?.trim();

    const supabaseUrl =
      process.env.SUPABASE_URL?.trim();

    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY." },
        { status: 500 }
      );
    }

    if (!priceId) {
      return NextResponse.json(
        {
          error:
            "Missing STRIPE_PERFORMANCE_AI_PRICE_ID.",
        },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        {
          error:
            "Missing Supabase server configuration.",
        },
        { status: 500 }
      );
    }

    const authorization =
      req.headers.get("authorization") ?? "";

    const accessToken =
      authorization.startsWith("Bearer ")
        ? authorization.slice(7).trim()
        : "";

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    const user = authData.user;

    const { data: existingSubscription } =
      await supabase
        .from("performance_ai_subscriptions")
        .select(
          "id, status, stripe_customer_id, stripe_subscription_id"
        )
        .eq("user_id", user.id)
        .in("status", [
          "active",
          "trialing",
          "past_due",
          "incomplete",
        ])
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (
      existingSubscription?.status === "active" ||
      existingSubscription?.status === "trialing"
    ) {
      return NextResponse.json(
        {
          error:
            "Você já possui uma assinatura ativa do Performance AI Coach.",
        },
        { status: 409 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      "https://www.sportsplatform.app";

    const session =
      await stripe.checkout.sessions.create({
        mode: "subscription",

        payment_method_types: ["card"],

        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],

        success_url:
          `${appUrl}/mobile/stripe/success` +
          "?destination=%2Fperformance-ai%2Fhealth&payment=success&session_id={CHECKOUT_SESSION_ID}",

        cancel_url:
          `${appUrl}/mobile/stripe/cancel` +
          "?destination=%2Fperformance-ai%2Fsubscribe&payment=cancelled",

        client_reference_id: user.id,

        customer_email:
          existingSubscription?.stripe_customer_id
            ? undefined
            : user.email ?? undefined,

        customer:
          existingSubscription?.stripe_customer_id ??
          undefined,

        metadata: {
          product: "performance_ai",
          user_id: user.id,
        },

        subscription_data: {
          metadata: {
            product: "performance_ai",
            user_id: user.id,
          },
        },

        allow_promotion_codes: false,
      });

    if (!session.url) {
      return NextResponse.json(
        {
          error:
            "O Stripe não retornou a URL do checkout.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected checkout error.";

    console.error(
      "Performance AI checkout error:",
      message
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível iniciar o pagamento do Performance AI Coach.",
      },
      { status: 500 }
    );
  }
}



