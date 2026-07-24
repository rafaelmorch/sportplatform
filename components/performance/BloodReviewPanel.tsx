import type React from "react";

import MetricGrid from "@/components/performance/MetricGrid";
import type { AiReviewPanelStyles } from "@/components/performance/AiReviewPanel";
import type { BloodAnalysis } from "@/lib/performance-ai/blood";

type Props = {
  visible: boolean;
  analysis: BloodAnalysis;
  saving?: boolean;
  onConfirm?: () => void;
  readOnly?: boolean;
  onClose?: () => void;
  styles: AiReviewPanelStyles;
};

function formatMetric(
  value: number | string | null | undefined,
  suffix = ""
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return `${value}${suffix}`;
}

export default function BloodReviewPanel({
  visible,
  analysis,
  saving = false,
  onConfirm,
  readOnly = false,
  onClose,
  styles,
}: Props) {
  if (!visible) {
    return null;
  }

  const extracted = analysis.extractedData ?? {};

  const metrics = [
    {
      label: "Data",
      value: extracted.exam_date ?? "—",
    },
    {
      label: "Hemoglobina",
      value: formatMetric(extracted.hemoglobin, " g/dL"),
    },
    {
      label: "Ferritina",
      value: formatMetric(extracted.ferritin, " ng/mL"),
    },
    {
      label: "Vitamina D",
      value: formatMetric(extracted.vitamin_d, " ng/mL"),
    },
    {
      label: "Glicose",
      value: formatMetric(extracted.glucose, " mg/dL"),
    },
    {
      label: "Colesterol total",
      value: formatMetric(
        extracted.total_cholesterol,
        " mg/dL"
      ),
    },
    {
      label: "HDL",
      value: formatMetric(extracted.hdl, " mg/dL"),
    },
    {
      label: "LDL",
      value: formatMetric(extracted.ldl, " mg/dL"),
    },
    {
      label: "Triglicerídeos",
      value: formatMetric(
        extracted.triglycerides,
        " mg/dL"
      ),
    },
    {
      label: "TSH",
      value: formatMetric(extracted.tsh, " mUI/L"),
    },
    {
      label: "Creatinina",
      value: formatMetric(extracted.creatinine, " mg/dL"),
    },
  ];

  return (
    <section style={styles.panel}>
      <div style={styles.eyebrow}>
        {readOnly ? "Exame salvo" : "Resultado da IA"}
      </div>

      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>
            {readOnly
              ? "Detalhes do exame"
              : "Confira os dados encontrados"}
          </h3>

          <p style={styles.description}>
            {readOnly
              ? "Consulte os marcadores e as informações geradas pela inteligência artificial."
              : "Revise os marcadores identificados antes de salvar o exame no seu histórico."}
          </p>
        </div>

        <div style={styles.status}>
          {readOnly
            ? "Salvo no histórico"
            : "Pronto para salvar"}
        </div>
      </div>

      <MetricGrid
        metrics={metrics}
        styles={styles}
      />

      {analysis.summary && (
        <div style={styles.textSection}>
          <div style={styles.sectionLabel}>
            Resumo
          </div>

          <p style={styles.bodyText}>
            {analysis.summary}
          </p>
        </div>
      )}

      <InsightList
        title="Performance"
        items={analysis.performanceInsights ?? []}
        styles={styles}
      />

      <InsightList
        title="Nutrição"
        items={analysis.nutritionInsights ?? []}
        styles={styles}
      />

      {(analysis.attentionPoints?.length ?? 0) > 0 && (
        <div style={styles.attentionSection}>
          <div style={styles.attentionLabel}>
            Pontos de atenção
          </div>

          <div style={styles.list}>
            {analysis.attentionPoints?.map(
              (point, index) => (
                <div
                  key={`attention-${index}`}
                  style={styles.listItem}
                >
                  <span
                    style={styles.attentionBullet}
                  />
                  <span>{point}</span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {analysis.disclaimer && (
        <p style={styles.disclaimer}>
          {analysis.disclaimer}
        </p>
      )}

      {!readOnly && onConfirm && (
        <button
          type="button"
          disabled={saving}
          onClick={onConfirm}
          style={{
            ...styles.confirmButton,
            opacity: saving ? 0.55 : 1,
            cursor: saving
              ? "not-allowed"
              : "pointer",
          }}
        >
          {saving
            ? "Salvando..."
            : "Confirmar e salvar"}
        </button>
      )}

      {readOnly && onClose && (
        <button
          type="button"
          onClick={onClose}
          style={styles.confirmButton}
        >
          Fechar detalhes
        </button>
      )}
    </section>
  );
}

function InsightList({
  title,
  items,
  styles,
}: {
  title: string;
  items: string[];
  styles: AiReviewPanelStyles;
}) {
  if (items.length === 0) {
    return null;
  }

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
