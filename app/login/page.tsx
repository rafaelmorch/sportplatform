// app/login/page.tsx
"use client";

import { useState } from "react";
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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          setErrorMsg(
            "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada."
          );
        } else if (error.message.toLowerCase().includes("invalid login")) {
          setErrorMsg("E-mail ou senha inválidos.");
        } else {
          setErrorMsg(error.message);
        }
        return;
      }

      if (data.session) {
        router.push("/events");
      } else {
        setErrorMsg(
          "Login realizado, mas não foi possível criar sessão. Tente novamente."
        );
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
      const redirectTo = `${window.location.origin}/api/auth/callback/`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });

      if (error) {
        setErrorMsg("Não foi possível iniciar o login social.");
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
          <div style={{ marginBottom: "18px" }}>
            <div
              style={{
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              SPORTPLATFORM
            </div>

            <h1
              style={{
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                marginBottom: "4px",
              }}
            >
              Entrar na sua conta
            </h1>

            <p style={{ fontSize: "13px", color: "#9ca3af" }}>
              Acesse seu painel para visualizar treinos, grupos e dados.
            </p>
          </div>

          {errorMsg && (
            <div
              style={{
                marginBottom: "12px",
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid rgba(239,68,68,0.45)",
                background: "rgba(153,27,27,0.25)",
                fontSize: "12px",
                color: "#fecaca",
              }}
            >
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "14px",
            }}
          >
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: "10px",
                borderRadius: "12px",
                border: "1px solid #1f2933",
                backgroundColor: "#020617",
                color: "#e5e7eb",
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
                borderRadius: "12px",
                border: "1px solid #1f2933",
                backgroundColor: "#020617",
                color: "#e5e7eb",
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
                cursor: "pointer",
                textAlign: "right",
              }}
            >
              {showPassword ? "Esconder senha" : "Mostrar senha"}
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px",
                borderRadius: "999px",
                border: "none",
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#020617",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={() => handleOAuth("google")}
              disabled={loading}
              style={{
                padding: "10px",
                borderRadius: "999px",
                border: "1px solid #374151",
                background: "transparent",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
            >
              Continuar com Google
            </button>

            <button
              onClick={() => handleOAuth("facebook")}
              disabled={loading}
              style={{
                padding: "10px",
                borderRadius: "999px",
                border: "1px solid #374151",
                background: "transparent",
                color: "#e5e7eb",
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
