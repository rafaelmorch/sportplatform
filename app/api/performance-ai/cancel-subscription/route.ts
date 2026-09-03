import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!stripeSecretKey || !supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Missing server configuration." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  const supabase = createClient(
    supabaseUrl,
    supabaseServiceRoleKey
  );

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "Missing user_id." },
        { status: 400 }
      );
    }

    const { data: subscription, error } = await supabase
      .from("performance_ai_subscriptions")
      .select("stripe_subscription_id,status")
      .eq("user_id", user_id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "Performance AI subscription lookup error:",
        error
      );

      return NextResponse.json(
        { error: "Failed to load subscription." },
        { status: 500 }
      );
    }

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "Subscription not found." },
        { status: 404 }
      );
    }

    if (subscription.status !== "active") {
      return NextResponse.json(
        { error: "Subscription is not active." },
        { status: 400 }
      );
    }

    await stripe.subscriptions.cancel(
      subscription.stripe_subscription_id
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error(
      "Cancel Performance AI subscription error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to cancel subscription." },
      { status: 500 }
    );
  }
}
