"use client";

import React from "react";

type WeightLog = {
  id: React.Key;
  weight_kg: number | string | null;
  created_at: string | null;
};

type TimelineCardStyles = {
  panel: React.CSSProperties;
  header: React.CSSProperties;
  eyebrow: React.CSSProperties;
  title: React.CSSProperties;
  description: React.CSSProperties;
  count: React.CSSProperties;
  emptyText: React.CSSProperties;
  timeline: React.CSSProperties;
  item: React.CSSProperties;
  rail: React.CSSProperties;
  dot: React.CSSProperties;
  line: React.CSSProperties;
  content: React.CSSProperties;
  topRow: React.CSSProperties;
  date: React.CSSProperties;
  time: React.CSSProperties;
  weight: React.CSSProperties;
  unit: React.CSSProperties;
  bottomRow: React.CSSProperties;
  change: React.CSSProperties;
  direction: React.CSSProperties;
};

type TimelineCardProps = {
  weightLogs: WeightLog[];
  formatTimelineDate: (
    value: string | null
  ) => string;
  formatTimelineTime: (
    value: string | null
  ) => string;
  styles: TimelineCardStyles;
};

export default function TimelineCard({
  weightLogs,
  formatTimelineDate,
  formatTimelineTime,
  styles,
}: TimelineCardProps) {
  const visibleLogs = weightLogs.slice(0, 10);

  return (
    <article style={styles.panel}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>
            Registros
          </div>

          <h2 style={styles.title}>
            Timeline corporal
          </h2>

          <p style={styles.description}>
            Evolução entre cada medição registrada.
          </p>
        </div>

        {weightLogs.length > 0 && (
          <div style={styles.count}>
            {weightLogs.length}{" "}
            {weightLogs.length === 1
              ? "medição"
              : "medições"}
          </div>
        )}
      </div>

      {weightLogs.length === 0 ? (
        <p style={styles.emptyText}>
          Nenhuma pesagem registrada.
        </p>
      ) : (
        <div style={styles.timeline}>
          {visibleLogs.map((item, index) => {
            const currentValue = Number(
              item.weight_kg
            );

            const olderItem =
              weightLogs[index + 1];

            const olderValue = olderItem
              ? Number(olderItem.weight_kg)
              : null;

            const difference =
              olderValue !== null &&
              Number.isFinite(olderValue)
                ? Number(
                    (
                      currentValue -
                      olderValue
                    ).toFixed(1)
                  )
                : null;

            const differenceColor =
              difference === null
                ? "#6f6f78"
                : difference < 0
                  ? "#86efac"
                  : difference > 0
                    ? "#fde68a"
                    : "#a1a1aa";

            const differenceText =
              difference === null
                ? "Primeira medição"
                : difference < 0
                  ? `${difference.toFixed(
                      1
                    )} kg desde a anterior`
                  : difference > 0
                    ? `+${difference.toFixed(
                        1
                      )} kg desde a anterior`
                    : "Sem alteração";

            const direction =
              difference === null
                ? "Início"
                : difference < 0
                  ? "Redução"
                  : difference > 0
                    ? "Aumento"
                    : "Estável";

            return (
              <div
                key={item.id}
                style={styles.item}
              >
                <div
                  style={styles.rail}
                  aria-hidden="true"
                >
                  <div
                    style={{
                      ...styles.dot,
                      borderColor:
                        index === 0
                          ? "#fff1a8"
                          : "rgba(255,255,255,0.24)",
                      background:
                        index === 0
                          ? "#fff1a8"
                          : "#101010",
                      boxShadow:
                        index === 0
                          ? "0 0 0 5px rgba(255,241,168,0.08)"
                          : "none",
                    }}
                  />

                  {index <
                    visibleLogs.length - 1 && (
                    <div style={styles.line} />
                  )}
                </div>

                <div style={styles.content}>
                  <div style={styles.topRow}>
                    <div>
                      <div style={styles.date}>
                        {formatTimelineDate(
                          item.created_at
                        )}
                      </div>

                      <div style={styles.time}>
                        {formatTimelineTime(
                          item.created_at
                        )}
                      </div>
                    </div>

                    <div style={styles.weight}>
                      {currentValue.toFixed(1)}{" "}
                      <span style={styles.unit}>
                        kg
                      </span>
                    </div>
                  </div>

                  <div style={styles.bottomRow}>
                    <span
                      style={{
                        ...styles.change,
                        color: differenceColor,
                      }}
                    >
                      {differenceText}
                    </span>

                    <span
                      style={{
                        ...styles.direction,
                        color: differenceColor,
                        borderColor:
                          `${differenceColor}40`,
                      }}
                    >
                      {direction}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
