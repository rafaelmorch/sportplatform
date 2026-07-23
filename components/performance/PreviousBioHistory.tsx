"use client";

import React from "react";

type BioLog = {
  id: React.Key;
  assessment_date?: string | null;
  created_at?: string | null;
  weight_kg?: number | null;
  body_fat_percent?: number | null;
  muscle_mass_kg?: number | null;
  body_water_percent?: number | null;
};

type PreviousBioHistoryStyles = {
  panel: React.CSSProperties;
  eyebrow: React.CSSProperties;
  title: React.CSSProperties;
  grid: React.CSSProperties;
  card: React.CSSProperties;
  date: React.CSSProperties;
  values: React.CSSProperties;
  metric: React.CSSProperties;
  metricLabel: React.CSSProperties;
  metricValue: React.CSSProperties;
};

type PreviousBioHistoryProps = {
  logs: BioLog[];
  formatDate: (
    value?: string | null
  ) => string;
  formatValue: (
    value: number | null | undefined,
    suffix?: string,
    decimals?: number
  ) => string;
  styles: PreviousBioHistoryStyles;
};

export default function PreviousBioHistory({
  logs,
  formatDate,
  formatValue,
  styles,
}: PreviousBioHistoryProps) {
  if (logs.length <= 1) {
    return null;
  }

  return (
    <section style={styles.panel}>
      <div style={styles.eyebrow}>
        Histórico
      </div>

      <h2 style={styles.title}>
        Avaliações anteriores
      </h2>

      <div style={styles.grid}>
        {logs.slice(1).map((item) => (
          <article
            key={item.id}
            style={styles.card}
          >
            <div style={styles.date}>
              {formatDate(
                item.assessment_date ||
                  item.created_at
              )}
            </div>

            <div style={styles.values}>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>
                  Peso
                </span>

                <strong style={styles.metricValue}>
                  {formatValue(
                    item.weight_kg,
                    " kg"
                  )}
                </strong>
              </div>

              <div style={styles.metric}>
                <span style={styles.metricLabel}>
                  Gordura
                </span>

                <strong style={styles.metricValue}>
                  {formatValue(
                    item.body_fat_percent,
                    "%"
                  )}
                </strong>
              </div>

              <div style={styles.metric}>
                <span style={styles.metricLabel}>
                  Músculo
                </span>

                <strong style={styles.metricValue}>
                  {formatValue(
                    item.muscle_mass_kg,
                    " kg"
                  )}
                </strong>
              </div>

              <div style={styles.metric}>
                <span style={styles.metricLabel}>
                  Água
                </span>

                <strong style={styles.metricValue}>
                  {formatValue(
                    item.body_water_percent,
                    "%"
                  )}
                </strong>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
