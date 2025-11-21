// components/DashboardCharts.tsx
"use client";

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
  label: string;        // ex: "12/11"
  distanceKm: number;   // km no dia
  movingTimeMin: number; // minutos no dia
};

type SportPoint = {
  sport: string;       // ex: "Run", "Ride"
  distanceKm: number;  // km na modalidade
};

export default function DashboardCharts({
  dailyData,
  sportData,
}: {
  dailyData: DailyPoint[];
  sportData: SportPoint[];
}) {
  const hasDaily = dailyData && dailyData.length > 0;
  const hasSport = sportData && sportData.length > 0;

  return (
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
          Evolução dos treinos (atleta)
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
              <LineChart data={dailyData}>
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
              Ainda não há dados suficientes para montar o gráfico. Faça alguns
              treinos e sincronize com o Strava.
            </p>
          )}
        </div>
      </div>

      {/* Gráfico 2 - Volume por modalidade */}
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
          Quanto você corre, pedala ou nada.
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
  );
}
