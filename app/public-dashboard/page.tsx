"use client";

import { useEffect, useState } from "react";

type Period = "all_time" | "last_30d" | "last_7d";

interface Stats {
  total_activities: number;
  total_distance_m: number;
  total_moving_time_s: number;
  avg_distance_m: number;
  by_sport_type: Record<
    string,
    { count: number; distance: number; moving_time: number }
  >;
}

interface SummaryResponse {
  athlete_id: number;
  has_activities: boolean;
  last_activity?: {
    name: string;
    start_date: string;
    distance_m: number;
    sport_type: string;
  } | null;
  all_time?: Stats;
  last_30d?: Stats;
  last_7d?: Stats;
  message?: string;
}

export default function PublicDashboardPage() {
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all_time");

  useEffect(() => {
    async function loadSummary() {
      setLoadingSummary(true);
      setError(null);
      try {
        const res = await fetch("/api/strava/public-summary");
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Erro ao carregar resumo.");
        }
        const json: SummaryResponse = await res.json();
        setSummary(json);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Erro ao carregar resumo.");
      } finally {
        setLoadingSummary(false);
      }
    }
    loadSummary();
  }, []);

  function formatKm(meters: number | undefined) {
    if (!meters || meters <= 0) return "0 km";
    return (meters / 1000).toFixed(1) + " km";
  }

  function formatTime(seconds: number | undefined) {
    if (!seconds || seconds <= 0) return "0h";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h === 0) return `${m} min`;
    return `${h}h ${m}min`;
  }

  function getActiveStats(): Stats | null {
    if (!summary) return null;
    if (period === "all_time") return summary.all_time ?? null;
    if (period === "last_30d") return summary.last_30d ?? null;
    if (period === "last_7d") return summary.last_7d ?? null;
    return null;
  }

  const activeStats = getActiveStats();

  if (loadingSummary) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
          color: "#e5e7eb",
        }}
      >
        Carregando dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
          color: "#e5e7eb",
          padding: "16px",
        }}
      >
        {error}
      </div>
    );
  }

  if (!summary) return null;

  if (!summary.has_activities) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
          color: "#e5e7eb",
          padding: "16px",
        }}
      >
        <div
          style={{
            maxWidth: "420px",
            width: "100%",
            background: "#020617",
            padding: "24px",
            borderRadius: "16px",
            border: "1px solid #1e293b",
          }}
        >
          <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>
            Nenhuma atividade
          </h1>
          <p style={{ color: "#94a3b8" }}>
            {summary.message ?? "Não há atividades cadastradas para este atleta."}
          </p>
        </div>
      </div>
    );
  }

  const lastActivity = summary.last_activity;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "24px",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 700 }}>
            SportPlatform – Public Dashboard
          </h1>
          <p style={{ color: "#94a3b8", marginTop: "4px" }}>
            Resumo das atividades do atleta {summary.athlete_id}.
          </p>
        </div>
      </header>

      {/* Botões de período */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "8px" }}>
        <PeriodButton
          label="All time"
          active={period === "all_time"}
          onClick={() => setPeriod("all_time")}
        />
        <PeriodButton
          label="Últimos 30 dias"
          active={period === "last_30d"}
          onClick={() => setPeriod("last_30d")}
        />
        <PeriodButton
          label="Últimos 7 dias"
          active={period === "last_7d"}
          onClick={() => setPeriod("last_7d")}
        />
      </div>

      {/* Cards principais */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <Card
          title="Atividades"
          value={activeStats?.total_activities ?? 0}
          subtitle={
            period === "all_time"
              ? "Total de atividades"
              : "Atividades no período selecionado"
          }
        />
        <Card
          title="Distância"
          value={formatKm(activeStats?.total_distance_m)}
          subtitle="Distância total"
        />
        <Card
          title="Tempo em movimento"
          value={formatTime(activeStats?.total_moving_time_s)}
          subtitle="Tempo total em treino"
        />
        <Card
          title="Distância média"
          value={formatKm(activeStats?.avg_distance_m)}
          subtitle="Por atividade"
        />
      </div>

      {/* Última atividade */}
      {lastActivity && (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #1e293b",
            background: "#020617",
          }}
        >
          <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
            Última atividade
          </h2>
          <p style={{ marginBottom: "4px" }}>
            <strong>{lastActivity.name}</strong>
          </p>
          <p style={{ marginBottom: "2px", color: "#94a3b8" }}>
            {lastActivity.sport_type} • {formatKm(lastActivity.distance_m)}
          </p>
          <p style={{ fontSize: "12px", color: "#64748b" }}>
            Início: {new Date(lastActivity.start_date).toLocaleString()}
          </p>
        </div>
      )}

      {/* Por tipo de esporte (all time) */}
      {summary.all_time && (
        <div
          style={{
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #1e293b",
            background: "#020617",
          }}
        >
          <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
            Distribuição por esporte (All time)
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            {Object.entries(summary.all_time.by_sport_type).map(
              ([sport, stats]) => (
                <div
                  key={sport}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #1e293b",
                    background: "#020617",
                  }}
                >
                  <p style={{ fontWeight: 600, marginBottom: "4px" }}>
                    {sport}
                  </p>
                  <p style={{ fontSize: "14px", color: "#cbd5e1" }}>
                    {stats.count} atividades
                  </p>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>
                    {formatKm(stats.distance)} • {formatTime(stats.moving_time)}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Card(props: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "12px",
        border: "1px solid #1e293b",
        background: "#020617",
      }}
    >
      <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "6px" }}>
        {props.title}
      </p>
      <p style={{ fontSize: "22px", fontWeight: 700 }}>{props.value}</p>
      {props.subtitle && (
        <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
          {props.subtitle}
        </p>
      )}
    </div>
  );
}

function PeriodButton(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={props.onClick}
      style={{
        padding: "6px 12px",
        borderRadius: "999px",
        border: props.active ? "1px solid #22c55e" : "1px solid #334155",
        background: props.active ? "#16a34a" : "transparent",
        color: props.active ? "#0f172a" : "#e5e7eb",
        fontSize: "13px",
        cursor: "pointer",
      }}
    >
      {props.label}
    </button>
  );
}
