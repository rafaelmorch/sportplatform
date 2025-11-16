"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { error } = await supabaseBrowser.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Conta criada! Agora faça login.");
        setMode("login");
      } else {
        const { data, error } = await supabaseBrowser.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        router.push("/"); // depois trocamos para /dashboard
      }
    } catch (err: any) {
      setMessage(err.message ?? "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f172a",
      color: "#e5e7eb",
      padding: "16px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "380px",
        background: "#020617",
        padding: "28px",
        borderRadius: "16px",
        border: "1px solid #1e293b",
        boxShadow: "0 10px 40px rgba(0,0,0,0.4)"
      }}>
        <h1 style={{ fontSize: "26px", marginBottom: "5px", fontWeight: 700 }}>
          SportPlatform
        </h1>
        <p style={{ marginBottom: "18px", color: "#94a3b8" }}>
          {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
          <label style={{ fontSize: "14px", color: "#cbd5e1" }}>
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                marginTop: "4px",
                padding: "8px 10px",
                width: "100%",
                borderRadius: "8px",
                background: "#0f172a",
                border: "1px solid #475569",
                color: "#e2e8f0"
              }}
            />
          </label>

          <label style={{ fontSize: "14px", color: "#cbd5e1" }}>
            Senha
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                marginTop: "4px",
                padding: "8px 10px",
                width: "100%",
                borderRadius: "8px",
                background: "#0f172a",
                border: "1px solid #475569",
                color: "#e2e8f0"
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "6px",
              padding: "10px",
              borderRadius: "999px",
              background: loading ? "#6b7280" : "#22c55e",
              border: "none",
              color: "#0f172a",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {loading ? "Enviando..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        {message && (
          <p style={{ marginTop: "14px", fontSize: "14px", color: "#f87171" }}>
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(null); }}
          style={{
            marginTop: "20px",
            background: "transparent",
            border: "none",
            color: "#60a5fa",
            fontSize: "14px",
            textDecoration: "underline",
            cursor: "pointer"
          }}
        >
          {mode === "login"
            ? "Criar uma conta"
            : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
