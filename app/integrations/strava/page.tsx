"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function StravaIntegrationPage() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabaseBrowser.auth.getUser();
      if (error) {
        console.error(error);
        setError("Erro ao carregar usuário. Faça login novamente.");
        setLoadingUser(false);
        return;
      }
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUserId(data.user.id);
      setLoadingUser(false);
    }

    loadUser();
  }, [router]);

  function handleConnectStrava() {
    if (!userId) return;

    // client_id do app do Strava
    const clientId = 185745;

    const redirectUri = encodeURIComponent(
      "https://sportplatform.app/api/auth/callback/strava"
    );

    const scopes = encodeURIComponent("read,activity:read_all");

    const authorizeUrl =
      `https://www.strava.com/oauth/authorize` +
      `?client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${redirectUri}` +
      `&approval_prompt=auto` +
      `&scope=${scopes}` +
      `&state=${userId}`;

    window.location.href = authorizeUrl;
  }

  if (loadingUser) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#e5e7eb" }}>
        Carregando usuário...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#e5e7eb" }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f172a",
      color: "#e5e7eb",
      padding: "16px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "#020617",
        padding: "24px",
        borderRadius: "16px",
        border: "1px solid #1e293b",
        boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
      }}>
        <h1 style={{ fontSize: "24px", marginBottom: "8px", fontWeight: 700 }}>
          Conectar Strava
        </h1>
        <p style={{ marginBottom: "16px", color: "#94a3b8" }}>
          Conecte sua conta do Strava ao SportPlatform para visualizar seu histórico de atividades e dashboards personalizados.
        </p>

        <button
          onClick={handleConnectStrava}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "999px",
            border: "none",
            background: "#fc4c02", // cor do Strava
            color: "#020617",
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: "8px",
          }}
        >
          Conectar com Strava
        </button>

        <p style={{ fontSize: "12px", color: "#64748b" }}>
          Você será redirecionado para o Strava para autorizar o acesso. Em seguida voltará para o SportPlatform.
        </p>
      </div>
    </div>
  );
}
