"use client";

import React from "react";
import MetricGrid from "./MetricGrid";

export type AiReviewPanelStyles = {
  panel: React.CSSProperties;
  eyebrow: React.CSSProperties;
  header: React.CSSProperties;
  title: React.CSSProperties;
  description: React.CSSProperties;
  status: React.CSSProperties;
  metrics: React.CSSProperties;
  metric: React.CSSProperties;
  metricLabel: React.CSSProperties;
  metricValue: React.CSSProperties;
  textSection: React.CSSProperties;
  sectionLabel: React.CSSProperties;
  bodyText: React.CSSProperties;
  list: React.CSSProperties;
  listItem: React.CSSProperties;
  bullet: React.CSSProperties;
  attentionSection: React.CSSProperties;
  attentionLabel: React.CSSProperties;
  attentionBullet: React.CSSProperties;
  disclaimer: React.CSSProperties;
  confirmButton: React.CSSProperties;
};

type Props = {
  visible: boolean;
  assessmentDate: string;
  weightKg: string;
  bodyFat: string;
  muscleMass: string;
  waterPercent: string;
  visceralFat: string;
  bmr: string;
  summary: string;
  performanceInsights: string[];
  nutritionInsights: string[];
  attentionPoints: string[];
  disclaimer: string;
  saving: boolean;
  formatDate: (value: string) => string;
  onConfirm: () => void;
  styles: AiReviewPanelStyles;
};

export default function AiReviewPanel({
  visible,
  assessmentDate,
  weightKg,
  bodyFat,
  muscleMass,
  waterPercent,
  visceralFat,
  bmr,
  summary,
  performanceInsights,
  nutritionInsights,
  attentionPoints,
  disclaimer,
  saving,
  formatDate,
  onConfirm,
  styles,
}: Props) {
  if (!visible) {
    return null;
  }


  return (
    <section style={styles.panel}>
      <div style={styles.eyebrow}>
        Resultado da IA
      </div>

      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>
            Confira os dados encontrados
          </h3>

          <p style={styles.description}>
            Revise os valores abaixo. Você pode
            corrigir qualquer campo manualmente antes
            de confirmar.
          </p>
        </div>

        <div style={styles.status}>
          Análise concluída
        </div>
      </div>

      <MetricGrid
        metrics={[
          {
            label: "Data",
            value: assessmentDate
              ? formatDate(assessmentDate)
              : "Não encontrada",
          },
          {
            label: "Peso",
            value: weightKg
              ? `${weightKg} kg`
              : "Não encontrado",
          },
          {
            label: "Gordura corporal",
            value: bodyFat
              ? `${bodyFat}%`
              : "Não encontrada",
          },
          {
            label: "Massa muscular",
            value: muscleMass
              ? `${muscleMass} kg`
              : "Não encontrada",
          },
          {
            label: "Água corporal",
            value: waterPercent
              ? `${waterPercent}%`
              : "Não encontrada",
          },
          {
            label: "Gordura visceral",
            value: visceralFat || "Não encontrada",
          },
          {
            label: "Metabolismo basal",
            value: bmr
              ? `${bmr} kcal`
              : "Não encontrado",
          },
        ]}
        styles={styles}
      />

      {summary && (
        <div style={styles.textSection}>
          <div style={styles.sectionLabel}>
            Resumo
          </div>

          <p style={styles.bodyText}>
            {summary}
          </p>
        </div>
      )}

      {performanceInsights.length > 0 && (
        <SectionList
          title="Performance"
          items={performanceInsights}
          styles={styles}
        />
      )}

      {nutritionInsights.length > 0 && (
        <SectionList
          title="Nutrição"
          items={nutritionInsights}
          styles={styles}
        />
      )}

      {attentionPoints.length > 0 && (
        <div style={styles.attentionSection}>
          <div style={styles.attentionLabel}>
            Pontos de atenção
          </div>

          <div style={styles.list}>
            {attentionPoints.map((point, index) => (
              <div
                key={`attention-${index}`}
                style={styles.listItem}
              >
                <span
                  style={styles.attentionBullet}
                />

                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {disclaimer && (
        <p style={styles.disclaimer}>
          {disclaimer}
        </p>
      )}

      <button
        type="button"
        disabled={saving}
        onClick={onConfirm}
        style={{
          ...styles.confirmButton,
          opacity: saving ? 0.5 : 1,
          cursor: saving
            ? "not-allowed"
            : "pointer",
        }}
      >
        {saving
          ? "Salvando..."
          : "Confirmar e salvar"}
      </button>
    </section>
  );
}

function SectionList({
  title,
  items,
  styles,
}: {
  title: string;
  items: string[];
  styles: AiReviewPanelStyles;
}) {
  return (
    <div style={styles.textSection}>
      <div style={styles.sectionLabel}>
        {title}
      </div>

      <div style={styles.list}>
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            style={styles.listItem}
          >
            <span style={styles.bullet} />

            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
