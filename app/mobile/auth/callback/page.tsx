"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MobileAuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Finalizando login...");

  useEffect(() => {
    async function finishLogin() {
      try {
        const url = new URL(window.location.href);

        // Se estiver no navegador, devolve o callback para o app.
        if (!Capacitor.isNativePlatform()) {
          const appUrl =
            "platformsports://auth/callback" +
            url.search +
            url.hash;

          setMsg("Abrindo Platform Sports...");
          window.location.href = appUrl;
          return;
        }

        // A partir daqui estamos dentro do app.
        const queryParams = url.searchParams;
        const hashParams = new URLSearchParams(
          url.hash.startsWith("#")
            ? url.hash.substring(1)
            : url.hash
        );

        const oauthError =
          queryParams.get("error_description") ||
          hashParams.get("error_description") ||
          queryParams.get("error") ||
          hashParams.get("error");

        if (oauthError) {
          throw new Error(oauthError);
        }

        const code = queryParams.get("code");

        const accessToken =
          queryParams.get("access_token") ||
          hashParams.get("access_token");

        const refreshToken =
          queryParams.get("refresh_token") ||
          hashParams.get("refresh_token");

        if (code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
        }

        const { data, error } =
          await supabase.auth.getSession();

        if (error) throw error;

        if (!data.session) {
          setMsg("Sessão não encontrada.");
          return;
        }

        try {
          const { Browser } =
            await import("@capacitor/browser");
          await Browser.close();
        } catch {}

        router.replace("/intro");
      } catch (error: unknown) {
        setMsg(
          error instanceof Error
            ? error.message
            : "Erro ao finalizar login."
        );
      }
    }

    void finishLogin();
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      {msg}
    </main>
  );
}
