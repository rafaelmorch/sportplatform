// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import LoginTopMenu from "@/components/LoginTopMenu";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* 🔥 REDIRECT DEFINITIVO APÓS LOGIN (EMAIL OU GOOGLE) */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/events");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          setErrorMsg(
            "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada."
          );
        } else {
          setErrorMsg("E-mail ou senha inválidos.");
        }
      }
    } catch {
      setErrorMsg("Erro inesperado ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "facebook") {
    setErrorMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        setErrorMsg("Erro ao iniciar login social.");
        setLoading(false);
      }
    } catch {
      setErrorMsg("Erro inesperado no login social.");
      setLoading(false);
    }
  }

  return (
    <>
      <LoginTopMenu />

      <main
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, #020617 0, #020617 45%, #000000 100%)",
          color: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 16px 24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            borderRadius: "24px",
            border: "1px solid #111827",
            background:
              "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(15,23,42,0.94))",
            boxShadow: "0 24px 70px rgba(0,0,0,0.85)",
            padding: "22px 20px 20px",
          }}
        >
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            Entrar
          </h1>

          {errorMsg && (
            <div
              style={{
                marginBottom: "12px",
                padding: "8px",
                borderRadius: "8px",
                background: "rgba(220,38,38,0.25)",
                fontSize: "13px",
              }}
            >
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: "10px",
                borderRadius: "10px",
                border: "1px solid #1f2937",
                background: "#020617",
                color: "#fff",
              }}
            />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: "10px",
                borderRadius: "10px",
                border: "1px solid #1f2937",
                background: "#020617",
                color: "#fff",
              }}
            />

            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              style={{
                background: "none",
                border: "none",
                color: "#9ca3af",
                fontSize: "12px",
                textAlign: "right",
                cursor: "pointer",
              }}
            >
              {showPassword ? "Esconder senha" : "Mostrar senha"}
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "6px",
                padding: "10px",
                borderRadius: "999px",
                border: "none",
                background: "linear-gradient(135deg,#22c55e,#16a34a)",
                color: "#020617",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div
            style={{
              marginTop: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <button
              onClick={() => handleOAuth("google")}
              style={{
                padding: "10px",
                borderRadius: "999px",
                border: "1px solid #374151",
                background: "transparent",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Continuar com Google
            </button>

            <button
              onClick={() => handleOAuth("facebook")}
              style={{
                padding: "10px",
                borderRadius: "999px",
                border: "1px solid #374151",
                background: "transparent",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Continuar com Facebook
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
