"use client";

import React from "react";

type LatestBio = {
  assessment_date?: string | null;
  created_at?: string | null;
  notes?: string | null;
};

type BioMetric = {
  label: string;
  value: React.ReactNode;
};

type LatestBioCardStyles = {
  panel: React.CSSProperties;
  header: React.CSSProperties;
  eyebrow: React.CSSProperties;
  title: React.CSSProperties;
  description: React.CSSProperties;
  currentBadge: React.CSSProperties;
  emptyText: React.CSSProperties;
  metricsGrid: React.CSSProperties;
  metricCard: React.CSSProperties;
  metricLabel: React.CSSProperties;
  metricValue: React.CSSProperties;
  notes: React.CSSProperties;
};

type LatestBioCardProps = {
  latestBio: LatestBio | null;
  metrics: BioMetric[];
  formatDate: (
    value?: string | null
  ) => string;
  styles: LatestBioCardStyles;
};

export default function LatestBioCard({
  latestBio,
  metrics,
  formatDate,
  styles,
}: LatestBioCardProps) {
  return (
    <article style={styles.panel}>
      <div style={styles.header}>
        <div style={{ minWidth: 0 }}>
          <div style={styles.eyebrow}>
            Composição corporal
          </div>

          <h2 style={styles.title}>
            Última bioimpedância
          </h2>

          <p style={styles.description}>
            {latestBio
              ? formatDate(
                  latestBio.assessment_date ||
                    latestBio.created_at
                )
              : "Nenhuma avaliação registrada"}
          </p>
        </div>

        {latestBio && (
          <div style={styles.currentBadge}>
            Atual
          </div>
        )}
      </div>

      {metrics.length === 0 ? (
        <p style={styles.emptyText}>
          Nenhuma avaliação corporal registrada.
        </p>
      ) : (
        <div style={styles.metricsGrid}>
          {metrics.map((metric) => (
            <div
              key={metric.label}
              style={styles.metricCard}
            >
              <div style={styles.metricLabel}>
                {metric.label}
              </div>

              <div style={styles.metricValue}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {latestBio?.notes && (
        <div style={styles.notes}>
          {latestBio.notes}
        </div>
      )}
    </article>
  );
}
