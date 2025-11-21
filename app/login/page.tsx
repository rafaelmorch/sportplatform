"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

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
        // Erros comuns de auth do Supabase
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
        // Login OK → manda pro dashboard (ou outra página que você quiser)
        router.push("/dashboard");
      } else {
        setErrorMsg(
          "Login realizado, mas não foi possível criar sessão. Tente novamente."
        );
      }
    } catch (err: any) {
      setErrorMsg("Erro inesperado ao fazer login.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleGoToSignup() {
    router.push("/signup");
  }

  function handleForgotPassword() {
    router.push("/forgot-password");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #020617 0, #020617 45%, #000000 100%)",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
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
        {/* Logo / título */}
        <div
          style={{
            marginBottom: "18px",
          }}
        >
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
          <p
            style={{
              fontSize: "13px",
              color: "#9ca3af",
            }}
          >
            Acesse seu painel para visualizar treinos, grupos e dados do Strava.
          </p>
        </div>

        {/* Mensagem de erro */}
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

        {/* Formulário */}
        <form
          onSubmit={handleLogin}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          {/* E-mail */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              htmlFor="email"
              style={{ fontSize: "13px", color: "#d1d5db" }}
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 11px",
                borderRadius: "12px",
                border: "1px solid #1f2933",
                backgroundColor: "#020617",
                color: "#e5e7eb",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>

          {/* Senha + olhinho */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              htmlFor="password"
              style={{ fontSize: "13px", color: "#d1d5db" }}
            >
              Senha
            </label>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 36px 10px 11px",
                  borderRadius: "12px",
                  border: "1px solid #1f2933",
                  backgroundColor: "#020617",
                  color: "#e5e7eb",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "transparent",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                  fontSize: "11px",
                  padding: "4px",
                }}
              >
                {showPassword ? "Esconder" : "Mostrar"}
              </button>
            </div>
          </div>

          {/* Esqueci senha */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "2px",
            }}
          >
            <button
              type="button"
              onClick={handleForgotPassword}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: "12px",
                color: "#9ca3af",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Esqueceu a senha?
            </button>
          </div>

          {/* Botão de login */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "2px",
              width: "100%",
              padding: "10px 14px",
              borderRadius: "999px",
              border: "none",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              background:
                "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#020617",
              boxShadow: "0 14px 40px rgba(34,197,94,0.45)",
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* Separador */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "linear-gradient(to right, transparent, #1f2937)",
            }}
          />
          <span
            style={{
              fontSize: "11px",
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            ou
          </span>
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "linear-gradient(to right, #1f2937, transparent)",
            }}
          />
        </div>

        {/* Link para cadastro */}
        <div
          style={{
            fontSize: "13px",
            color: "#9ca3af",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span>Ainda não tem conta?</span>
          <button
            type="button"
            onClick={handleGoToSignup}
            style={{
              borderRadius: "999px",
              border: "1px solid #374151",
              backgroundColor: "transparent",
              color: "#e5e7eb",
              padding: "7px 12px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Criar conta
          </button>
        </div>
      </div>
    </main>
  );
}
