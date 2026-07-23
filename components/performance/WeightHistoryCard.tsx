"use client";

import React from "react";

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
  chartWidth,
  chartHeight,
  chartPaddingX,
  chartPaddingY,
  chartLine,
  chronologicalWeights,
  formatDate,
  styles,
}: WeightHistoryCardProps) {
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

      {chartPoints.length === 0 ? (
        <div style={styles.emptyChart}>
          Registre seu peso para visualizar a evolução.
        </div>
      ) : (
        <div style={styles.chartWrapper}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Gráfico de evolução do peso"
            style={styles.chart}
          >
            <defs>
              <linearGradient
                id="weight-area-gradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#fff1a8"
                  stopOpacity="0.24"
                />

                <stop
                  offset="100%"
                  stopColor="#fff1a8"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {[0.25, 0.5, 0.75].map(
              (position) => {
                const y = chartHeight * position;

                return (
                  <line
                    key={position}
                    x1={chartPaddingX}
                    x2={chartWidth - chartPaddingX}
                    y1={y}
                    y2={y}
                    stroke="rgba(255,255,255,0.07)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              }
            )}

            {chartPoints.length > 1 && (
              <>
                <polygon
                  points={`${chartPaddingX},${
                    chartHeight - chartPaddingY
                  } ${chartLine} ${
                    chartWidth - chartPaddingX
                  },${chartHeight - chartPaddingY}`}
                  fill="url(#weight-area-gradient)"
                />

                <polyline
                  points={chartLine}
                  fill="none"
                  stroke="#fff1a8"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            )}

            {chartPoints.map((point) => (
              <g key={point.id}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="#09090b"
                  stroke="#fff1a8"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                />

                <title>
                  {`${point.weight.toFixed(
                    1
                  )} kg — ${formatDate(point.date)}`}
                </title>
              </g>
            ))}
          </svg>

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
        </div>
      )}
    </section>
  );
}
