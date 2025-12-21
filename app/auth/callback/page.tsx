"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Finalizando login...");

  useEffect(() => {
    (async () => {
      try {
        // Se veio com ?code=..., troca por sessão
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error(error);
            setMsg("Erro ao finalizar login. Tente novamente.");
            return;
          }
        }

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // limpa query/hash e vai pra eventos
          router.replace("/events");
          return;
        }

        setMsg("Sessão não encontrada. Volte e tente novamente.");
      } catch (e) {
        console.error(e);
        setMsg("Erro inesperado ao finalizar login.");
      }
    })();
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #020617 0, #020617 45%, #000000 100%)",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontSize: "14px",
      }}
    >
      {msg}
    </main>
  );
}
