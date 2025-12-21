"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sportsplatform.app";

const stravaClientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID!;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type ConnectionStatus = {
  stravaConnected: boolean;
  fitbitConnected: boolean;
};

export default function IntegrationsPage() {
  const [stravaUrl, setStravaUrl] = useState<string | null>(null);
  const [fitbitUrl, setFitbitUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [status, setStatus] = useState<ConnectionStatus>({
    stravaConnected: false,
    fitbitConnected: false,
  });

  const queryParams = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        // 1) Sessão do usuário (site)
        const { data: sessionData, error: sessionErr } =
          await supabase.auth.getSession();

        if (sessionErr) {
          console.error("Erro ao carregar sessão:", sessionErr);
          setErrorMsg("Erro ao carregar usuário. Faça login novamente.");
          setLoading(false);
          return;
        }

        const userId = sessionData.session?.user?.id ?? null;

        if (!userId) {
          setErrorMsg("Você precisa estar logado no site para conectar integrações.");
          setStravaUrl(null);
          setFitbitUrl(null);
          setLoading(false);
          return;
        }

        // 2) Monta URLs de OAuth (sempre)
        const stravaRedirect = `${siteUrl}/api/strava/callback`;
        const stravaParams = new URLSearchParams({
          client_id: stravaClientId,
          response_type: "code",
          redirect_uri: stravaRedirect,
          approval_prompt: "auto",
          scope: "read,activity:read_all",
          state: userId,
        });
        setStravaUrl(
          `https://www.strava.com/oauth/authorize?${stravaParams.toString()}`
        );

        // ✅ FITBIT: agora passa pelo seu backend (pra garantir scope correto + state)
        setFitbitUrl(`/api/fitbit/connect?state=${userId}`);

        // 3) Verifica se já tem tokens salvos
        // Fitbit
        const { data: fitbitRow, error: fitbitErr } = await supabase
          .from("fitbit_tokens")
          .select("fitbit_user_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (fitbitErr) {
          console.error("Erro ao checar fitbit_tokens:", fitbitErr);
          setErrorMsg("Erro ao verificar conexão do Fitbit. Tente recarregar.");
        }

        // Strava
        const { data: stravaRow, error: stravaErr } = await supabase
          .from("strava_tokens")
          .select("athlete_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (stravaErr) {
          console.error("Erro ao checar strava_tokens:", stravaErr);
          setErrorMsg("Erro ao verificar conexão do Strava. Tente recarregar.");
        }

        setStatus({
          fitbitConnected: !!fitbitRow?.fitbit_user_id,
          stravaConnected: !!stravaRow?.athlete_id,
        });

        // 4) Se veio do callback com status=success, reflete na UI também
        const provider = queryParams?.get("provider");
        const ok = queryParams?.get("status") === "success";
        if (ok && provider === "fitbit") {
          setStatus((s) => ({ ...s, fitbitConnected: true }));
        }
        if (ok && provider === "strava") {
          setStatus((s) => ({ ...s, stravaConnected: true }));
        }

        setLoading(false);
      } catch (e) {
        console.error("Erro inesperado:", e);
        setErrorMsg("Erro inesperado ao preparar as integrações.");
        setLoading(false);
      }
    };

    run();
  }, [queryParams]);

  const disabledStrava = loading || !stravaUrl || status.stravaConnected;
  const disabledFitbit = loading || !fitbitUrl || status.fitbitConnected;

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
            <h1 style={{ fontSize: "24px", margin: 0, color: "#e5e7eb" }}>
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
          centralizar histórico de atividades, métricas e desafios em um só lugar.
        </p>

        {errorMsg && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: "#fca5a5", margin: 0 }}>{errorMsg}</p>
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

        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#e5e7eb" }}>
                  Strava
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                  Importa suas corridas, pedaladas e outras atividades.
                </div>
              </div>

              {status.stravaConnected && (
                <div
                  style={{
                    alignSelf: "center",
                    fontSize: 12,
                    color: "#bbf7d0",
                    border: "1px solid rgba(34,197,94,0.35)",
                    background: "rgba(22,163,74,0.12)",
                    padding: "6px 10px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
                  Conectado ✅
                </div>
              )}
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
                marginTop: 10,
                background: disabledStrava
                  ? "linear-gradient(135deg, #4b5563 0%, #374151 40%, #111827 100%)"
                  : "linear-gradient(135deg, #fb923c 0%, #f97316 40%, #ea580c 100%)",
                color: disabledStrava ? "#9ca3af" : "#0b1120",
                fontWeight: 700,
                fontSize: "14px",
                border: "1px solid rgba(248, 250, 252, 0.08)",
                textDecoration: "none",
                pointerEvents: disabledStrava ? "none" : "auto",
              }}
            >
              {loading
                ? "Preparando..."
                : status.stravaConnected
                ? "Strava Conectado"
                : "Conectar com Strava"}
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
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#e5e7eb" }}>
                  Fitbit
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                  Sincroniza atividades diárias, batimentos e outros dados.
                </div>
              </div>

              {status.fitbitConnected && (
                <div
                  style={{
                    alignSelf: "center",
                    fontSize: 12,
                    color: "#bbf7d0",
                    border: "1px solid rgba(34,197,94,0.35)",
                    background: "rgba(22,163,74,0.12)",
                    padding: "6px 10px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
                  Conectado ✅
                </div>
              )}
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
                marginTop: 10,
                background: disabledFitbit
                  ? "linear-gradient(135deg, #4b5563 0%, #374151 40%, #111827 100%)"
                  : "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 40%, #0284c7 100%)",
                color: disabledFitbit ? "#9ca3af" : "#0b1120",
                fontWeight: 700,
                fontSize: "14px",
                border: "1px solid rgba(248, 250, 252, 0.08)",
                textDecoration: "none",
                pointerEvents: disabledFitbit ? "none" : "auto",
              }}
            >
              {loading
                ? "Preparando..."
                : status.fitbitConnected
                ? "Fitbit Conectado"
                : "Conectar com Fitbit"}
            </a>
          </div>
        </div>

        <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
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
