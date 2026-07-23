"use client";

type CoachRecommendationProps = {
  insight: string;
};

export default function CoachRecommendation({
  insight,
}: CoachRecommendationProps) {
  return (
    <section
      style={{
        borderRadius: 18,
        border: "1px solid #bfdbfe",
        background: "#eff6ff",
        padding: 20,
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#1d4ed8",
        }}
      >
        Recomendação do Coach
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          lineHeight: 1.55,
          color: "#0f172a",
        }}
      >
        {insight}
      </div>

      <div
        style={{
          fontSize: 12,
          lineHeight: 1.5,
          color: "#64748b",
        }}
      >
        Orientação gerada a partir dos dados atualmente disponíveis na Sports
        Platform. Ela não substitui avaliação médica ou profissional.
      </div>
    </section>
  );
}
