/**
 * PLATFORM SPORTS
 * Arquivo: app/integrations/page.tsx
 * Última alteração: 2026-08-21 16:49 ET
 *
 * Função:
 * Gerenciar integrações de atividades e saúde da Platform Sports.
 *
 * Arquitetura:
 * Providers específicos ficam em lib/integrations.
 * A página deve concentrar apenas interface, status e ações.
 *
 * Alteração 2026-08-21 16:34 ET:
 * - Preparação para Health Connect.
 * - Estrutura preparada para novos providers.
 *
 * Backup anterior:
 * app/integrations/page-BACKUP-2026-08-21-1634.tsx
 */

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BackButton from "@/components/BackButton";
import { createClient } from "@supabase/supabase-js";
import {
  authorizeHealthConnect,
  checkHealthConnectAvailability,
  isAndroidNative,
  syncHealthConnect,
} from "@/lib/integrations/health-connect";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sportsplatform.app";
const stravaClientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID!;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type ConnectionStatus = {
  stravaConnected: boolean;
  garminConnected: boolean;
  healthConnectAvailable: boolean;
  healthConnectConnected: boolean;
};

export default function IntegrationsPage() {
  const [stravaUrl, setStravaUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [revokingStrava, setRevokingStrava] = useState(false);
  const [connectingGarmin, setConnectingGarmin] = useState(false);
  const [revokingGarmin, setRevokingGarmin] = useState(false);
  const [authorizingHealthConnect, setAuthorizingHealthConnect] = useState(false);
  const [syncingHealthConnect, setSyncingHealthConnect] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [status, setStatus] = useState<ConnectionStatus>({
    stravaConnected: false,
    garminConnected: false,
    healthConnectAvailable: false,
    healthConnectConnected: false,
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

    const {
      data: sessionData,
      error: sessionErr,
    } = await supabase.auth.getSession();

    let garminConnected = false;

    if (!sessionErr && sessionData.session?.access_token) {
      try {
        const garminResp = await fetch("/api/garmin/status", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        });

        if (garminResp.ok) {
          const garminJson = await garminResp.json();
          garminConnected = !!garminJson?.connected;
        }
      } catch (error) {
        console.error("Erro ao verificar conexão Garmin:", error);
      }
    }

    let healthConnectAvailable = false;

    if (isAndroidNative()) {
      try {
        const healthAvailability =
          await checkHealthConnectAvailability();

        healthConnectAvailable =
          !!healthAvailability?.available;
      } catch (error) {
        console.error(
          "Erro ao verificar Health Connect:",
          error
        );
      }
    }

    const { data: activitySource, error: activitySourceError } =
      await supabase
        .from("user_activity_source")
        .select("provider")
        .eq("user_id", userId)
        .maybeSingle();

    if (activitySourceError) {
      console.error(
        "Erro ao verificar fonte ativa:",
        activitySourceError
      );
    }

    setStatus({
      stravaConnected: !!stravaRow?.athlete_id,
      garminConnected,
      healthConnectAvailable,
      healthConnectConnected:
        activitySource?.provider === "health_connect",
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

  const handleConnectGarmin = async () => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setConnectingGarmin(true);

      const {
        data: sessionData,
        error: sessionErr,
      } = await supabase.auth.getSession();

      if (sessionErr || !sessionData.session?.access_token) {
        setErrorMsg("Você precisa estar logado para conectar Garmin.");
        setConnectingGarmin(false);
        return;
      }

      const resp = await fetch("/api/garmin/login", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      const json = await resp.json().catch(() => null);

      if (!resp.ok || !json?.authorizationUrl) {
        console.error("Garmin login failed:", resp.status, json);
        setErrorMsg("Não foi possível iniciar a conexão Garmin.");
        setConnectingGarmin(false);
        return;
      }

      window.location.href = json.authorizationUrl;
    } catch (error) {
      console.error("Erro ao iniciar Garmin:", error);
      setErrorMsg("Erro inesperado ao conectar Garmin.");
      setConnectingGarmin(false);
    }
  };
  const handleRevokeGarmin = async () => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setRevokingGarmin(true);

      const {
        data: sessionData,
        error: sessionErr,
      } = await supabase.auth.getSession();

      const session = sessionData.session;
      const userId = session?.user?.id ?? null;
      const accessToken = session?.access_token ?? null;

      if (sessionErr || !userId || !accessToken) {
        setErrorMsg(
          "Você precisa estar logado para desconectar Garmin."
        );
        return;
      }

      const resp = await fetch("/api/garmin/revoke", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const json = await resp.json().catch(() => null);

      if (!resp.ok) {
        console.error(
          "Garmin revoke failed:",
          resp.status,
          json
        );

        setErrorMsg(
          json?.error ||
            "Não foi possível desconectar Garmin. Tente novamente."
        );
        return;
      }

      setStatus((current) => ({
        ...current,
        garminConnected: false,
      }));

      setSuccessMsg(
        "Garmin desconectado com sucesso. Seus dados Garmin serão removidos da Platform Sports."
      );

      window.history.replaceState(
        null,
        "",
        "/integrations"
      );
    } catch (error) {
      console.error(
        "Erro inesperado ao desconectar Garmin:",
        error
      );

      setErrorMsg(
        "Erro inesperado ao desconectar Garmin."
      );
    } finally {
      setRevokingGarmin(false);
    }
  };
  const handleAuthorizeHealthConnect = async () => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setAuthorizingHealthConnect(true);

      const authorizationStatus =
        await authorizeHealthConnect();

      const hasAnyPermission =
        authorizationStatus.readAuthorized?.length > 0;

      if (!hasAnyPermission) {
        setErrorMsg(
          "Nenhuma permissão do Health Connect foi autorizada."
        );
        return;
      }

      const {
        data: sessionData,
        error: sessionErr,
      } = await supabase.auth.getSession();

      const accessToken =
        sessionData.session?.access_token;

      if (sessionErr || !accessToken) {
        setErrorMsg(
          "Você precisa estar logado para conectar Health Connect."
        );
        return;
      }

      const connectionResponse = await fetch(
        "/api/health-connect/connection",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const connectionData =
        await connectionResponse.json().catch(() => null);

      if (!connectionResponse.ok) {
        setErrorMsg(
          connectionData?.error ??
            "Não foi possível conectar Health Connect."
        );
        return;
      }

      setStatus((current) => ({
        ...current,
        healthConnectConnected: true,
      }));

      setSuccessMsg(
        "Health Connect conectado com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao autorizar Health Connect:",
        error
      );

      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Erro ao autorizar Health Connect."
      );
    } finally {
      setAuthorizingHealthConnect(false);
    }
  };

  const handleDisconnectHealthConnect = async () => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);

      const {
        data: sessionData,
        error: sessionErr,
      } = await supabase.auth.getSession();

      const accessToken =
        sessionData.session?.access_token;

      if (sessionErr || !accessToken) {
        setErrorMsg(
          "Você precisa estar logado para desconectar Health Connect."
        );
        return;
      }

      const response = await fetch(
        "/api/health-connect/connection",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const responseData =
        await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMsg(
          responseData?.error ??
            "Não foi possível desconectar Health Connect."
        );
        return;
      }

      setStatus((current) => ({
        ...current,
        healthConnectConnected: false,
      }));

      setSuccessMsg(
        "Health Connect desconectado com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao desconectar Health Connect:",
        error
      );

      setErrorMsg(
        "Erro inesperado ao desconectar Health Connect."
      );
    }
  };

  const handleSyncHealthConnect = async () => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setSyncingHealthConnect(true);

      const {
        data: sessionData,
        error: sessionErr,
      } = await supabase.auth.getSession();

      const accessToken =
        sessionData.session?.access_token;

      if (sessionErr || !accessToken) {
        setErrorMsg(
          "Você precisa estar logado para sincronizar Health Connect."
        );
        return;
      }

      const result =
        await syncHealthConnect(accessToken);

      setSuccessMsg(
        `Health Connect sincronizado. ${result.workoutsReadFromHealthConnect ?? 0} atividades encontradas.`
      );
    } catch (error) {
      console.error(
        "Erro ao sincronizar Health Connect:",
        error
      );

      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Erro ao sincronizar Health Connect."
      );
    } finally {
      setSyncingHealthConnect(false);
    }
  };

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
      <div style={{ position: "absolute", top: 20, left: 20 }}><BackButton fallbackHref="/inside" /></div>

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
          Conecte seus apps de treino ao Platform Sports para centralizar atividades, métricas de saúde e desempenho em um só lugar.
        </p>

        {errorMsg && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 15, color: "#fca5a5", margin: 0 }}>{errorMsg}</p>
            <div style={{ marginTop: 10 }}>
              <Link
                href="/login"
                style={{
                  display: status.stravaConnected ? "none" : "inline-flex",
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
              display: status.garminConnected || status.healthConnectConnected ? "none" : "block",
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
                display: status.stravaConnected ? "none" : "inline-flex",
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
                {revokingStrava ? "Desconectando..." : "Desconectar"}
              </button>
            )}
          </div>
        </div>

        {/* Garmin */}
        <div
          style={{
            display: status.stravaConnected || status.healthConnectConnected ? "none" : "block",
            marginTop: 16,
            borderRadius: 18,
            padding: "14px 16px",
            border: "1px solid rgba(148,163,184,0.4)",
            background: "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                Garmin Connect
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: "#475569",
                  marginTop: 6,
                }}
              >
                Sincroniza atividades e dados de saúde da sua conta Garmin.
              </div>
            </div>

            {status.garminConnected && (
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

          <button
            type="button"
            onClick={handleConnectGarmin}
            disabled={
              loading ||
              connectingGarmin ||
              status.garminConnected
            }
            style={{
              display: status.garminConnected ? "none" : "inline-flex",
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              height: 44,
              borderRadius: "10px",
              marginTop: 10,
              background: "#111827",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "18px",
              border: "1px solid #111827",
              cursor:
                loading ||
                connectingGarmin ||
                status.garminConnected
                  ? "default"
                  : "pointer",
              opacity:
                loading ||
                connectingGarmin ||
                status.garminConnected
                  ? 0.7
                  : 1,
            }}
          >
            {connectingGarmin
              ? "Conectando..."
              : status.garminConnected
                ? "Garmin Conectado"
                : "Conectar com Garmin"}
          </button>

          {status.garminConnected && (
            <button
              type="button"
              onClick={handleRevokeGarmin}
              disabled={revokingGarmin}
              style={{
                marginTop: 10,
                width: "100%",
                height: 40,
                borderRadius: "10px",
                border: "2px solid #111827",
                background: "#ffffff",
                color: "#111827",
                fontWeight: 700,
                fontSize: 15,
                cursor: revokingGarmin
                  ? "not-allowed"
                  : "pointer",
                opacity: revokingGarmin ? 0.7 : 1,
              }}
            >
              {revokingGarmin
                ? "Desconectando..."
                : "Desconectar"}
            </button>
          )}
        </div>
        {/* Health Connect - Android */}
        {(isAndroidNative() || status.healthConnectConnected) && (
          <div
            style={{
              marginTop: 16,
              borderRadius: 18,
              padding: "14px 16px",
              border: "1px solid rgba(148,163,184,0.4)",
              background: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  Health Connect
                </div>

                <div
                  style={{
                    fontSize: 14,
                    color: "#475569",
                    marginTop: 6,
                  }}
                >
                  Centraliza atividades e métricas de saúde dos apps conectados ao Android.
                </div>
              </div>

              {status.healthConnectConnected && (
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

            {!status.healthConnectConnected && (
              <button
                type="button"
                onClick={handleAuthorizeHealthConnect}
                disabled={
                  !status.healthConnectAvailable ||
                  authorizingHealthConnect
                }
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: "10px",
                  marginTop: 10,
                  background: "#111827",
                  color: "#ffffff",
                  border: "1px solid #111827",
                  fontWeight: 700,
                  fontSize: 18,
                  cursor:
                    !status.healthConnectAvailable ||
                    authorizingHealthConnect
                      ? "default"
                      : "pointer",
                  opacity:
                    !status.healthConnectAvailable ||
                    authorizingHealthConnect
                      ? 0.7
                      : 1,
                }}
              >
                {authorizingHealthConnect
                  ? "Conectando..."
                  : "Conectar"}
              </button>
            )}

            {status.healthConnectConnected && (
              <button
                type="button"
                onClick={handleDisconnectHealthConnect}
                style={{
                  width: "100%",
                  height: 40,
                  borderRadius: "10px",
                  marginTop: 10,
                  background: "#ffffff",
                  color: "#111827",
                  border: "2px solid #111827",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                Desconectar
              </button>
            )}
          </div>
        )}
        <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
          <Link
            href="/groups"
            style={{
              fontSize: "13px",
              color: "#475569",
              textDecoration: "underline",
              textUnderlineOffset: 4,
            }}
          >
            Ir para meus grupos
          </Link>
        </div>
      </section>
    </main>
  );
}

