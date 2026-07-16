"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

function isInvalidRefreshTokenError(value: unknown) {
  const error = value as {
    message?: string;
    name?: string;
    code?: string;
  };

  const message = String(error?.message ?? value ?? "").toLowerCase();

  return (
    message.includes("invalid refresh token") ||
    message.includes("refresh token not found") ||
    error?.code === "refresh_token_not_found"
  );
}

function clearSupabaseAuthStorage() {
  if (typeof window === "undefined") return;

  try {
    const projectRef = new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
    ).hostname.split(".")[0];

    const expectedKey = projectRef
      ? `sb-${projectRef}-auth-token`
      : null;

    const keysToRemove: string[] = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (
        key &&
        (
          key === expectedKey ||
          (key.startsWith("sb-") && key.includes("-auth-token"))
        )
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch (error) {
    console.error("Error clearing invalid Supabase session:", error);
  }
}

export default function AuthSessionRecovery() {
  useEffect(() => {
    let recovering = false;

    async function recoverSession(error: unknown) {
      if (recovering || !isInvalidRefreshTokenError(error)) return;

      recovering = true;

      try {
        await supabaseBrowser.auth.signOut({ scope: "local" });
      } catch {
        clearSupabaseAuthStorage();
      } finally {
        clearSupabaseAuthStorage();

        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
      }
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      if (!isInvalidRefreshTokenError(event.reason)) return;

      event.preventDefault();
      void recoverSession(event.reason);
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_OUT" &&
        window.location.pathname !== "/login"
      ) {
        clearSupabaseAuthStorage();
        window.location.replace("/login");
      }
    });

    supabaseBrowser.auth.getSession().then(({ error }) => {
      if (error) void recoverSession(error);
    });

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
