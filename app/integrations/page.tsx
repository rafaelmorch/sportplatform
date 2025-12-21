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

        // 1) Sessão do usuário
        const { data: sessionData, error: sessionErr } =
          await supabase.auth.getSession();

        if (sessionErr) {
          setErrorMsg("Erro ao carregar usuário. Faça login novamente.");
          setLoading(false);
          return;
        }

        const userId = sessionData.session?.user?.id ?? null;

        if (!userId) {
          setErrorMsg("Você precisa estar logado para conectar integrações.");
          setLoading(false);
          return;
        }

        // 2) URL STRAVA (continua direto)
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

        // 3) URL FITBIT (AGORA PASSA PELO BACKEND)
        setFitbitUrl(`/api/fitbit/connect?state=${userId}`);

        // 4) Verifica conexões salvas
        const { data: fitbitRow } = await supabase
          .from("fitbit_tokens")
          .select("fitbit_user_id")
          .eq("user_id", userId)
          .maybeSingle();

        const { data: stravaRow } = await supabase
          .from("strava_tokens")
          .select("athlete_id")
          .eq("user_id", userId)
          .maybeSingle();

        setStatus({
          fitbitConnected: !!fitbitRow?.fitbit_user_id,
          stravaConnected: !!stravaRow?.athlete_id,
        });

        // 5) Reflete sucesso ao voltar do callback
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
        setErrorMsg("Erro inesperado ao preparar integrações.");
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
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 18, color: "#e5e7eb" }}>
          Conectar Apps de Treino
        </h1>

        {errorMsg && (
          <p style={{ fontSize: 13, color: "#fca5a5" }}>{errorMsg}</p>
        )}

        {/* STRAVA */}
        <a
          href={stravaUrl ?? "#"}
          style={{
            display: "block",
            width: "100%",
            textAlign: "center",
            padding: "12px",
            borderRadius: 999,
            marginBottom: 12,
            background: disabledStrava ? "#374151" : "#f97316",
            color: "#020617",
            fontWeight: 700,
            pointerEvents: disabledStrava ? "none" : "auto",
            textDecoration: "none",
          }}
        >
          {loading
            ? "Preparando..."
            : status.stravaConnected
            ? "Strava Conectado"
            : "Conectar com Strava"}
        </a>

        {/* FITBIT */}
        <a
          href={fitbitUrl ?? "#"}
          style={{
            display: "block",
            width: "100%",
            textAlign: "center",
            padding: "12px",
            borderRadius: 999,
            background: disabledFitbit ? "#374151" : "#0ea5e9",
            color: "#020617",
            fontWeight: 700,
            pointerEvents: disabledFitbit ? "none" : "auto",
            textDecoration: "none",
          }}
        >
          {loading
            ? "Preparando..."
            : status.fitbitConnected
            ? "Fitbit Conectado"
            : "Conectar com Fitbit"}
        </a>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Link href="/dashboard" style={{ color: "#9ca3af", fontSize: 13 }}>
            Voltar ao dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
