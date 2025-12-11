"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sportsplatform.app"; // <- com S
const stravaClientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID!;
const fitbitClientId = process.env.NEXT_PUBLIC_FITBIT_CLIENT_ID!;

// Supabase browser client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const [stravaUrl, setStravaUrl] = useState<string | null>(null);
  const [fitbitUrl, setFitbitUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const status = searchParams.get("status");
  const provider = searchParams.get("provider");

  let successMsg: string | null = null;
  if (status === "success" && provider === "strava") {
    successMsg = "Strava connected successfully!";
  } else if (status === "success" && provider === "fitbit") {
    successMsg = "Fitbit connected successfully!";
  }

  useEffect(() => {
    const setupUrls = async () => {
      try {
        setErrorMsg(null);
        setLoading(true);

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Erro ao carregar usuário:", error);
          setErrorMsg("Erro ao carregar usuário. Faça login novamente.");
          setLoading(false);
          return;
        }

        if (!user) {
          setErrorMsg("Você precisa estar logado para conectar integrações.");
          setLoading(false);
          return;
        }

        // ---------- STRAVA ----------
        const stravaRedirect = `${siteUrl}/api/strava/callback`;

        const stravaParams = new URLSearchParams({
          client_id: stravaClientId,
          response_type: "code",
          redirect_uri: stravaRedirect,
          approval_prompt: "auto",
          scope: "read,activity:read_all",
          state: user.id,
        });

        const stravaAuthorizeUrl = `https://www.strava.com/oauth/authorize?${stravaParams.toString()}`;
        setStravaUrl(stravaAuthorizeUrl);

        // ---------- FITBIT ----------
        const fitbitRedirect = `${siteUrl}/api/fitbit/callback`;
        const fitbitScope =
          "activity heartrate location profile settings sleep social weight";

        const fitbitParams = new URLSearchParams({
          response_type: "code",
          client_id: fitbitClientId,
          redirect_uri: fitbitRedirect,
          scope: fitbitScope,
          state: user.id,
        });

        const fitbitAuthorizeUrl = `https://www.fitbit.com/oauth2/authorize?${fitbitParams.toString()}`;
        setFitbitUrl(fitbitAuthorizeUrl);

        setLoading(false);
      } catch (err) {
        console.error("Erro inesperado ao montar URLs de integração:", err);
        setErrorMsg("Erro inesperado ao preparar as integrações.");
        setLoading(false);
      }
    };

    setupUrls();
  }, []);

  const disabledStrava = loading || !stravaUrl;
  const disabledFitbit = loading || !fitbitUrl;

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

        {successMsg && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(34,197,94,0.4)",
              background: "rgba(22,163,74,0.15)",
              color: "#bbf7d0",
              fontSize: 13,
            }}
          >
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <p
            style={{
              fontSize: 13,
              color: "#fca5a5",
              marginBottom: 12,
            }}
          >
            {errorMsg}
          </p>
        )}

        {/* Cards de integrações */}
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#e5e7eb",
                  }}
                >
                  Strava
                </div>
                <div
                  style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}
                >
                  Importa suas corridas, pedaladas e outras atividades.
                </div>
              </div>
            </div>

            <a
              href={stravaUrl ?? "#"}
              style={{
                display: "inline-flex",
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
                height: 44,
                borderRadius: "999px",
                marginTop: 8,
                background: disabledStrava
                  ? "linear-gradient(135deg, #4b5563 0%, #374151 40%, #111827 100%)"
                  : "linear-gradient(135deg, #fb923c 0%, #f97316 40%, #ea580c 100%)",
                color: disabledStrava ? "#9ca3af" : "#0b1120",
                fontWeight: 600,
                fontSize: "14px",
                border: "1px solid rgba(248, 250, 252, 0.08)",
                textDecoration: "none",
                boxShadow: disabledStrava
                  ? "none"
                  : "0 12px 35px rgba(15,23,42,0.8), 0 0 0 1px rgba(15,23,42,0.9)",
                pointerEvents: disabledStrava ? "none" : "auto",
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#e5e7eb",
                  }}
                >
                  Fitbit
                </div>
                <div
                  style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}
                >
                  Sincroniza atividades diárias, batimentos e outros dados.
                </div>
              </div>
            </div>

            <a
              href={fitbitUrl ?? "#"}
              style={{
                display: "inline-flex",
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
                height: 44,
                borderRadius: "999px",
                marginTop: 8,
                background: disabledFitbit
                  ? "linear-gradient(135deg, #4b5563 0%, #374151 40%, #111827 100%)"
                  : "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 40%, #0284c7 100%)",
                color: disabledFitbit ? "#9ca3af" : "#0b1120",
                fontWeight: 600,
                fontSize: "14px",
                border: "1px solid rgba(248, 250, 252, 0.08)",
                textDecoration: "none",
                boxShadow: disabledFitbit
                  ? "none"
                  : "0 12px 35px rgba(15,23,42,0.8), 0 0 0 1px rgba(15,23,42,0.9)",
                pointerEvents: disabledFitbit ? "none" : "auto",
              }}
            >
              {loading ? "Preparando conexão..." : "Conectar com Fitbit"}
            </a>
          </div>
        </div>

        <div
          style={{
            marginTop: "8px",
            display: "flex",
            justifyContent: "center",
          }}
        >
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
