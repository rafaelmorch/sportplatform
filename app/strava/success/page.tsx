// app/strava/success/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ImportState = "idle" | "running" | "success" | "error";

type PageProps = {
  searchParams?: {
    athlete_id?: string;
  };
};

export default function StravaSuccessPage({ searchParams }: PageProps) {
  const [state, setState] = useState<ImportState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const athleteId = searchParams?.athlete_id;

  useEffect(() => {
    const runImport = async () => {
      try {
        setState("running");
        setMessage("Sincronizando suas atividades com o SportPlatform...");

        const res = await fetch("/api/strava/import");

        if (!res.ok) {
          const text = await res.text();
          setState("error");
          setMessage(
            "Ocorreu um erro ao importar suas atividades. Tente novamente mais tarde."
          );
          console.error("Erro ao importar atividades:", text);
          return;
        }

        const data = await res.json();
        console.log("Import result:", data);

        setState("success");
        setMessage("Importação concluída com sucesso! 🎯");
      } catch (err) {
        console.error("Erro inesperado ao importar atividades:", err);
        setState("error");
        setMessage(
          "Ocorreu um erro inesperado ao importar suas atividades. Tente novamente."
        );
      }
    };

    // dispara a importação automaticamente ao entrar na página
    runImport();
  }, []);

  const subtitle =
    state === "running"
      ? "Buscando seu histórico de treinos no Strava. Isso pode levar alguns segundos."
      : state === "success"
      ? "Agora você já pode visualizar suas métricas no dashboard."
      : state === "error"
      ? "Você pode tentar novamente mais tarde ou entrar em contato com o suporte."
      : "Conectando com o Strava e preparando seus dados.";

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
          maxWidth: "560px",
          borderRadius: "24px",
          padding: "32px 28px",
          background:
            "radial-gradient(circle at top, #020617, #020617 40%, #000000 100%)",
          border: "1px solid rgba(148, 163, 184, 0.35)",
          boxShadow:
            "0 18px 45px rgba(15, 23, 42, 0.8), 0 0 0 1px rgba(15, 23, 42, 0.9)",
          color: "#e5e7eb",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#64748b",
            marginBottom: "4px",
          }}
        >
          Integração concluída
        </p>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "8px",
          }}
        >
          {state === "success"
            ? "Strava conectado com sucesso"
            : state === "error"
            ? "Houve um problema na importação"
            : "Conectando e importando atividades"}
        </h1>

        <p
          style={{
            fontSize: "14px",
            lineHeight: 1.6,
            color: "#cbd5f5",
            marginBottom: "20px",
          }}
        >
          {subtitle}
        </p>

        {athleteId && (
          <p
            style={{
              fontSize: "12px",
              color: "#9ca3af",
              marginBottom: "16px",
            }}
          >
            Atleta Strava ID:{" "}
            <span style={{ color: "#e5e7eb", fontWeight: 500 }}>
              {athleteId}
            </span>
          </p>
        )}

        <div
          style={{
            marginBottom: "24px",
            padding: "14px 16px",
            borderRadius: "16px",
            border: "1px solid rgba(148, 163, 184, 0.4)",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.7))",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              marginBottom: "4px",
              color:
                state === "error"
                  ? "#fca5a5"
                  : state === "success"
                  ? "#bbf7d0"
                  : "#e5e7eb",
            }}
          >
            {message ??
              "Preparando tudo para exibir suas métricas de performance."}
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "#9ca3af",
              margin: 0,
            }}
          >
            Você poderá acompanhar distância total, tempo em movimento, ritmo
            médio, elevação acumulada e muito mais em um único lugar.
          </p>
        </div>

        {/* Botões de navegação */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              height: 46,
              borderRadius: "999px",
              background:
                state === "error"
                  ? "linear-gradient(135deg, #f97316, #ea580c)"
                  : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#0b1120",
              fontWeight: 600,
              fontSize: "15px",
              textDecoration: "none",
              border: "1px solid rgba(248, 250, 252, 0.08)",
            }}
          >
            Ir para o dashboard
          </Link>

          <Link
            href="/public-dashboard"
            style={{
              display: "inline-flex",
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              height: 44,
              borderRadius: "999px",
              background: "transparent",
              color: "#9ca3af",
              fontWeight: 500,
              fontSize: "13px",
              textDecoration: "none",
              border: "1px solid rgba(148, 163, 184, 0.45)",
            }}
          >
            Ver visão geral pública das métricas
          </Link>
        </div>
      </section>
    </main>
  );
}
