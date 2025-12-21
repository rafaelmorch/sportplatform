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

  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* 🔥 REDIRECT DEFINITIVO APÓS LOGIN */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/events");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoadingEmail(true);

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
      setLoadingEmail(false);
    }
  }

  async function handleGoogle() {
    setErrorMsg(null);
    setLoadingGoogle(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        setErrorMsg("Erro ao iniciar login com Google.");
        setLoadingGoogle(false);
      }
    } catch {
      setErrorMsg("Erro inesperado no login com Google.");
      setLoadingGoogle(false);
    }
  }

  const anyLoading = loadingEmail || loadingGoogle;

  return (
    <>
      <LoginTopMenu />

      <main
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, #020617 0, #020617 45%, #000000 100%)",
          color: "#e5e7eb",
          padding: "120px 16px 24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
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
            padding: "24px 22px 22px",
          }}
        >
          {/* LOGO */}
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <img
              src="/logo-sports-platform.png"
              alt="Sports Platform"
              style={{
                width: 160,
                marginBottom: 6,
              }}
            />
          </div>

          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Entrar
          </h1>

          {errorMsg && (
            <div
              style={{
                marginBottom: 12,
                padding: "8px",
                borderRadius: 8,
                background: "rgba(220,38,38,0.25)",
                fontSize: 13,
              }}
            >
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: 10,
                borderRadius: 10,
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
                padding: 10,
                borderRadius: 10,
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
                fontSize: 12,
                textAlign: "right",
                cursor: "pointer",
              }}
            >
              {showPassword ? "Esconder senha" : "Mostrar senha"}
            </button>

            {/* BOTÃO ENTRAR */}
            <button
              type="submit"
              disabled={anyLoading}
              style={{
                marginTop: 6,
                padding: 11,
                borderRadius: 999,
                border: "none",
                background: "linear-gradient(135deg,#22c55e,#16a34a)",
                color: "#020617",
                fontWeight: 700,
                cursor: anyLoading ? "not-allowed" : "pointer",
              }}
            >
              {loadingEmail ? "Entrando..." : "Entrar"}
            </button>

            {/* GOOGLE LOGO ABAIXO – VERMELHO */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={anyLoading}
              style={{
                marginTop: 8,
                padding: 11,
                borderRadius: 999,
                border: "none",
                background: "#dc2626",
                color: "#ffffff",
                fontWeight: 700,
                cursor: anyLoading ? "not-allowed" : "pointer",
              }}
            >
              {loadingGoogle ? "Conectando..." : "Continuar com Google"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
