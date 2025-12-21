"use client";

import { createClient } from "@supabase/supabase-js";
import { useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);

  const handleLogin = async (provider: "google" | "apple") => {
    setLoading(provider);

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: "https://sportsplatform.app/events",
      },
    });

    setLoading(null);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "24px",
      }}
    >
      {/* Conteúdo superior */}
      <div
        style={{
          marginTop: 40,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            marginBottom: 10,
          }}
        >
          SportPlatform
        </h1>

        <p
          style={{
            fontSize: 14,
            color: "#9ca3af",
            maxWidth: 320,
            margin: "0 auto",
          }}
        >
          Conecte-se para acompanhar seus eventos, performance e desafios.
        </p>
      </div>

      {/* Botões fixos embaixo */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {/* Google */}
        <button
          onClick={() => handleLogin("google")}
          disabled={loading !== null}
          style={{
            height: 48,
            borderRadius: 999,
            border: "1px solid #374151",
            background: "#020617",
            color: "#e5e7eb",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          {loading === "google"
            ? "Conectando..."
            : "Continuar com Google"}
        </button>

        {/* Apple */}
        <button
          onClick={() => handleLogin("apple")}
          disabled={loading !== null}
          style={{
            height: 48,
            borderRadius: 999,
            border: "none",
            background: "#dc2626", // vermelho
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading === "apple"
            ? "Conectando..."
            : "Continuar com Apple"}
        </button>

        <p
          style={{
            fontSize: 11,
            color: "#6b7280",
            textAlign: "center",
            marginTop: 6,
          }}
        >
          Ao continuar, você concorda com nossos termos e política de privacidade.
        </p>
      </div>
    </main>
  );
}
