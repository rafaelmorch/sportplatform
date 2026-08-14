import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  Environment,
  SignedDataVerifier,
} from "@apple/app-store-server-library";

import { APPLE_ROOT_CERTIFICATES } from "@/lib/apple-root-certificates";
import { APPLE_COMMUNITY_PRODUCTS } from "@/lib/apple-iap-products";

const APPLE_BUNDLE_ID = "com.platformsports.app";
const APPLE_APP_ID = 6758588667;

async function verifyAppleTransaction(jws: string) {
  const productionVerifier = new SignedDataVerifier(
    APPLE_ROOT_CERTIFICATES,
    true,
    Environment.PRODUCTION,
    APPLE_BUNDLE_ID,
    APPLE_APP_ID
  );

  try {
    const transaction =
      await productionVerifier.verifyAndDecodeTransaction(jws);

    return {
      transaction,
      environment: "Production",
    };
  } catch (productionError) {
    const sandboxVerifier = new SignedDataVerifier(
      APPLE_ROOT_CERTIFICATES,
      true,
      Environment.SANDBOX,
      APPLE_BUNDLE_ID
    );

    const transaction =
      await sandboxVerifier.verifyAndDecodeTransaction(jws);

    return {
      transaction,
      environment: "Sandbox",
    };
  }
}

export async function POST(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase server configuration." },
      { status: 500 }
    );
  }

  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  const accessToken = authorization.slice("Bearer ".length).trim();

  const supabase = createClient(
    supabaseUrl,
    supabaseServiceRoleKey
  );

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid user session." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const communityId =
      typeof body?.community_id === "string"
        ? body.community_id
        : null;

    const jwsRepresentation =
      typeof body?.jwsRepresentation === "string"
        ? body.jwsRepresentation
        : null;

    if (!communityId || !jwsRepresentation) {
      return NextResponse.json(
        { error: "Missing community or Apple transaction." },
        { status: 400 }
      );
    }

    const expectedProductId =
      APPLE_COMMUNITY_PRODUCTS[communityId];

    if (!expectedProductId) {
      return NextResponse.json(
        {
          error:
            "This community does not have an Apple subscription configured.",
        },
        { status: 400 }
      );
    }

    const { transaction, environment } =
      await verifyAppleTransaction(jwsRepresentation);

    if (transaction.productId !== expectedProductId) {
      return NextResponse.json(
        { error: "Apple product does not match this community." },
        { status: 400 }
      );
    }

    if (!transaction.appAccountToken) {
      return NextResponse.json(
        { error: "Apple purchase is not linked to an app account." },
        { status: 403 }
      );
    }

    if (
      transaction.appAccountToken.toLowerCase() !==
      user.id.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Apple purchase belongs to another account." },
        { status: 403 }
      );
    }

    if (!transaction.transactionId) {
      return NextResponse.json(
        { error: "Apple transaction id is missing." },
        { status: 400 }
      );
    }

    if (!transaction.originalTransactionId) {
      return NextResponse.json(
        { error: "Apple original transaction id is missing." },
        { status: 400 }
      );
    }

    if (!transaction.expiresDate) {
      return NextResponse.json(
        { error: "Apple subscription expiration is missing." },
        { status: 400 }
      );
    }

    if (
      transaction.revocationDate ||
      transaction.expiresDate <= Date.now()
    ) {
      return NextResponse.json(
        { error: "Apple subscription is not active." },
        { status: 400 }
      );
    }

    const { error: upsertError } = await supabase
      .from("app_membership_requests")
      .upsert(
        [
          {
            community_id: communityId,
            user_id: user.id,

            payment_provider: "apple",

            apple_product_id: transaction.productId,
            apple_transaction_id: transaction.transactionId,
            apple_original_transaction_id:
              transaction.originalTransactionId,
            apple_environment: environment,
            apple_app_account_token:
              transaction.appAccountToken,

            subscription_status: "active",
            current_period_end: new Date(
              transaction.expiresDate
            ).toISOString(),

            status: "active",
          },
        ],
        {
          onConflict: "community_id,user_id",
        }
      );

    if (upsertError) {
      console.error(
        "Apple IAP membership update error:",
        upsertError
      );

      return NextResponse.json(
        { error: "Failed to activate membership." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      community_id: communityId,
      product_id: transaction.productId,
      transaction_id: transaction.transactionId,
      original_transaction_id:
        transaction.originalTransactionId,
      expires_at: new Date(
        transaction.expiresDate
      ).toISOString(),
      environment,
    });
  } catch (error: unknown) {
    console.error("Apple IAP validation error:", error);

    return NextResponse.json(
      { error: "Apple transaction could not be verified." },
      { status: 400 }
    );
  }
}

