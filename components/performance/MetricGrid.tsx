"use client";

import React from "react";
import { AiReviewPanelStyles } from "./AiReviewPanel";

export type MetricItem = {
  label: string;
  value: string;
};

type Props = {
  metrics: MetricItem[];
  styles: AiReviewPanelStyles;
};

export default function MetricGrid({
  metrics,
  styles,
}: Props) {
  return (
    <div style={styles.metrics}>
      {metrics.map((metric) => (
        <div
          key={metric.label}
          style={styles.metric}
        >
          <span style={styles.metricLabel}>
            {metric.label}
          </span>

          <strong style={styles.metricValue}>
            {metric.value}
          </strong>
        </div>
      ))}
    </div>
  );
}
