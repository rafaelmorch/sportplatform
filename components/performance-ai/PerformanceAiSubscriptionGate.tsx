"use client";

import type { ReactNode } from "react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import PerformanceAiFloatingMenu from "@/components/performance-ai/PerformanceAiFloatingMenu";
import { supabaseBrowser } from "@/lib/supabase-browser";

type PerformanceAiSubscriptionGateProps = {
  children: ReactNode;
};

const ACTIVE_STATUSES = ["active"];

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

export default function PerformanceAiSubscriptionGate({
  children,
}: PerformanceAiSubscriptionGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => supabaseBrowser, []);

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const isSubscriptionPage =
    pathname === "/performance-ai/subscribe";

  useEffect(() => {
    let cancelled = false;

    const checkSubscription = async () => {
      if (isSubscriptionPage) {
        if (!cancelled) {
          setAllowed(true);
          setChecking(false);
        }

        return;
      }

      try {
        setChecking(true);
        setAllowed(false);
        setErrorMessage(null);

        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        const session = sessionData.session;
        const user = session?.user ?? null;

        if (!user) {
          if (!cancelled) {
            router.replace("/login");
          }

          return;
        }

        const paymentSucceeded =
          searchParams.get("payment") === "success";

        const attempts = paymentSucceeded ? 8 : 1;

        for (
          let attempt = 0;
          attempt < attempts;
          attempt += 1
        ) {
          const {
            data: subscription,
            error: subscriptionError,
          } = await supabase
            .from("performance_ai_subscriptions")
            .select("status, current_period_end")
            .eq("user_id", user.id)
            .in("status", ACTIVE_STATUSES)
            .order("created_at", {
              ascending: false,
            })
            .limit(1)
            .maybeSingle();

          if (subscriptionError) {
            throw subscriptionError;
          }

          if (subscription?.status === "active") {
            if (!cancelled) {
              setAllowed(true);
              setChecking(false);
            }

            return;
          }

          if (attempt < attempts - 1) {
            await wait(1500);
          }
        }

        if (!cancelled) {
          router.replace(
            paymentSucceeded
              ? "/performance-ai/subscribe?payment=processing"
              : "/performance-ai/subscribe"
          );
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível verificar sua assinatura.";

        if (!cancelled) {
          setErrorMessage(message);
          setChecking(false);
        }
      }
    };

    void checkSubscription();

    return () => {
      cancelled = true;
    };
  }, [
    isSubscriptionPage,
    pathname,
    router,
    searchParams,
    supabase,
  ]);

  if (checking) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          boxSizing: "border-box",
          background: "#050505",
          color: "#d4d4d8",
          fontFamily: "Montserrat, sans-serif",
          fontSize: 14,
        }}
      >
        Verificando sua assinatura...
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          boxSizing: "border-box",
          background: "#050505",
          color: "#ffffff",
          fontFamily: "Montserrat, sans-serif",
        }}
      >
        <div
          style={{
            width: "min(520px, 100%)",
            padding: 24,
            border:
              "1px solid rgba(248,113,113,0.35)",
            background: "rgba(127,29,29,0.14)",
          }}
        >
          <div
            style={{
              fontSize: 18,
              lineHeight: 1.4,
            }}
          >
            Não foi possível verificar sua assinatura.
          </div>

          <div
            style={{
              marginTop: 10,
              color: "#fecaca",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {errorMessage}
          </div>

          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 18,
              minHeight: 42,
              border:
                "1px solid rgba(255,241,168,0.45)",
              background:
                "rgba(255,241,168,0.1)",
              color: "#fff1a8",
              padding: "0 16px",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return null;
  }

  return (
    <>
      {children}

      {!isSubscriptionPage ? (
        <PerformanceAiFloatingMenu />
      ) : null}
    </>
  );
}

