type CoachCardItem = {
  title: string;
  score: number;
  text: string;
  detail: string;
};

type CoachCardsProps = {
  cards: CoachCardItem[];
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export default function CoachCards({ cards }: CoachCardsProps) {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #09090b 0%, #09090b 8%, #050506 50%, #09090b 92%, #09090b 100%)",
        padding: "clamp(42px, 8vw, 72px) clamp(20px, 5vw, 46px)",
        borderTop: "1px solid rgba(255,255,255,0.045)",
        borderBottom: "1px solid rgba(255,241,168,0.10)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -140,
          left: "50%",
          width: 440,
          height: 300,
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            width: 42,
            height: 2,
            borderRadius: 999,
            background:
              "linear-gradient(90deg, #fff1a8 0%, #d4af37 68%, transparent 100%)",
            boxShadow: "0 0 14px rgba(255,241,168,0.24)",
          }}
        />

        <div
          style={{
            marginTop: 18,
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            color: "#fff1a8",
          }}
        >
          Áreas da performance
        </div>

        <h2
          style={{
            margin: "10px 0 0",
            maxWidth: 680,
            color: "#ffffff",
            fontSize: "clamp(25px, 5vw, 38px)",
            lineHeight: 1.14,
            letterSpacing: "-0.035em",
            fontWeight: 800,
          }}
        >
          Seu momento atual
        </h2>

        <p
          style={{
            margin: "14px 0 0",
            maxWidth: 680,
            color: "#a1a1aa",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          Veja como cada área está contribuindo para o seu desempenho geral.
        </p>

        <div
          style={{
            marginTop: "clamp(32px, 6vw, 50px)",
          }}
        >
          {cards.map((card, index) => {
            const score = clampScore(card.score);

            return (
              <article
                key={`${card.title}-${index}`}
                style={{
                  padding: "26px 0",
                  borderTop:
                    index === 0
                      ? "1px solid rgba(255,255,255,0.10)"
                      : "none",
                  borderBottom: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    gap: 20,
                    alignItems: "start",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <h3
                      style={{
                        margin: 0,
                        color: "#ffffff",
                        fontSize: "clamp(18px, 4vw, 23px)",
                        fontWeight: 750,
                        lineHeight: 1.3,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {card.title}
                    </h3>

                    <p
                      style={{
                        margin: "10px 0 0",
                        maxWidth: 650,
                        color: "#d4d4d8",
                        fontSize: 14,
                        lineHeight: 1.7,
                      }}
                    >
                      {card.text}
                    </p>

                    <div
                      style={{
                        marginTop: 10,
                        color: "#71717a",
                        fontSize: 12,
                        lineHeight: 1.6,
                        fontWeight: 600,
                      }}
                    >
                      {card.detail}
                    </div>
                  </div>

                  <div
                    style={{
                      minWidth: 58,
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        color: "#fff1a8",
                        fontSize: "clamp(24px, 5vw, 34px)",
                        lineHeight: 1,
                        fontWeight: 850,
                        letterSpacing: "-0.04em",
                        textShadow: "0 0 18px rgba(255,241,168,0.18)",
                      }}
                    >
                      {score}
                    </div>

                    <div
                      style={{
                        marginTop: 5,
                        color: "#71717a",
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      de 100
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    position: "relative",
                    height: 3,
                    marginTop: 20,
                    overflow: "hidden",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.075)",
                  }}
                >
                  <div
                    style={{
                      width: `${score}%`,
                      height: "100%",
                      borderRadius: 999,
                      background:
                        "linear-gradient(90deg, #8f6f18 0%, #d4af37 55%, #fff1a8 100%)",
                      boxShadow: "0 0 12px rgba(255,241,168,0.30)",
                    }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}