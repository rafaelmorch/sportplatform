import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!stripeSecretKey || !supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Missing server configuration." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const { community_id, user_id } = await req.json();

    if (!community_id || !user_id) {
      return NextResponse.json(
        { error: "Missing community_id or user_id." },
        { status: 400 }
      );
    }

    const { data: membership, error } = await supabase
      .from("app_membership_requests")
      .select("stripe_subscription_id, subscription_status")
      .eq("community_id", community_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (error) {
      console.error("Membership lookup error:", error);

      return NextResponse.json(
        { error: "Failed to load membership." },
        { status: 500 }
      );
    }

    if (!membership?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "Subscription not found." },
        { status: 404 }
      );
    }

    if (membership.subscription_status !== "active") {
      return NextResponse.json(
        { error: "Subscription is not active." },
        { status: 400 }
      );
    }

    await stripe.subscriptions.cancel(
      membership.stripe_subscription_id
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);

    return NextResponse.json(
      { error: "Failed to cancel subscription." },
      { status: 500 }
    );
  }
}

