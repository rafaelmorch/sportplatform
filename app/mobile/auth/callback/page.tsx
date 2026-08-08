"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function MobileAuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Finalizando login...");

  useEffect(() => {
    async function finishLogin() {
      try {
        const url = new URL(window.location.href);
        console.log("MOBILE AUTH CALLBACK:", window.location.href);
        setMsg("CALLBACK RECEBIDO: " + window.location.href);
        setMsg("CALLBACK RECEBIDO: " + window.location.href);

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

          if (error) {
            throw error;
          }
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }
        }

        const { data, error } =
          await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!data.session) {
          setMsg("Sessão não encontrada. Volte e tente novamente.");
          return;
        }

        try {
          const { Browser } =
            await import("@capacitor/browser");

          await Browser.close();
        } catch {
          // O navegador pode já estar fechado.
        }

        window.history.replaceState(
          null,
          "",
          "/mobile/auth/callback"
        );

        router.replace("/intro");
      } catch (error: unknown) {
        console.error("Erro no login móvel:", error);

        setMsg(
          error instanceof Error
            ? error.message
            : "Erro inesperado ao finalizar login."
        );
      }
    }

    void finishLogin();
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        background:
          "radial-gradient(circle at top, #020617 0, #020617 45%, #000000 100%)",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
        fontSize: 14,
      }}
    >
      {msg}
    </main>
  );
}



