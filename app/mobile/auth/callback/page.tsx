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
        const code = url.searchParams.get("code");

        if (code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("Erro ao trocar código por sessão:", error);
            setMsg("Erro ao finalizar login. Tente novamente.");
            return;
          }
        }

        const { data, error } =
          await supabase.auth.getSession();

        if (error) {
          console.error("Erro ao carregar sessão:", error);
          setMsg("Erro ao carregar sua sessão.");
          return;
        }

        if (data.session) {
          router.replace("/intro");
          return;
        }

        setMsg("Sessão não encontrada. Volte e tente novamente.");
      } catch (error) {
        console.error("Erro inesperado no login móvel:", error);
        setMsg("Erro inesperado ao finalizar login.");
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
