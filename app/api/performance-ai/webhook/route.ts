import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type StripeSubscriptionLike = Stripe.Subscription & {
  current_period_end?: number | null;
  items?: {
    data?: Array<{
      current_period_end?: number | null;
    }>;
  };
};

function toIsoDate(unixSeconds?: number | null) {
  if (!unixSeconds) {
    return null;
  }

  return new Date(unixSeconds * 1000).toISOString();
}

function getCurrentPeriodEnd(
  subscription: StripeSubscriptionLike
) {
  return (
    subscription.current_period_end ??
    subscription.items?.data?.[0]?.current_period_end ??
    null
  );
}

function getCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
) {
  if (typeof customer === "string") {
    return customer;
  }

  return customer?.id ?? null;
}

function getInvoiceSubscriptionId(invoice: any) {
  const legacySubscription =
    typeof invoice?.subscription === "string"
      ? invoice.subscription
      : invoice?.subscription?.id ?? null;

  if (legacySubscription) {
    return legacySubscription;
  }

  const parentSubscription =
    invoice?.parent?.subscription_details?.subscription;

  if (typeof parentSubscription === "string") {
    return parentSubscription;
  }

  return parentSubscription?.id ?? null;
}

function isPerformanceAiMetadata(
  metadata?: Stripe.Metadata | null
) {
  return metadata?.product === "performance_ai";
}

export async function POST(req: Request) {
  const stripeSecretKey =
    process.env.STRIPE_SECRET_KEY?.trim();

  const webhookSecret =
    process.env
      .STRIPE_PERFORMANCE_AI_WEBHOOK_SECRET
      ?.trim();

  const supabaseUrl =
    process.env.SUPABASE_URL?.trim();

  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (
    !stripeSecretKey ||
    !webhookSecret ||
    !supabaseUrl ||
    !supabaseServiceRoleKey
  ) {
    return NextResponse.json(
      {
        error:
          "Missing Performance AI webhook configuration.",
      },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);

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

  const rawBody = await req.text();
  const signature =
    req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      {
        error:
          "Missing Stripe-Signature header.",
      },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Invalid webhook signature.";

    console.error(
      "Performance AI webhook signature error:",
      message
    );

    return NextResponse.json(
      {
        error:
          "Invalid webhook signature.",
      },
      { status: 400 }
    );
  }

  const saveSubscription = async ({
    userId,
    subscription,
  }: {
    userId: string;
    subscription: StripeSubscriptionLike;
  }) => {
    const stripeCustomerId = getCustomerId(
      subscription.customer
    );

    const payload = {
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_end: toIsoDate(
        getCurrentPeriodEnd(subscription)
      ),
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: readError } =
      await supabase
        .from("performance_ai_subscriptions")
        .select("id")
        .or(
          `stripe_subscription_id.eq.${subscription.id},user_id.eq.${userId}`
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (readError) {
      throw new Error(
        `Failed to find Performance AI subscription: ${readError.message}`
      );
    }

    if (existing?.id) {
      const { error: updateError } =
        await supabase
          .from("performance_ai_subscriptions")
          .update(payload)
          .eq("id", existing.id);

      if (updateError) {
        throw new Error(
          `Failed to update Performance AI subscription: ${updateError.message}`
        );
      }

      return;
    }

    const { error: insertError } =
      await supabase
        .from("performance_ai_subscriptions")
        .insert(payload);

    if (insertError) {
      throw new Error(
        `Failed to create Performance AI subscription: ${insertError.message}`
      );
    }
  };

  try {
    if (
      event.type ===
      "checkout.session.completed"
    ) {
      const session =
        event.data.object as Stripe.Checkout.Session;

      if (
        session.mode !== "subscription" ||
        !isPerformanceAiMetadata(
          session.metadata
        )
      ) {
        return NextResponse.json({
          received: true,
          ignored: true,
        });
      }

      const userId =
        session.metadata?.user_id ??
        session.client_reference_id;

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

      if (!userId || !subscriptionId) {
        throw new Error(
          "Performance AI checkout is missing user_id or subscription."
        );
      }

      const subscription =
        (await stripe.subscriptions.retrieve(
          subscriptionId
        )) as StripeSubscriptionLike;

      await saveSubscription({
        userId,
        subscription,
      });
    }

    if (
      event.type ===
        "customer.subscription.created" ||
      event.type ===
        "customer.subscription.updated"
    ) {
      const subscription =
        event.data
          .object as StripeSubscriptionLike;

      if (
        !isPerformanceAiMetadata(
          subscription.metadata
        )
      ) {
        return NextResponse.json({
          received: true,
          ignored: true,
        });
      }

      const userId =
        subscription.metadata?.user_id;

      if (!userId) {
        throw new Error(
          "Performance AI subscription is missing user_id."
        );
      }

      await saveSubscription({
        userId,
        subscription,
      });
    }

    if (
      event.type ===
      "customer.subscription.deleted"
    ) {
      const subscription =
        event.data
          .object as StripeSubscriptionLike;

      if (
        !isPerformanceAiMetadata(
          subscription.metadata
        )
      ) {
        return NextResponse.json({
          received: true,
          ignored: true,
        });
      }

      const { error } = await supabase
        .from("performance_ai_subscriptions")
        .update({
          status: "canceled",
          current_period_end: toIsoDate(
            getCurrentPeriodEnd(subscription)
          ),
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "stripe_subscription_id",
          subscription.id
        );

      if (error) {
        throw new Error(
          `Failed to cancel Performance AI subscription: ${error.message}`
        );
      }
    }

    if (
      event.type === "invoice.paid" ||
      event.type ===
        "invoice.payment_failed"
    ) {
      const invoice =
        event.data.object as Stripe.Invoice;

      const subscriptionId =
        getInvoiceSubscriptionId(invoice);

      if (!subscriptionId) {
        return NextResponse.json({
          received: true,
          ignored: true,
        });
      }

      const subscription =
        (await stripe.subscriptions.retrieve(
          subscriptionId
        )) as StripeSubscriptionLike;

      if (
        !isPerformanceAiMetadata(
          subscription.metadata
        )
      ) {
        return NextResponse.json({
          received: true,
          ignored: true,
        });
      }

      const userId =
        subscription.metadata?.user_id;

      if (!userId) {
        throw new Error(
          "Performance AI invoice subscription is missing user_id."
        );
      }

      if (
        event.type ===
        "invoice.payment_failed"
      ) {
        const { error } = await supabase
          .from(
            "performance_ai_subscriptions"
          )
          .update({
            status: "past_due",
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "stripe_subscription_id",
            subscription.id
          );

        if (error) {
          throw new Error(
            `Failed to mark Performance AI subscription as past_due: ${error.message}`
          );
        }
      } else {
        await saveSubscription({
          userId,
          subscription,
        });
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown webhook error.";

    console.error(
      "Performance AI webhook error:",
      message
    );

    return NextResponse.json(
      {
        error:
          "Performance AI webhook handling failed.",
      },
      { status: 500 }
    );
  }
}
