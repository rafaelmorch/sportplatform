"use client";

type CoachHeroProps = {
  performanceScore: number;
  performanceStatus: string;
  statusDescription: string;
};

export default function CoachHero({
  performanceScore,
  performanceStatus,
  statusDescription,
}: CoachHeroProps) {
  return (
    <section
      style={{
        borderRadius: 20,
        padding: 24,
        color: "#ffffff",
        background:
          "linear-gradient(135deg, #0f172a 0%, #172554 55%, #1d4ed8 100%)",
        boxShadow: "0 18px 50px rgba(15, 23, 42, 0.18)",
        display: "grid",
        gap: 18,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#bfdbfe",
            marginBottom: 8,
          }}
        >
          Sports Platform
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(30px, 6vw, 46px)",
            lineHeight: 1,
            fontWeight: 900,
          }}
        >
          Coach IA
        </h1>

        <div
          style={{
            marginTop: 10,
            fontSize: 15,
            lineHeight: 1.6,
            color: "#dbeafe",
            maxWidth: 700,
          }}
        >
          Uma visão integrada do seu treinamento, alimentação, peso, saúde e
          objetivo.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 18,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            borderRadius: 16,
            padding: 20,
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.18)",
            display: "grid",
            alignContent: "center",
            justifyItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#bfdbfe",
            }}
          >
            Score de Performance
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 56,
              lineHeight: 1,
              fontWeight: 900,
            }}
          >
            {performanceScore}
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: "#dbeafe",
            }}
          >
            de 100
          </div>
        </div>

        <div
          style={{
            borderRadius: 16,
            padding: 20,
            background: "#ffffff",
            color: "#0f172a",
            display: "grid",
            alignContent: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#2563eb",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Status do atleta
          </div>

          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
            }}
          >
            {performanceStatus}
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#475569",
              lineHeight: 1.6,
            }}
          >
            {statusDescription}
          </div>
        </div>
      </div>
    </section>
  );
}
