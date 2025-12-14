"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sportsplatform.app";

const stravaClientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID!;
const fitbitClientId = process.env.NEXT_PUBLIC_FITBIT_CLIENT_ID!;

// Supabase browser client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type ConnState = {
  loggedIn: boolean;
  userId: string | null;
  stravaConnected: boolean;
  fitbitConnected: boolean;
  loading: boolean;
  errorMsg: string | null;
};

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider");
  const status = searchParams.get("status");

  const [state, setState] = useState<ConnState>({
    loggedIn: false,
    userId: null,
    stravaConnected: false,
    fitbitConnected: false,
    loading: true,
    errorMsg: null,
  });

  const successBanner = useMemo(() => {
    if (status === "success" && provider === "fitbit") return "✅ Fitbit conectado com sucesso!";
    if (status === "success" && provider === "strava") return "✅ Strava conectado com sucesso!";
    return null;
  }, [provider, status]);

  useEffect(() => {
    const load = async () => {
      try {
        setState((s) => ({ ...s, loading: true, errorMsg: null }));

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Erro ao carregar sessão:", error);
          setState((s) => ({
            ...s,
            loading: false,
            errorMsg: "Erro ao carregar sessão. Faça login novamente.",
          }));
          return;
        }

        const session = data.session;
        const userId = session?.user?.id ?? null;

        if (!userId) {
          setState({
            loggedIn: false,
            userId: null,
            stravaConnected: false,
            fitbitConnected: false,
            loading: false,
            errorMsg: "Você precisa estar logado no site para conectar integrações.",
          });
          return;
        }

        // ✅ verifica se já existe token salvo para este usuário
        const [fitbitRes, stravaRes] = await Promise.all([
          supabase
            .from("fitbit_tokens")
            .select("fitbit_user_id")
            .eq("user_id", userId)
            .limit(1)
            .maybeSingle(),
          supabase
            .from("strava_tokens")
            .select("athlete_id")
            .eq("user_id", userId)
            .limit(1)
            .maybeSingle(),
        ]);

        if (fitbitRes.error) console.warn("Fitbit tokens query error:", fitbitRes.error);
        if (stravaRes.error) console.warn("Strava tokens query error:", stravaRes.error);

        setState({
          loggedIn: true,
          userId,
          fitbitConnected: !!fitbitRes.data,
          stravaConnected: !!stravaRes.data,
          loading: false,
          errorMsg: null,
        });
      } catch (err) {
        console.error("Erro inesperado:", err);
        setState((s) => ({
          ...s,
          loading: false,
          errorMsg: "Erro inesperado ao preparar as integrações.",
        }));
      }
    };

    load();
  }, []);

  const disabled = state.loading || !state.loggedIn || !state.userId;

  // ---------- STRAVA URL ----------
  const stravaUrl = useMemo(() => {
    if (!state.userId) return null;

    const stravaRedirect = `${siteUrl}/api/strava/callback`;
    const params = new URLSearchParams({
      client_id: stravaClientId,
      response_type: "code",
      redirect_uri: stravaRedirect,
      approval_prompt: "auto",
      scope: "read,activity:read_all",
      state: state.userId,
    });

    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
  }, [state.userId]);

  // ---------- FITBIT URL ----------
  const fitbitUrl = useMemo(() => {
    if (!state.userId) return null;

    // ⚠️ use o mesmo callback que está cadastrado no site do Fitbit
    const fitbitRedirect = `${siteUrl}/api/fitbit/callback`;

    const scope =
      "activity heartrate location profile settings sleep social weight";

    const params = new URLSearchParams({
      response_type: "code",
      client_id: fitbitClientId,
      redirect_uri: fitbitRedirect,
      scope,
      state: state.userId,
    });

    return `https://www.fitbit.com/oauth2/authorize?${params.toString()}`;
  }, [state.userId]);

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
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background:
                "radial-gradient(circle at 20% 20%, #16a34a, #22c55e 40%, #0f172a 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 700,
              color: "#0b1120",
            }}
          >
            SP
          </div>
          <div>
            <p
              style={{
                fontSize: 13,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#64748b",
                margin: 0,
              }}
            >
              Integrações
            </p>
            <h1 style={{ fontSize: 24, margin: 0, color: "#e5e7eb" }}>
              Conectar Apps de Treino
            </h1>
          </div>
        </div>

        <p style={{ fontSize: 14, lineHeight: 1.6, color: "#cbd5f5", marginBottom: 18 }}>
          Conecte suas contas de Strava e Fitbit ao Sports Platform para centralizar histórico
          de atividades, métricas e desafios em um só lugar.
        </p>

        {successBanner && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(34,197,94,0.35)",
              background: "rgba(22,163,74,0.15)",
              fontSize: 13,
              color: "#bbf7d0",
            }}
          >
            {successBanner}
          </div>
        )}

        {state.errorMsg && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: "#fca5a5", margin: 0 }}>{state.errorMsg}</p>

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
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8, marginBottom: 18 }}>
          {/* Strava */}
          <div
            style={{
              borderRadius: 18,
              padding: "14px 16px",
              border: "1px solid rgba(148,163,184,0.4)",
              background: "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.9))",
            }}
          >
            <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#e5e7eb" }}>Strava</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                  Importa suas corridas, pedaladas e outras atividades.
                </div>
              </div>

              <div style={{ fontSize: 12, color: state.stravaConnected ? "#86efac" : "#fca5a5" }}>
                {state.loading ? "..." : state.stravaConnected ? "✅ Conectado" : "❌ Não conectado"}
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
                borderRadius: 999,
                marginTop: 8,
                background: disabled
                  ? "linear-gradient(135deg, #4b5563 0%, #374151 40%, #111827 100%)"
                  : "linear-gradient(135deg, #fb923c 0%, #f97316 40%, #ea580c 100%)",
                color: disabled ? "#9ca3af" : "#0b1120",
                fontWeight: 600,
                fontSize: 14,
                border: "1px solid rgba(248, 250, 252, 0.08)",
                textDecoration: "none",
                boxShadow: disabled ? "none" : "0 12px 35px rgba(15,23,42,0.8)",
                pointerEvents: disabled ? "none" : "auto",
              }}
            >
              {state.loading ? "Preparando..." : state.stravaConnected ? "Reconectar Strava" : "Conectar com Strava"}
            </a>
          </div>

          {/* Fitbit */}
          <div
            style={{
              borderRadius: 18,
              padding: "14px 16px",
              border: "1px solid rgba(148,163,184,0.4)",
              background: "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.9))",
            }}
          >
            <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#e5e7eb" }}>Fitbit</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                  Sincroniza atividades diárias, batimentos e outros dados.
                </div>
              </div>

              <div style={{ fontSize: 12, color: state.fitbitConnected ? "#86efac" : "#fca5a5" }}>
                {state.loading ? "..." : state.fitbitConnected ? "✅ Conectado" : "❌ Não conectado"}
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
                borderRadius: 999,
                marginTop: 8,
                background: disabled
                  ? "linear-gradient(135deg, #4b5563 0%, #374151 40%, #111827 100%)"
                  : "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 40%, #0284c7 100%)",
                color: disabled ? "#9ca3af" : "#0b1120",
                fontWeight: 600,
                fontSize: 14,
                border: "1px solid rgba(248, 250, 252, 0.08)",
                textDecoration: "none",
                boxShadow: disabled ? "none" : "0 12px 35px rgba(15,23,42,0.8)",
                pointerEvents: disabled ? "none" : "auto",
              }}
            >
              {state.loading ? "Preparando..." : state.fitbitConnected ? "Reconectar Fitbit" : "Conectar com Fitbit"}
            </a>
          </div>
        </div>

        <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
          <Link
            href="/dashboard"
            style={{
              fontSize: 13,
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
