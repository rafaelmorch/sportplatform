"use client";

import React from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type ChartPoint = {
  id: React.Key;
  x: number;
  y: number;
  weight: number;
  date?: string | null;
};

type WeightLogDate = {
  created_at?: string | null;
};

type WeightHistoryStyles = {
  panel: React.CSSProperties;
  header: React.CSSProperties;
  eyebrow: React.CSSProperties;
  title: React.CSSProperties;
  description: React.CSSProperties;
  variationBadge: React.CSSProperties;
  emptyChart: React.CSSProperties;
  chartWrapper: React.CSSProperties;
  chart: React.CSSProperties;
  chartDates: React.CSSProperties;
};

type WeightHistoryCardProps = {
  weightCount: number;
  weightVariation: number | null;
  variationColor: string;
  chartPoints: ChartPoint[];
  chartWidth: number;
  chartHeight: number;
  chartPaddingX: number;
  chartPaddingY: number;
  chartLine: string;
  chronologicalWeights: WeightLogDate[];
  formatDate: (
    value?: string | null
  ) => string;
  styles: WeightHistoryStyles;
};

export default function WeightHistoryCard({
  weightCount,
  weightVariation,
  variationColor,
  chartPoints,
  chronologicalWeights,
  formatDate,
  styles,
}: WeightHistoryCardProps) {
  const data = chartPoints.map((point) => ({
    weight: point.weight,
    date: point.date,
    label: formatDate(point.date),
  }));

  const weights = data
    .map((item) => item.weight)
    .filter((value) => Number.isFinite(value));

  const minWeight =
    weights.length > 0
      ? Math.floor(Math.min(...weights) - 1)
      : 0;

  const maxWeight =
    weights.length > 0
      ? Math.ceil(Math.max(...weights) + 1)
      : 100;

  return (
    <section style={styles.panel}>
      <div style={styles.header}>
        <div style={{ minWidth: 0 }}>
          <div style={styles.eyebrow}>
            Histórico
          </div>

          <h2 style={styles.title}>
            Evolução do peso
          </h2>

          <p style={styles.description}>
            {weightCount}{" "}
            {weightCount === 1
              ? "registro encontrado"
              : "registros encontrados"}
          </p>
        </div>

        {weightVariation !== null && (
          <div
            style={{
              ...styles.variationBadge,
              color: variationColor,
              borderColor: `${variationColor}55`,
            }}
          >
            {weightVariation > 0 ? "+" : ""}
            {weightVariation.toFixed(1)} kg no período
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div style={styles.emptyChart}>
          Registre seu peso para visualizar a evolução.
        </div>
      ) : (
        <div
          style={{
            ...styles.chartWrapper,
            height: 280,
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={data}
              margin={{
                top: 24,
                right: 12,
                left: -12,
                bottom: 8,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.08)"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                stroke="#73737c"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                domain={[minWeight, maxWeight]}
                stroke="#73737c"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={42}
                tickFormatter={(value) =>
                  `${Number(value).toFixed(0)}`
                }
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#101010",
                  border:
                    "1px solid rgba(212,175,55,0.28)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                labelStyle={{
                  color: "#a1a1aa",
                  marginBottom: 5,
                }}
                itemStyle={{
                  color: "#ffffff",
                }}
                formatter={(value) => [
                  `${Number(value).toFixed(1)} kg`,
                  "Peso",
                ]}
              />

              <Line
                type="monotone"
                dataKey="weight"
                name="Peso"
                stroke="#D4AF37"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "#050505",
                  stroke: "#D4AF37",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "#D4AF37",
                  stroke: "#050505",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {chronologicalWeights.length > 0 && (
        <div style={styles.chartDates}>
          <span>
            {formatDate(
              chronologicalWeights[0]?.created_at
            )}
          </span>

          <span style={{ textAlign: "right" }}>
            {formatDate(
              chronologicalWeights[
                chronologicalWeights.length - 1
              ]?.created_at
            )}
          </span>
        </div>
      )}
    </section>
  );
}
