"use client";

import React from "react";

export type SummaryCardItem = {
  label: React.ReactNode;
  value: React.ReactNode;
  detail: React.ReactNode;
  accent?: string;
};

export type SummaryCardsStyles = {
  grid: React.CSSProperties;
  card: React.CSSProperties;
  label: React.CSSProperties;
  value: React.CSSProperties;
  detail: React.CSSProperties;
};

type SummaryCardsProps = {
  cards: SummaryCardItem[];
  styles: SummaryCardsStyles;
};

export default function SummaryCards({
  cards,
  styles,
}: SummaryCardsProps) {
  return (
    <section style={styles.grid}>
      {cards.map((card, index) => (
        <article
          key={`${String(card.label)}-${index}`}
          style={styles.card}
        >
          <div style={styles.label}>
            {card.label}
          </div>

          <div
            style={{
              ...styles.value,
              color: card.accent || "#f4f4f5",
            }}
          >
            {card.value}
          </div>

          <div style={styles.detail}>
            {card.detail}
          </div>
        </article>
      ))}
    </section>
  );
}
