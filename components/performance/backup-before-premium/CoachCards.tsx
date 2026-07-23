"use client";

export type CoachCardItem = {
  title: string;
  score: number;
  text: string;
  detail: string;
};

type CoachCardsProps = {
  cards: CoachCardItem[];
};

export default function CoachCards({ cards }: CoachCardsProps) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 14,
      }}
    >
      {cards.map((card) => (
        <article
          key={card.title}
          style={{
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            padding: 18,
            display: "grid",
            gap: 12,
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              {card.title}
            </h2>

            <div
              style={{
                minWidth: 48,
                height: 48,
                borderRadius: 14,
                display: "grid",
                placeItems: "center",
                background: "#f1f5f9",
                color: "#0f172a",
                fontSize: 17,
                fontWeight: 900,
              }}
            >
              {card.score}
            </div>
          </div>

          <div
            style={{
              height: 7,
              borderRadius: 999,
              background: "#e2e8f0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(100, card.score))}%`,
                height: "100%",
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)",
              }}
            />
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#334155",
              lineHeight: 1.55,
            }}
          >
            {card.text}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            {card.detail}
          </div>
        </article>
      ))}
    </section>
  );
}
