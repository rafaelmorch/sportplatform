import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  SignedDataVerifier,
  Environment,
} from "@apple/app-store-server-library";
import { APPLE_ROOT_CERTIFICATES } from "@/lib/apple-root-certificates";
import {
  APPLE_COMMUNITY_PRODUCTS,
  APPLE_PERFORMANCE_AI_PRODUCT_ID,
} from "@/lib/apple-iap-products";

const BUNDLE_ID = "com.platformsports.app";
const APPLE_APP_ID = 6758588667;

export async function POST(req: Request) {
  let signedPayload: string | undefined;

  try {
    const body = await req.json();
    signedPayload = body?.signedPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!signedPayload || typeof signedPayload !== "string") {
    return NextResponse.json(
      { error: "Missing signedPayload" },
      { status: 400 }
    );
  }

  try {
    const productionVerifier = new SignedDataVerifier(
      APPLE_ROOT_CERTIFICATES,
      true,
      Environment.PRODUCTION,
      BUNDLE_ID,
      APPLE_APP_ID
    );

    const sandboxVerifier = new SignedDataVerifier(
      APPLE_ROOT_CERTIFICATES,
      true,
      Environment.SANDBOX,
      BUNDLE_ID
    );

    let notification;

    try {
      try {
        notification =
          await productionVerifier.verifyAndDecodeNotification(signedPayload);
      } catch {
        notification =
          await sandboxVerifier.verifyAndDecodeNotification(signedPayload);
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid Apple notification signature" },
        { status: 400 }
      );
    }

    let verifiedTransaction:
      | Awaited<ReturnType<SignedDataVerifier["verifyAndDecodeTransaction"]>>
      | undefined;

    // Verifica também a assinatura digital da transação interna.
    // Ainda não altera assinaturas.
    if (notification.data?.signedTransactionInfo) {
      if (
        notification.data.environment !== "Sandbox" &&
        notification.data.environment !== "Production"
      ) {
        return NextResponse.json(
          { error: "Invalid Apple environment" },
          { status: 400 }
        );
      }

      const transactionVerifier =
        notification.data.environment === "Sandbox"
          ? sandboxVerifier
          : productionVerifier;

      let transaction;

      try {
        transaction =
          await transactionVerifier.verifyAndDecodeTransaction(
            notification.data.signedTransactionInfo
          );
      } catch {
        return NextResponse.json(
          { error: "Invalid Apple transaction signature" },
          { status: 400 }
        );
      }

      verifiedTransaction = transaction;

      if (
        transaction.bundleId !== BUNDLE_ID ||
        !transaction.originalTransactionId ||
        !transaction.transactionId ||
        !transaction.productId ||
        ![
          ...Object.values(APPLE_COMMUNITY_PRODUCTS),
          APPLE_PERFORMANCE_AI_PRODUCT_ID,
        ].includes(transaction.productId) ||
        transaction.environment !== notification.data.environment
      ) {
        return NextResponse.json(
          { error: "Invalid Apple transaction" },
          { status: 400 }
        );
      }
    }

    // Eventos que alteram assinaturas exigem uma transacao Apple verificada.
    const subscriptionEvents = [
      "SUBSCRIBED",
      "DID_RENEW",
      "RENEWAL_EXTENDED",
      "EXPIRED",
      "GRACE_PERIOD_EXPIRED",
      "REFUND",
      "REVOKE",
    ];

    if (
      subscriptionEvents.includes(notification.notificationType ?? "") &&
      !verifiedTransaction
    ) {
      return NextResponse.json(
        { error: "Missing verified Apple transaction" },
        { status: 503 }
      );
    }

    // Processamento desativado ate a conclusao dos testes.
    const PROCESSING_ENABLED = false;

    if (!PROCESSING_ENABLED) {
      return NextResponse.json(
        { error: "Notification processing not enabled" },
        { status: 503 }
      );
    }

    // Registra notificacoes verificadas antes de processa-las.
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing Supabase server configuration" },
        { status: 503 }
      );
    }

    if (!notification.notificationUUID || !notification.notificationType) {
      return NextResponse.json(
        { error: "Incomplete Apple notification" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error: insertError } = await supabase
      .from("apple_iap_notifications")
      .upsert(
        {
          notification_uuid: notification.notificationUUID,
          notification_type: notification.notificationType,
          notification_subtype: notification.subtype ?? null,
          signed_date: notification.signedDate
            ? new Date(notification.signedDate).toISOString()
            : null,
        },
        {
          onConflict: "notification_uuid",
          ignoreDuplicates: true,
        }
      );

    if (insertError) {
      console.error("Apple notification storage failed", insertError.message);
      return NextResponse.json(
        { error: "Notification storage failed" },
        { status: 503 }
      );
    }

    // Argumentos preparados exclusivamente com dados verificados pela Apple.
    // A chamada RPC permanece desativada nesta etapa.
    const processingArgs = {
      p_notification_uuid: notification.notificationUUID,
      p_notification_type: notification.notificationType,
      p_notification_subtype: notification.subtype ?? null,
      p_original_transaction_id:
        verifiedTransaction?.originalTransactionId ?? null,
      p_transaction_id: verifiedTransaction?.transactionId ?? null,
      p_product_id: verifiedTransaction?.productId ?? null,
      p_environment: verifiedTransaction?.environment ?? null,
      p_expires_at: verifiedTransaction?.expiresDate
        ? new Date(verifiedTransaction.expiresDate).toISOString()
        : null,
      p_revoked_at: verifiedTransaction?.revocationDate
        ? new Date(verifiedTransaction.revocationDate).toISOString()
        : null,
      p_signed_at: notification.signedDate
        ? new Date(notification.signedDate).toISOString()
        : null,
      p_app_account_token: verifiedTransaction?.appAccountToken ?? null,
    };


    const { data: processingResult, error: processingError } =
      await supabase.rpc("process_apple_iap_notification", processingArgs);

    if (processingError) {
      console.error("Apple notification processing failed", processingError.message);
      return NextResponse.json(
        { error: "Notification processing failed" },
        { status: 503 }
      );
    }

    if (processingResult === "pending_subscription") {
      return NextResponse.json(
        { error: "Waiting for linked subscription" },
        { status: 503 }
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error(
      "Apple notification webhook failed",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "Apple notification processing failed" },
      { status: 503 }
    );
  }
}











