"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email) {
      setErrorMsg("Informe um e-mail válido.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://sportplatform.app/login",
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setSuccessMsg(
        "Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha."
      );
      setEmail("");
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro inesperado ao solicitar redefinição de senha.");
    } finally {
      setLoading(false);
    }
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
          padding: "24px 20px 22px",
        }}
      >
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            marginBottom: "6px",
          }}
        >
          Recuperar senha
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "#9ca3af",
            marginBottom: "16px",
          }}
        >
          Informe o e-mail cadastrado para receber um link de redefinição.
        </p>

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

        {successMsg && (
          <div
            style={{
              marginBottom: "12px",
              padding: "8px 10px",
              borderRadius: "10px",
              border: "1px solid rgba(34,197,94,0.45)",
              background: "rgba(21,128,61,0.25)",
              fontSize: "12px",
              color: "#bbf7d0",
            }}
          >
            {successMsg}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              htmlFor="email"
              style={{ fontSize: "13px", color: "#d1d5db" }}
            >
              E-mail cadastrado
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

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "6px",
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
            {loading ? "Enviando..." : "Enviar link de redefinição"}
          </button>
        </form>

        <div
          style={{
            fontSize: "13px",
            color: "#9ca3af",
            textAlign: "center",
          }}
        >
          Lembrou a senha?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: "13px",
              color: "#e5e7eb",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Voltar ao login
          </button>
        </div>
      </div>
    </main>
  );
}
