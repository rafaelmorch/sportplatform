// components/DashboardCharts.tsx
"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";

type DailyPoint = {
  date: string; // ex: "2025-11-21"
  label: string; // ex: "21/11"
  distanceKm: number;
  movingTimeMin: number;
};

type SportPoint = {
  sport: string;
  distanceKm: number;
};

export default function DashboardCharts({
  dailyData,
  sportData,
}: {
  dailyData: DailyPoint[];
  sportData: SportPoint[];
}) {
  const [range, setRange] = useState<"today" | "7d" | "30d" | "6m">("30d");

  const now = new Date();

  const filteredDailyData: DailyPoint[] = (() => {
    if (!dailyData || dailyData.length === 0) return [];

    const todayStr = now.toISOString().slice(0, 10);

    if (range === "today") {
      return dailyData.filter((p) => p.date.slice(0, 10) === todayStr);
    }

    const diffDays = (dateStr: string) => {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return Number.POSITIVE_INFINITY;
      const diffMs = now.getTime() - d.getTime();
      return diffMs / (1000 * 60 * 60 * 24);
    };

    if (range === "7d") {
      return dailyData.filter((p) => diffDays(p.date) <= 7);
    }

    if (range === "30d") {
      return dailyData.filter((p) => diffDays(p.date) <= 30);
    }

    if (range === "6m") {
      // ~6 meses ≈ 180 dias
      return dailyData.filter((p) => diffDays(p.date) <= 180);
    }

    return dailyData;
  })();

  const hasDaily = filteredDailyData.length > 0;
  const hasSport = sportData && sportData.length > 0;

  const ranges: { key: "today" | "7d" | "30d" | "6m"; label: string }[] = [
    { key: "today", label: "Hoje" },
    { key: "7d", label: "7 dias" },
    { key: "30d", label: "30 dias" },
    { key: "6m", label: "6 meses" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Filtro de período */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 4,
        }}
      >
        {ranges.map((r) => {
          const active = range === r.key;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              style={{
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 999,
                border: active
                  ? "1px solid rgba(34,197,94,0.8)"
                  : "1px solid rgba(55,65,81,0.9)",
                background: active
                  ? "radial-gradient(circle at top, #22c55e33, transparent)"
                  : "transparent",
                color: active ? "#bbf7d0" : "#e5e7eb",
                cursor: "pointer",
                transition: "all 0.15s ease-out",
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.4fr)",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        {/* Gráfico 1 - Evolução diária do atleta */}
        <div
          style={{
            minHeight: 260,
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 2,
            }}
          >
            Evolução dos treinos (período selecionado)
          </h3>
          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              marginBottom: 8,
            }}
          >
            Distância e tempo de treino por dia.
          </p>
          <div style={{ width: "100%", height: 220 }}>
            {hasDaily ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredDailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="distanceKm"
                    name="Distância (km)"
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="movingTimeMin"
                    name="Tempo (min)"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginTop: 16,
                }}
              >
                Ainda não há dados suficientes para esse período. Faça alguns
                treinos e sincronize com o Strava.
              </p>
            )}
          </div>
        </div>

        {/* Gráfico 2 - Volume por modalidade (total) */}
        <div
          style={{
            minHeight: 260,
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 2,
            }}
          >
            Volume por modalidade
          </h3>
          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              marginBottom: 8,
            }}
          >
            Quanto você corre, pedala ou nada (acumulado).
          </p>
          <div style={{ width: "100%", height: 220 }}>
            {hasSport ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sportData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sport" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="distanceKm" name="Distância (km)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginTop: 16,
                }}
              >
                Ainda não há distribuição por modalidade para exibir.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
