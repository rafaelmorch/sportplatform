"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sportsplatform.app";

// Supabase browser client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Erro ao carregar sessão:", error);
          setErrorMsg("Erro ao carregar sessão. Faça login novamente.");
          setUserId(null);
          setLoading(false);
          return;
        }

        const uid = data.session?.user?.id ?? null;
        if (!uid) {
          setErrorMsg("Você precisa estar logado no site para conectar integrações.");
          setUserId(null);
          setLoading(false);
          return;
        }

        setUserId(uid);
        setLoading(false);
      } catch (err) {
        console.error("Erro inesperado:", err);
        setErrorMsg("Erro inesperado ao preparar as integrações.");
        setUserId(null);
        setLoading(false);
      }
    };

    load();
  }, []);

  const disabled = loading || !userId;

  // ✅ Agora os botões chamam rotas do SEU servidor
  // O server usa FITBIT_CLIENT_ID / STRAVA_CLIENT_ID, sem depender de NEXT_PUBLIC
  const fitbitConnectUrl = useMemo(() => {
    if (!userId) return "#";
    return `${siteUrl}/api/fitbit/connect?state=${encodeURIComponent(userId)}`;
  }, [userId]);

  const stravaConnectUrl = useMemo(() => {
    if (!userId) return "#";
    return `${siteUrl}/api/strava/connect?state=${encodeURIComponent(userId)}`;
  }, [userId]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "640px",
          borderRadius: "24px",
          padding: "32px 28px",
          background:
            "radial-gradient(circle at top, #020617, #020617 40%, #000000 100%)",
          border: "1px solid rgba(148, 163, 184, 0.35)",
          boxShadow:
            "0 18px 45px rgba(15, 23, 42, 0.8), 0 0 0 1px rgba(15, 23, 42, 0.9)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "999px",
              background:
                "radial-gradient(circle at 20% 20%, #16a34a, #22c55e 40%, #0f172a 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 700,
              color: "#0b1120",
            }}
          >
            SP
          </div>
          <div>
            <p
              style={{
                fontSize: "13px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#64748b",
                margin: 0,
              }}
            >
              Integrações
            </p>
            <h1
              style={{
                fontSize: "24px",
                margin: 0,
                color: "#e5e7eb",
              }}
            >
              Conectar Apps de Treino
            </h1>
          </div>
        </div>

        <p
          style={{
            fontSize: "14px",
            lineHeight: 1.6,
            color: "#cbd5f5",
            marginBottom: "18px",
          }}
        >
          Conecte suas contas de Strava e Fitbit ao Sports Platform para
          centralizar histórico de atividades, métricas e desafios em um só
          lugar.
        </p>

        {errorMsg && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: "#fca5a5", margin: 0 }}>
              {errorMsg}
            </p>

            <div style={{ marginTop: 10 }}>
              <Link
                href="/login"
                style={{
                  display: "inline-flex",
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(148,163,184,0.12)",
                  border: "1px solid rgba(148,163,184,0.35)",
                  color: "#e5e7eb",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Ir para Login
              </Link>
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginTop: 8,
            marginBottom: 18,
          }}
        >
          {/* Strava */}
          <div
            style={{
              borderRadius: 18,
              padding: "14px 16px",
              border: "1px solid rgba(148,163,184,0.4)",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.9))",
            }}
          >
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#e5e7eb" }}>
                Strava
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                Importa suas corridas, pedaladas e outras atividades.
              </div>
            </div>

            <a
              href={disabled ? "#" : stravaConnectUrl}
              style={{
                display: "inline-flex",
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
                height: 44,
                borderRadius: "999px",
                marginTop: 8,
                background: disabled
                  ? "linear-gradient(135deg, #4b5563 0%, #374151 40%, #111827 100%)"
                  : "linear-gradient(135deg, #fb923c 0%, #f97316 40%, #ea580c 100%)",
                color: disabled ? "#9ca3af" : "#0b1120",
                fontWeight: 600,
                fontSize: "14px",
                border: "1px solid rgba(248, 250, 252, 0.08)",
                textDecoration: "none",
                boxShadow: disabled
                  ? "none"
                  : "0 12px 35px rgba(15,23,42,0.8), 0 0 0 1px rgba(15,23,42,0.9)",
                pointerEvents: disabled ? "none" : "auto",
              }}
            >
              {loading ? "Preparando conexão..." : "Conectar com Strava"}
            </a>
          </div>

          {/* Fitbit */}
          <div
            style={{
              borderRadius: 18,
              padding: "14px 16px",
              border: "1px solid rgba(148,163,184,0.4)",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.9))",
            }}
          >
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#e5e7eb" }}>
                Fitbit
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                Sincroniza atividades diárias, batimentos e outros dados.
              </div>
            </div>

            <a
              href={disabled ? "#" : fitbitConnectUrl}
              style={{
                display: "inline-flex",
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
                height: 44,
                borderRadius: "999px",
                marginTop: 8,
                background: disabled
                  ? "linear-gradient(135deg, #4b5563 0%, #374151 40%, #111827 100%)"
                  : "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 40%, #0284c7 100%)",
                color: disabled ? "#9ca3af" : "#0b1120",
                fontWeight: 600,
                fontSize: "14px",
                border: "1px solid rgba(248, 250, 252, 0.08)",
                textDecoration: "none",
                boxShadow: disabled
                  ? "none"
                  : "0 12px 35px rgba(15,23,42,0.8), 0 0 0 1px rgba(15,23,42,0.9)",
                pointerEvents: disabled ? "none" : "auto",
              }}
            >
              {loading ? "Preparando conexão..." : "Conectar com Fitbit"}
            </a>
          </div>
        </div>

        <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
          <Link
            href="/dashboard"
            style={{
              fontSize: "13px",
              color: "#9ca3af",
              textDecoration: "underline",
              textUnderlineOffset: 4,
            }}
          >
            Voltar ao dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
