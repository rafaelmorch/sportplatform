type CoachRecommendationProps = {
  insight: string;
};

export default function CoachRecommendation({
  insight,
}: CoachRecommendationProps) {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        marginTop: 8,
        padding: "clamp(34px, 7vw, 58px) clamp(20px, 5vw, 46px)",
        background:
          "linear-gradient(180deg, #09090b 0%, #151517 18%, #18181b 50%, #151517 82%, #09090b 100%)",
        borderTop: "1px solid rgba(255,241,168,0.16)",
        borderBottom: "1px solid rgba(255,241,168,0.12)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -90,
          right: -70,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,241,168,0.10) 0%, rgba(212,175,55,0.04) 38%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: -120,
          left: -90,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.035) 0%, transparent 68%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 820,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            width: 42,
            height: 2,
            marginBottom: 18,
            borderRadius: 999,
            background:
              "linear-gradient(90deg, #fff1a8 0%, #d4af37 68%, transparent 100%)",
            boxShadow: "0 0 14px rgba(255,241,168,0.28)",
          }}
        />

        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            color: "#fff1a8",
          }}
        >
          Recomendação do Coach
        </div>

        <div
          style={{
            marginTop: 18,
            paddingLeft: 20,
            borderLeft: "2px solid rgba(255,241,168,0.72)",
          }}
        >
          <div
            style={{
              fontSize: "clamp(20px, 4.5vw, 28px)",
              fontWeight: 700,
              lineHeight: 1.5,
              letterSpacing: "-0.02em",
              color: "#ffffff",
            }}
          >
            {insight}
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            maxWidth: 680,
            fontSize: 12,
            lineHeight: 1.7,
            color: "#a1a1aa",
          }}
        >
          Orientação gerada a partir dos dados atualmente disponíveis na
          Sports Platform. Ela não substitui avaliação médica ou orientação de
          um profissional.
        </div>
      </div>
    </section>
  );
}