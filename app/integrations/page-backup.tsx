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
};

export default function IntegrationsPage() {
  const [stravaUrl, setStravaUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [revokingStrava, setRevokingStrava] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [status, setStatus] = useState<ConnectionStatus>({
    stravaConnected: false,
  });

  const queryParams = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search);
  }, []);

  async function refreshStatus(userId: string) {
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
      stravaConnected: !!stravaRow?.athlete_id,
    });
  }

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        // 1) Sessão do usuário (site)
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();

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
          setLoading(false);
          return;
        }

        // 2) Monta URL de OAuth (Strava)
        const stravaRedirect = `${siteUrl}/api/strava/callback`;
        const stravaParams = new URLSearchParams({
          client_id: stravaClientId,
          response_type: "code",
          redirect_uri: stravaRedirect,
          approval_prompt: "auto",
          scope: "read,activity:read_all",
          state: userId,
        });
        setStravaUrl(`https://www.strava.com/oauth/authorize?${stravaParams.toString()}`);

        // 3) Verifica tokens salvos (fonte da verdade)
        await refreshStatus(userId);

        // 4) Se veio do callback com status=success, só mostra mensagem,
        // e remove querystring pra não "prender" o estado.
        const provider = queryParams?.get("provider");
        const ok = queryParams?.get("status") === "success";
        if (ok && provider) {
          setSuccessMsg(`${provider.toUpperCase()} conectado com sucesso! ✅`);
          window.history.replaceState(null, "", "/integrations");
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

  const handleRevokeStrava = async () => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setRevokingStrava(true);

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        console.error("Erro ao carregar sessão:", sessionErr);
        setErrorMsg("Erro ao carregar usuário. Faça login novamente.");
        setRevokingStrava(false);
        return;
      }

      const session = sessionData.session;
      const userId = session?.user?.id ?? null;
      const accessToken = session?.access_token ?? null;

      if (!userId || !accessToken) {
        setErrorMsg("Você precisa estar logado para revogar acesso.");
        setRevokingStrava(false);
        return;
      }

      const resp = await fetch("/api/strava/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        console.error("Revoke falhou:", resp.status, txt);
        setErrorMsg("Não foi possível revogar o Strava. Tente novamente.");
        setRevokingStrava(false);
        return;
      }

      // Atualiza status real pelo banco
      await refreshStatus(userId);

      setSuccessMsg("Acesso ao Strava revogado com sucesso.");
      window.history.replaceState(null, "", "/integrations");
    } catch (e) {
      console.error("Erro inesperado ao revogar Strava:", e);
      setErrorMsg("Erro inesperado ao revogar o Strava.");
    } finally {
      setRevokingStrava(false);
    }
  };

  const disabledStrava = loading || !stravaUrl || status.stravaConnected;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px", fontFamily: "Montserrat, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "900px",
          borderRadius: "12px",
          padding: "32px 28px",
          background: "#ffffff",
          border: "1px solid rgba(148, 163, 184, 0.35)",
          boxShadow: "0 18px 45px rgba(15, 23, 42, 0.8), 0 0 0 1px rgba(15, 23, 42, 0.9)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "20px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "10px",
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
                color: "#475569",
                margin: 0,
              }}
            >
              Integrações
            </p>
            <h1 style={{ fontSize: "24px", margin: 0, color: "#0f172a" }}>
              Conectar Apps de Treino
            </h1>
          </div>
        </div>

        <p style={{ fontSize: "21px", lineHeight: 1.6, color: "#475569", marginBottom: "18px" }}>
          Conecte sua conta do Strava ao Sports Platform para centralizar histórico de atividades,
          métricas e desafios em um só lugar.
        </p>

        {errorMsg && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 15, color: "#fca5a5", margin: 0 }}>{errorMsg}</p>
            <div style={{ marginTop: 10 }}>
              <Link
                href="/login"
                style={{
                  display: "inline-flex",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(148,163,184,0.12)",
                  border: "1px solid rgba(148,163,184,0.35)",
                  color: "#0f172a",
                  textDecoration: "none",
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                Ir para Login
              </Link>
            </div>
          </div>
        )}

        {successMsg && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 15, color: "#166534", margin: 0 }}>{successMsg}</p>
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
              background: "#ffffff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Strava</div>
                <div style={{ fontSize: 14, color: "#475569", marginTop: 6 }}>
                  Importa suas corridas, pedaladas e outras atividades.
                </div>
              </div>

              {status.stravaConnected && (
                <div
                  style={{
                    alignSelf: "center",
                    fontSize: 12,
                    color: "#166534",
                    border: "1px solid #22c55e",
                    background: "#dcfce7",
                    padding: "6px 10px",
                    borderRadius: "10px",
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
                borderRadius: "10px",
                marginTop: 10,
                background: disabledStrava
                  ? "#fc4c02"
                  : "#fc4c02",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "21px",
                border: "1px solid rgba(248, 250, 252, 0.08)",
                textDecoration: "none",
                pointerEvents: disabledStrava ? "none" : "auto",
              }}
            >
              {loading ? "Preparando..." : status.stravaConnected ? "Strava Conectado" : "Conectar com Strava"}
            </a>

            {/* ✅ Revoke (só aparece se conectado) */}
            {status.stravaConnected && (
              <button
                type="button"
                onClick={handleRevokeStrava}
                disabled={revokingStrava}
                style={{
                  marginTop: 10,
                  width: "100%",
                  height: 40,
                  borderRadius: "10px",
                  border: "2px solid #fc4c02",
                  background: "#ffffff",
                  color: "#fc4c02",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: revokingStrava ? "not-allowed" : "pointer",
                  opacity: revokingStrava ? 0.7 : 1,
                }}
              >
                {revokingStrava ? "Revogando..." : "Revogar acesso (Strava)"}
              </button>
            )}
          </div>
        </div>

        <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
          <Link
            href="/dashboard"
            style={{
              fontSize: "13px",
              color: "#475569",
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



















