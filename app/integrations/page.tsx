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
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [revokingStrava, setRevokingStrava] = useState(false);

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

        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id ?? null;

        if (!userId) {
          setErrorMsg("Você precisa estar logado para conectar integrações.");
          setLoading(false);
          return;
        }

        // Strava OAuth URL
        const stravaRedirect = `${siteUrl}/api/strava/callback`;
        const stravaParams = new URLSearchParams({
          client_id: stravaClientId,
          response_type: "code",
          redirect_uri: stravaRedirect,
          approval_prompt: "auto",
          scope: "read,activity:read_all",
          state: userId,
        });
        setStravaUrl(`https://www.strava.com/oauth/authorize?${stravaParams}`);

        // Fitbit (placeholder)
        setFitbitUrl("#");

        // status Strava
        const { data: stravaRow } = await supabase
          .from("strava_tokens")
          .select("athlete_id")
          .eq("user_id", userId)
          .maybeSingle();

        setStatus({
          stravaConnected: !!stravaRow?.athlete_id,
          fitbitConnected: false,
        });

        // callback visual
        const provider = queryParams?.get("provider");
        const ok = queryParams?.get("status") === "success";
        if (ok && provider === "strava") {
          setStatus((s) => ({ ...s, stravaConnected: true }));
        }

        setLoading(false);
      } catch (e) {
        console.error(e);
        setErrorMsg("Erro ao preparar integrações.");
        setLoading(false);
      }
    };

    run();
  }, [queryParams]);

  const handleRevokeStrava = async () => {
    try {
      setErrorMsg(null);
      setInfoMsg(null);
      setRevokingStrava(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const jwt = sessionData.session?.access_token;

      if (!jwt) {
        setErrorMsg("Sessão inválida. Faça login novamente.");
        setRevokingStrava(false);
        return;
      }

      const res = await fetch("/api/strava/revoke", {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });

      if (!res.ok) {
        setErrorMsg("Erro ao revogar acesso do Strava.");
        setRevokingStrava(false);
        return;
      }

      setStatus((s) => ({ ...s, stravaConnected: false }));
      setInfoMsg("Acesso ao Strava revogado. Conecte novamente para escolher outra conta.");
      setRevokingStrava(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro inesperado ao revogar acesso.");
      setRevokingStrava(false);
    }
  };

  const disabledStrava = loading || !stravaUrl || status.stravaConnected;

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
        <h1 style={{ fontSize: 24, color: "#e5e7eb" }}>Integrações</h1>

        {errorMsg && <p style={{ color: "#fca5a5" }}>{errorMsg}</p>}
        {infoMsg && <p style={{ color: "#bbf7d0" }}>{infoMsg}</p>}

        {/* STRAVA */}
        <div style={{ marginTop: 20 }}>
          <h3 style={{ color: "#e5e7eb" }}>Strava</h3>

          <a
            href={stravaUrl ?? "#"}
            style={{
              display: "block",
              textAlign: "center",
              padding: "12px",
              borderRadius: 999,
              background: disabledStrava ? "#374151" : "#f97316",
              color: "#020617",
              fontWeight: 700,
              textDecoration: "none",
              pointerEvents: disabledStrava ? "none" : "auto",
            }}
          >
            {status.stravaConnected ? "Strava Conectado" : "Conectar com Strava"}
          </a>

          {status.stravaConnected && (
            <button
              onClick={handleRevokeStrava}
              disabled={revokingStrava}
              style={{
                marginTop: 10,
                width: "100%",
                padding: "10px",
                borderRadius: 999,
                border: "1px solid rgba(248,113,113,0.5)",
                background: "rgba(248,113,113,0.15)",
                color: "#fecaca",
                fontWeight: 700,
              }}
            >
              {revokingStrava ? "Revogando..." : "Revogar acesso (Strava)"}
            </button>
          )}
        </div>

        {/* FITBIT */}
        <div style={{ marginTop: 30 }}>
          <h3 style={{ color: "#e5e7eb" }}>Fitbit</h3>

          <button
            disabled
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 999,
              background: "#1f2937",
              color: "#9ca3af",
              fontWeight: 700,
            }}
          >
            Revogar acesso (Fitbit) — em breve
          </button>
        </div>

        <div style={{ marginTop: 24 }}>
          <Link href="/dashboard" style={{ color: "#9ca3af" }}>
            Voltar ao dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
