"use client";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackArrow from "@/components/BackArrow";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Capacitor } from "@capacitor/core";
import { APPLE_COMMUNITY_PRODUCTS } from "@/lib/apple-iap-products";

export const dynamic = "force-dynamic";

function PendingMembershipContent() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const router = useRouter();
  const searchParams = useSearchParams();

  const communityId = searchParams.get("community_id");

  const [message, setMessage] = useState<string | null>(null);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [appleMonthlyPrice, setAppleMonthlyPrice] = useState<string | null>(null);
  const [applePriceError, setApplePriceError] = useState(false);
  const [restoringPurchases, setRestoringPurchases] = useState(false);
  const [appleSubscriptionExpired, setAppleSubscriptionExpired] = useState(false);

  useEffect(() => {
    if (
      !communityId ||
      !Capacitor.isNativePlatform() ||
      Capacitor.getPlatform() !== "ios"
    ) {
      return;
    }

    let cancelled = false;

    async function loadApplePrice() {
      const productId = APPLE_COMMUNITY_PRODUCTS[communityId!];
      if (!productId) return;

      try {
        const { NativePurchases, PURCHASE_TYPE } = await import(
          "@capgo/native-purchases"
        );

        const { product } = await NativePurchases.getProduct({
          productIdentifier: productId,
          productType: PURCHASE_TYPE.SUBS,
        });

        if (!cancelled) {
          setAppleMonthlyPrice(product.priceString);
        }
      } catch (error) {
        console.error("Unable to load Apple subscription price:", error);
        if (!cancelled) {
          setApplePriceError(true);
        }
      }
    }

    void loadApplePrice();

    return () => {
      cancelled = true;
    };
  }, [communityId]);

  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function checkMembershipStatus() {
      if (!communityId) return;

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) return;

      const { data, error } = await supabase
        .from("app_membership_requests")
        .select("status, subscription_status, payment_provider, current_period_end")
        .eq("community_id", communityId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!isMounted || error || !data) return;

      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
        setAppleSubscriptionExpired(
          data.payment_provider === "apple" &&
          (
            data.subscription_status === "expired" ||
            data.status === "expired" ||
            (data.current_period_end != null &&
              Date.parse(data.current_period_end) <= Date.now())
          )
        );
      }

      const appleSubscriptionValid =
        data.payment_provider !== "apple" ||
        (data.current_period_end !== null &&
          Date.parse(data.current_period_end) > Date.now());

      if (
        data.status === "active" &&
        (data.subscription_status === "active" ||
          data.subscription_status === "trialing") &&
        appleSubscriptionValid
      ) {
        router.replace(`/groups/${communityId}/inside`);
      }
    }

    checkMembershipStatus();
    intervalId = setInterval(checkMembershipStatus, 3000);

    return () => {
      isMounted = false;

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [communityId, router, supabase]);

  async function handleRestorePurchases() {
    if (restoringPurchases) return;

    setRestoringPurchases(true);
    setMessage(null);

    try {
      if (
        !Capacitor.isNativePlatform() ||
        Capacitor.getPlatform() !== "ios"
      ) {
        throw new Error("Restore Purchases is available in the iOS app.");
      }

      if (!communityId) {
        throw new Error("Missing community id.");
      }

      const productId = APPLE_COMMUNITY_PRODUCTS[communityId];

      if (!productId) {
        throw new Error("No Apple subscription is configured for this community.");
      }

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error("Please sign in before restoring purchases.");
      }

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.access_token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const { NativePurchases, PURCHASE_TYPE } = await import(
        "@capgo/native-purchases"
      );

      await NativePurchases.restorePurchases();

      const { purchases } = await NativePurchases.getPurchases({
        productType: PURCHASE_TYPE.SUBS,
        appAccountToken: userData.user.id,
        onlyCurrentEntitlements: true,
      });

      const matchingPurchases = purchases.filter(
        (purchase) =>
          purchase.productIdentifier === productId &&
          purchase.jwsRepresentation &&
          purchase.isActive !== false
      );

      if (matchingPurchases.length === 0) {
        throw new Error(
          "No active Run Club subscription was found in your Apple account."
        );
      }

      let lastError = "Unable to validate the restored subscription.";

      for (const purchase of matchingPurchases) {
        const response = await fetch(
          "/api/apple-iap/community/validate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionData.session.access_token}`,
            },
            body: JSON.stringify({
              community_id: communityId,
              jwsRepresentation: purchase.jwsRepresentation,
            }),
          }
        );

        const result = await response.json().catch(() => null);

        if (response.ok) {
          router.replace(`/groups/${communityId}/inside`);
          return;
        }

        lastError =
          result?.error || "Unable to validate the restored subscription.";
      }

      throw new Error(lastError);
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to restore purchases. Please try again."
      );
    } finally {
      setRestoringPurchases(false);
    }
  }
  async function handleCreateStripeCheckout() {
    if (!termsAccepted) {
      setMessage(
        "You must accept the Terms & Conditions before continuing."
      );
      return;
    }

    try {
      setCreatingCheckout(true);
      setMessage(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("You must be logged in.");
        return;
      }

      if (!communityId) {
        setMessage("Missing community id.");
        return;
      }

      const { error: requestError } = await supabase
        .from("app_membership_requests")
        .upsert(
          [
            {
              community_id: communityId,
              user_id: user.id,
              status: "pending",
            },
          ],
          { onConflict: "community_id,user_id", ignoreDuplicates: true }
        );

      if (requestError) {
        setMessage(
          requestError.message ||
            "Failed to create membership request."
        );
        return;
      }

      const isNativeIos =
        Capacitor.isNativePlatform() &&
        Capacitor.getPlatform() === "ios";

      if (isNativeIos && !Capacitor.isPluginAvailable("NativePurchases")) {
        throw new Error("Apple purchases are unavailable. Please update the app.");
      }

      if (isNativeIos) {
        const productId = APPLE_COMMUNITY_PRODUCTS[communityId];

        if (!productId) {
          setMessage(
            "This community is not available for Apple subscription yet."
          );
          return;
        }

        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        const accessToken = sessionData.session?.access_token;

        if (!accessToken) {
          router.push("/login");
          return;
        }

        const { NativePurchases, PURCHASE_TYPE } = await import(
          "@capgo/native-purchases"
        );

        const transaction =
          await NativePurchases.purchaseProduct({
            productIdentifier: productId,
            productType: PURCHASE_TYPE.SUBS,
            appAccountToken: user.id,
            autoAcknowledgePurchases: false,
          });

        if (!transaction.jwsRepresentation) {
          throw new Error(
            "Apple did not return a StoreKit transaction for validation."
          );
        }

        const validationResponse = await fetch(
          "/api/apple-iap/community/validate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              community_id: communityId,
              jwsRepresentation:
                transaction.jwsRepresentation,
            }),
          }
        );

        const validationData =
          await validationResponse
            .json()
            .catch(() => null);

        if (!validationResponse.ok) {
          throw new Error(
            validationData?.error ||
              "Apple subscription could not be validated."
          );
        }

        await NativePurchases.acknowledgePurchase({
          purchaseToken: transaction.transactionId,
        });

        router.replace(`/groups/${communityId}/inside`);
        return;
      }
      const { data: stripeSessionData, error: stripeSessionError } =
        await supabase.auth.getSession();

      if (stripeSessionError || !stripeSessionData.session?.access_token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        "/api/stripe/create-subscription-checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${stripeSessionData.session.access_token}`,
          },
          body: JSON.stringify({
            community_id: communityId,
            user_id: user.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.url) {
        setMessage(
          data?.error ||
            "Failed to create Stripe checkout."
        );
        return;
      }

      window.location.href = data.url;
    } catch (err: any) {
      setMessage(
        err?.message ||
          "Unexpected payment error. | Ocorreu um erro inesperado no pagamento."
      );
    } finally {
      setCreatingCheckout(false);
    }
  }
  return (
    <main
      className="pending-page"
      style={{
        minHeight: "100vh",
        width: "100%",
        background:
          "linear-gradient(180deg, #eef1f5 0%, #e5e7eb 45%, #dfe3e8 100%)",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          margin: "0 auto 16px auto",
          boxSizing: "border-box",
        }}
      >
        <BackArrow />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",
          borderRadius: 28,
          padding: "clamp(18px, 4vw, 28px)",
          boxSizing: "border-box",
          border: "1px solid #d6dbe4",
          background: "linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)",
          boxShadow:
            "8px 8px 24px rgba(148,163,184,0.18), -6px -6px 20px rgba(255,255,255,0.9)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            margin: "0 0 16px 0",
            color: "#0f172a",
          }}
        >
          Run Club Membership
        </h1>

        <div
          style={{
            fontSize: 16,
            lineHeight: 1.7,
            color: "#334155",
            marginBottom: 24,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            Unlock your full Run Club experience.

          </div>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 640,
            margin: "0 auto 24px auto",
            borderRadius: 20,
            padding: "20px clamp(18px, 4vw, 28px)",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            boxSizing: "border-box",
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 12,
            }}
          >
            Your membership includes
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.9,
              color: "#334155",
            }}
          >
            ✓ Runner Journey progression
            <br />
            ✓ Exclusive training videos
            <br />
            ✓ Community feed
            <br />
            ✓ Challenges and rankings
            <br />
            ✓ Performance tracking
          </div>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 640,
            margin: "0 auto 24px auto",
            borderRadius: 24,
            padding: "clamp(18px, 4vw, 24px)",
            boxSizing: "border-box",
            border: "1px solid #d6dbe4",
            background: "linear-gradient(180deg, #f8fafc 0%, #edf1f5 100%)",
            boxShadow:
              "8px 8px 24px rgba(148,163,184,0.14), -6px -6px 20px rgba(255,255,255,0.9)",
            textAlign: "left",
            overflow: "hidden",
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              margin: "0 0 16px 0",
              color: "#0f172a",
            }}
          >
            Monthly Subscription
          </h2>

          <div
            style={{
              fontSize: 34,
              fontWeight: 800,
              color: "#0f172a",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            {Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios" ? (appleMonthlyPrice ? `${appleMonthlyPrice} / month` : applePriceError ? "Price unavailable. Please try again later." : "Loading price...") : "Price shown at checkout"}
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#475569",
              textAlign: "center",
              lineHeight: 1.7,
              marginBottom: 18,
            }}
          >
            Eligible new subscribers may receive a 14-day free trial.
            After the trial, the subscription automatically renews at
            the monthly price shown above unless canceled.
            Cancel anytime in your account subscription settings.
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.85,
              color: "#475569",
            }}
          >

            <div>
              ✓ Cancel anytime
              <br />
              ✓ No long-term commitment
              <br />
              ✓ Secure payment
              <br />
              ✓ Automatic monthly renewal
            </div>
          </div>

          <div
            style={{
              marginTop: 22,
              padding: "16px",
              borderRadius: 16,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                cursor: "pointer",
                fontSize: 13,
                lineHeight: 1.6,
                color: "#334155",
              }}
            >
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => {
                  setTermsAccepted(event.target.checked);

                  if (event.target.checked) {
                    setMessage(null);
                  }
                }}
                style={{
                  width: 18,
                  height: 18,
                  marginTop: 2,
                  flexShrink: 0,
                  cursor: "pointer",
                }}
              />

              <span>
                I have read and agree to the{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "underline" }}>
                  Terms &amp; Conditions
                </a>
                {", "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "underline" }}>
                  Privacy Policy
                </a>
                {Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios" && (
                  <>
                    {", and "}
                    <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener noreferrer" style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "underline" }}>
                      Apple Terms of Use (EULA)
                    </a>
                  </>
                )}
                .
              </span>
            </label>
          </div>


          <button
            type="button"
            onClick={handleCreateStripeCheckout}
            disabled={creatingCheckout || !termsAccepted || (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios" && !appleMonthlyPrice)}
            style={{
              width: "100%",
              border: "1px solid #cbd5e1",
              borderRadius: 999,
              padding: "14px 18px",
              marginTop: 20,
              fontSize: 13,
              fontWeight: 700,
              background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
              color: "#f8fafc",
              boxShadow:
                "0 14px 28px rgba(15,23,42,0.18), inset 1px 1px 0 rgba(255,255,255,0.1)",
              cursor:
                creatingCheckout || !termsAccepted
                  ? "not-allowed"
                  : "pointer",
              opacity: creatingCheckout || !termsAccepted ? 0.55 : 1,
            }}
          >
            {creatingCheckout ? "Processing..." : Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios" ? (appleSubscriptionExpired ? "RESUBSCRIBE" : "SUBSCRIBE") : "Continue with Subscription"}
          </button>

          {Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios" && (
            <button
              type="button"
              onClick={handleRestorePurchases}
              disabled={restoringPurchases || creatingCheckout}
              style={{
                display: "block",
                width: "100%",
                marginTop: 14,
                padding: "12px 18px",
                border: "1px solid #94a3b8",
                borderRadius: 999,
                background: "transparent",
                color: "#0f172a",
                fontSize: 14,
                fontWeight: 700,
                cursor: restoringPurchases ? "wait" : "pointer",
                opacity: restoringPurchases || creatingCheckout ? 0.55 : 1,
              }}
            >
              {restoringPurchases ? "Restoring Purchases..." : "Restore Purchases"}
            </button>
          )}

          <div
            style={{
              marginTop: 16,
              textAlign: "center",
              fontSize: 12,
              color: "#64748b",
              lineHeight: 1.8,
            }}
          >
            Subscription renews automatically every month unless canceled.
          </div>


          {message && (
            <div
              style={{
                marginTop: 16,
                fontSize: 13,
                lineHeight: 1.6,
                color: "#9a3412",
                background: "#fff7ed",
                border: "1px solid #fdba74",
                borderRadius: 14,
                padding: "10px 12px",
                textAlign: "center",
              }}
            >
              {message}
            </div>
          )}
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 640,
            margin: "0 auto",
            borderTop: "1px solid #dbe2ea",
            paddingTop: 20,
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.7,
            textAlign: "left",
          }}
        >

          <div style={{ marginBottom: 18 }}>
            Your subscription renews automatically every month until canceled.
            <br />
            You can cancel anytime. Your subscription will remain active until the end of your current billing period.
          </div>
        <div
          style={{
            width: "100%",
            maxWidth: 640,
            margin: "20px auto 0",
            paddingTop: 18,
            borderTop: "1px solid #e2e8f0",
            fontSize: 12,
            lineHeight: 1.7,
            color: "#64748b",
            textAlign: "left",
          }}
        >
          <strong style={{ color: "#475569" }}>
            Your health comes first.
          </strong>{" "}
          Physical activity involves inherent risks. If you have any questions
          about your health or physical condition, consult a physician before
          participating.
        </div>

        </div>
      </div>
    </main>
  );
}

export default function PendingMembershipPage() {
  return (
    <>
      <style jsx global>{`
        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: #000 !important;
          width: 100%;
          height: 100%;
          overflow-x: hidden;
        }

        .pending-page * {
          font-family: "Montserrat", Arial, sans-serif;
        }
      `}</style>

      <Suspense fallback={null}>
        <PendingMembershipContent />
      </Suspense>
    </>
  );
}
