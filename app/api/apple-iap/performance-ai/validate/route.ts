import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  Environment,
  SignedDataVerifier,
} from "@apple/app-store-server-library";

import { APPLE_ROOT_CERTIFICATES } from "@/lib/apple-root-certificates";
import { APPLE_PERFORMANCE_AI_PRODUCT_ID } from "@/lib/apple-iap-products";

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
  } catch {
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
  const supabaseUrl =
    process.env.SUPABASE_URL?.trim();

  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase server configuration." },
      { status: 500 }
    );
  }

  const authorization =
    req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  const accessToken =
    authorization.slice("Bearer ".length).trim();

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

    const jwsRepresentation =
      typeof body?.jwsRepresentation === "string"
        ? body.jwsRepresentation
        : null;

    if (!jwsRepresentation) {
      return NextResponse.json(
        { error: "Missing Apple transaction." },
        { status: 400 }
      );
    }

    const { transaction, environment } =
      await verifyAppleTransaction(jwsRepresentation);

    if (
      transaction.productId !==
      APPLE_PERFORMANCE_AI_PRODUCT_ID
    ) {
      return NextResponse.json(
        { error: "Invalid Performance AI Apple product." },
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

    if (
      !transaction.transactionId ||
      !transaction.originalTransactionId ||
      !transaction.expiresDate
    ) {
      return NextResponse.json(
        { error: "Incomplete Apple subscription transaction." },
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

    const { error: activationError } = await supabase.rpc(
      "activate_apple_performance_ai_subscription",
      {
        p_user_id: user.id,
        p_product_id: transaction.productId,
        p_transaction_id: transaction.transactionId,
        p_original_transaction_id: transaction.originalTransactionId,
        p_environment: environment,
        p_app_account_token: transaction.appAccountToken,
        p_expires_at: new Date(transaction.expiresDate).toISOString(),
      }
    );

    if (activationError) {
      console.error(
        "Apple Performance AI activation error:",
        activationError
      );

      return NextResponse.json(
        { error: "Failed to activate Apple Performance AI subscription." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product_id:
        transaction.productId,
      transaction_id:
        transaction.transactionId,
      original_transaction_id:
        transaction.originalTransactionId,
      expires_at:
        new Date(
          transaction.expiresDate
        ).toISOString(),
      environment,
    });
  } catch (error: unknown) {
    console.error(
      "Performance AI Apple IAP validation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Apple Performance AI transaction could not be verified.",
      },
      { status: 400 }
    );
  }
}
