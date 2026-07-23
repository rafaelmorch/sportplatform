type CoachPlanProps = {
  aiResult: any | null;
  aiLoading: boolean;
  onAnalyze: () => void | Promise<void>;
};

function renderText(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function renderStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (item && typeof item === "object") {
        const candidate =
          (item as any).text ??
          (item as any).title ??
          (item as any).recommendation ??
          (item as any).description ??
          (item as any).details;

        return typeof candidate === "string"
          ? candidate.trim()
          : "";
      }

      return "";
    })
    .filter(Boolean);
}

function getDayTitle(day: any, index: number) {
  return (
    renderText(day?.day) ??
    renderText(day?.title) ??
    renderText(day?.name) ??
    `Dia ${index + 1}`
  );
}

function getDayDescription(day: any) {
  return (
    renderText(day?.workout) ??
    renderText(day?.training) ??
    renderText(day?.description) ??
    renderText(day?.details) ??
    renderText(day?.text)
  );
}

export default function CoachPlan({
  aiResult,
  aiLoading,
  onAnalyze,
}: CoachPlanProps) {
  const summary =
    renderText(aiResult?.summary) ??
    renderText(aiResult?.analysis) ??
    renderText(aiResult?.overview);

  const days = Array.isArray(aiResult?.days)
    ? aiResult.days
    : Array.isArray(aiResult?.weeklyPlan)
      ? aiResult.weeklyPlan
      : Array.isArray(aiResult?.weekly_plan)
        ? aiResult.weekly_plan
        : [];

  const nutritionItems = renderStringList(
    aiResult?.nutrition ??
      aiResult?.nutritionRecommendations ??
      aiResult?.nutrition_recommendations
  );

  const recoveryItems = renderStringList(
    aiResult?.recovery ??
      aiResult?.recoveryRecommendations ??
      aiResult?.recovery_recommendations
  );

  const attentionPoints = renderStringList(
    aiResult?.attentionPoints ??
      aiResult?.attention_points ??
      aiResult?.warnings
  );

  const disclaimer = renderText(aiResult?.disclaimer);

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #09090b 0%, #151517 8%, #18181b 48%, #141416 90%, #09090b 100%)",
        borderTop: "1px solid rgba(255,241,168,0.10)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -120,
          right: -150,
          width: 390,
          height: 390,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,241,168,0.09) 0%, rgba(212,175,55,0.025) 42%, transparent 72%)",
          pointerEvents: "none",
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 140,
          left: -170,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.035) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 900,
          margin: "0 auto",
          padding:
            "clamp(48px, 9vw, 82px) clamp(20px, 5vw, 46px) clamp(52px, 10vw, 92px)",
        }}
      >
        <SectionHeading
          eyebrow="Coach IA"
          title="Seu plano de evolução"
          description="Uma leitura organizada dos próximos passos para treinamento, alimentação e recuperação."
        />

        {!aiResult && !aiLoading ? (
          <div
            style={{
              marginTop: "clamp(36px, 7vw, 58px)",
              padding: "30px 0",
              borderTop: "1px solid rgba(255,255,255,0.10)",
              borderBottom: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div
              style={{
                color: "#ffffff",
                fontSize: 17,
                lineHeight: 1.5,
                fontWeight: 700,
              }}
            >
              Sua análise personalizada ainda não foi gerada.
            </div>

            <div
              style={{
                marginTop: 9,
                maxWidth: 680,
                color: "#8f8f98",
                fontSize: 13,
                lineHeight: 1.75,
              }}
            >
              O Coach IA utilizará os dados disponíveis no seu perfil para
              organizar recomendações e próximos passos.
            </div>
          </div>
        ) : null}

        {aiLoading ? (
          <div
            style={{
              marginTop: "clamp(36px, 7vw, 58px)",
              padding: "34px 0",
              borderTop: "1px solid rgba(255,255,255,0.10)",
              borderBottom: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 10,
                  height: 10,
                  flexShrink: 0,
                  borderRadius: "50%",
                  background: "#fff1a8",
                  boxShadow:
                    "0 0 10px rgba(255,241,168,0.70), 0 0 24px rgba(212,175,55,0.30)",
                }}
              />

              <div>
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: 16,
                    fontWeight: 750,
                    lineHeight: 1.4,
                  }}
                >
                  Analisando seus dados
                </div>

                <div
                  style={{
                    marginTop: 5,
                    color: "#8f8f98",
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  Estamos preparando suas recomendações personalizadas.
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {aiResult ? (
          <div
            style={{
              marginTop: "clamp(40px, 8vw, 66px)",
            }}
          >
            {summary ? (
              <ReportSection
                eyebrow="Análise geral"
                first
              >
                <div
                  style={{
                    paddingLeft: 20,
                    borderLeft:
                      "2px solid rgba(255,241,168,0.76)",
                    color: "#ffffff",
                    fontSize: "clamp(18px, 4vw, 25px)",
                    fontWeight: 650,
                    lineHeight: 1.65,
                    letterSpacing: "-0.018em",
                  }}
                >
                  {summary}
                </div>
              </ReportSection>
            ) : null}

            {days.length > 0 ? (
              <ReportSection eyebrow="Plano dos próximos 7 dias">
                <div>
                  {days.map((day: any, index: number) => {
                    const title =
                      day?.day != null
                        ? `Dia ${day.day}`
                        : getDayTitle(day, index);

                    const trainingModality = renderText(
                      day?.training?.modality
                    );

                    const trainingDuration = renderText(
                      day?.training?.duration
                    );

                    const trainingIntensity = renderText(
                      day?.training?.intensity
                    );

                    const trainingIntensityExplanation = renderText(
                      day?.training?.intensityExplanation
                    );

                    const trainingDetails =
                      renderText(day?.training?.details) ??
                      renderText(day?.training?.goal);

                    const trainingGoal = renderText(
                      day?.training?.goal
                    );

                    const trainingCaution = renderText(
                      day?.training?.caution
                    );

                    const nutritionFocus = renderText(
                      day?.nutrition?.dailyFocus
                    );

                    const breakfast = renderText(
                      day?.nutrition?.breakfast
                    );

                    const lunch = renderText(
                      day?.nutrition?.lunch
                    );

                    const preWorkout = renderText(
                      day?.nutrition?.preWorkout
                    );

                    const postWorkout = renderText(
                      day?.nutrition?.postWorkout
                    );

                    const dinner = renderText(
                      day?.nutrition?.dinner
                    );

                    const hydration = renderText(
                      day?.nutrition?.hydration
                    );

                    const proteinTarget = renderText(
                      day?.nutrition?.proteinTarget
                    );

                    const carbTarget = renderText(
                      day?.nutrition?.carbTarget
                    );

                    return (
                      <article
                        key={`${title}-${index}`}
                        style={{
                          padding: "clamp(28px, 6vw, 42px) 0",
                          borderBottom:
                            index === days.length - 1
                              ? "none"
                              : "1px solid rgba(255,255,255,0.10)",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              flexWrap: "wrap",
                            }}
                          >
                            <div
                              style={{
                                color: "#fff1a8",
                                fontSize: 12,
                                fontWeight: 850,
                                lineHeight: 1,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                              }}
                            >
                              Dia {index + 1}
                            </div>

                            <div
                              aria-hidden="true"
                              style={{
                                width: 28,
                                height: 1,
                                background:
                                  "rgba(255,241,168,0.48)",
                              }}
                            />
                          </div>

                          <div
                            style={{
                              minWidth: 0,
                              marginTop: 14,
                            }}
                          >

                            <DaySection title="Treino">
                              <DayValue
                                label="Modalidade"
                                value={
                                  trainingModality ??
                                  "Atividade recomendada"
                                }
                              />

                              <DayValue
                                label="Duração"
                                value={trainingDuration}
                              />

                              <DayValue
                                label="Intensidade"
                                value={trainingIntensity}
                              />

                              <DayValue
                                label="Explicação"
                                value={trainingIntensityExplanation}
                              />

                              <DayValue
                                label="Detalhes"
                                value={trainingDetails}
                              />

                              {trainingGoal &&
                              trainingGoal !== trainingDetails ? (
                                <DayValue
                                  label="Objetivo"
                                  value={trainingGoal}
                                />
                              ) : null}
                            </DaySection>

                            <DaySection title="Alimentação">
                              <DayValue
                                label="Foco do dia"
                                value={
                                  nutritionFocus ??
                                  "Mantenha uma alimentação equilibrada."
                                }
                              />

                              <DayValue
                                label="Café da manhã"
                                value={breakfast}
                              />

                              <DayValue
                                label="Almoço"
                                value={lunch}
                              />

                              <DayValue
                                label="Pré-treino"
                                value={preWorkout}
                              />

                              <DayValue
                                label="Pós-treino"
                                value={postWorkout}
                              />

                              <DayValue
                                label="Jantar"
                                value={dinner}
                              />

                              <DayValue
                                label="Hidratação"
                                value={
                                  hydration ??
                                  "Conforme sua rotina e necessidade."
                                }
                              />

                              <DayValue
                                label="Proteína alvo"
                                value={proteinTarget}
                              />

                              <DayValue
                                label="Carboidrato alvo"
                                value={carbTarget}
                              />
                            </DaySection>

                            {trainingCaution ? (
                              <div
                                style={{
                                  marginTop: 24,
                                  paddingLeft: 18,
                                  borderLeft:
                                    "2px solid rgba(255,241,168,0.72)",
                                }}
                              >
                                <div
                                  style={{
                                    color: "#fff1a8",
                                    fontSize: 10,
                                    fontWeight: 850,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.14em",
                                  }}
                                >
                                  Ponto de atenção
                                </div>

                                <div
                                  style={{
                                    marginTop: 8,
                                    color: "#e4e4e7",
                                    fontSize: 13,
                                    lineHeight: 1.75,
                                  }}
                                >
                                  {trainingCaution}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </ReportSection>
            ) : null}

            {nutritionItems.length > 0 ? (
              <ReportList
                title="Alimentação"
                items={nutritionItems}
              />
            ) : null}

            {recoveryItems.length > 0 ? (
              <ReportList
                title="Recuperação"
                items={recoveryItems}
              />
            ) : null}

            {attentionPoints.length > 0 ? (
              <ReportSection eyebrow="Pontos de atenção">
                <div
                  style={{
                    paddingLeft: 20,
                    borderLeft:
                      "2px solid rgba(255,241,168,0.76)",
                  }}
                >
                  {attentionPoints.map((item, index) => (
                    <div
                      key={`attention-${index}`}
                      style={{
                        padding:
                          index === 0 ? "0 0 14px" : "14px 0",
                        borderBottom:
                          index === attentionPoints.length - 1
                            ? "none"
                            : "1px solid rgba(255,255,255,0.075)",
                        color: "#e4e4e7",
                        fontSize: 14,
                        lineHeight: 1.75,
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </ReportSection>
            ) : null}

            {disclaimer ? (
              <div
                style={{
                  marginTop: 28,
                  paddingTop: 22,
                  borderTop:
                    "1px solid rgba(255,255,255,0.075)",
                  color: "#71717a",
                  fontSize: 11,
                  lineHeight: 1.75,
                }}
              >
                {disclaimer}
              </div>
            ) : null}
          </div>
        ) : null}

        <div
          style={{
            marginTop: "clamp(42px, 8vw, 68px)",
            paddingTop: "clamp(30px, 6vw, 48px)",
            borderTop: "1px solid rgba(255,241,168,0.15)",
          }}
        >
          <div
            style={{
              color: "#fff1a8",
              fontSize: 11,
              fontWeight: 850,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            Atualizar análise
          </div>

          <div
            style={{
              marginTop: 10,
              maxWidth: 650,
              color: "#a1a1aa",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            Gere novamente o relatório após atualizar seus treinos, alimentação,
            peso, exames ou objetivo.
          </div>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={aiLoading}
            style={{
              width: "100%",
              minHeight: 54,
              marginTop: 22,
              padding: "15px 22px",
              borderRadius: 12,
              border: aiLoading
                ? "1px solid rgba(255,255,255,0.10)"
                : "1px solid rgba(255,241,168,0.78)",
              background: aiLoading
                ? "rgba(255,255,255,0.055)"
                : "linear-gradient(135deg, #fff1a8 0%, #d4af37 50%, #98751c 100%)",
              boxShadow: aiLoading
                ? "none"
                : "0 14px 34px rgba(212,175,55,0.18), inset 0 1px 0 rgba(255,255,255,0.45)",
              color: aiLoading ? "#a1a1aa" : "#09090b",
              fontFamily: "Montserrat, sans-serif",
              fontSize: 13,
              fontWeight: 850,
              letterSpacing: "0.025em",
              cursor: aiLoading ? "not-allowed" : "pointer",
            }}
          >
            {aiLoading
              ? "Analisando seus dados..."
              : aiResult
                ? "Gerar nova análise"
                : "Gerar minha análise"}
          </button>
        </div>
      </div>
    </section>
  );
}

function DaySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginTop: 26,
        paddingTop: 20,
        borderTop: "1px solid rgba(255,255,255,0.085)",
      }}
    >
      <div
        style={{
          color: "#fff1a8",
          fontSize: 10,
          fontWeight: 850,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gap: 10,
        }}
      >
        {children}
      </div>
    </section>
  );
}

function DayValue({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) {
    return null;
  }

  return (
    <div
      style={{
        padding: "9px 0",
      }}
    >
      <div
        style={{
          color: "#7f7f89",
          fontSize: 10,
          fontWeight: 800,
          lineHeight: 1.4,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 6,
          maxWidth: 720,
          color: "#f4f4f5",
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.7,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
}
function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header>
      <div
        style={{
          width: 42,
          height: 2,
          borderRadius: 999,
          background:
            "linear-gradient(90deg, #fff1a8 0%, #d4af37 68%, transparent 100%)",
          boxShadow:
            "0 0 14px rgba(255,241,168,0.24)",
        }}
      />

      <div
        style={{
          marginTop: 18,
          color: "#fff1a8",
          fontSize: 12,
          fontWeight: 850,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
        }}
      >
        {eyebrow}
      </div>

      <h2
        style={{
          margin: "10px 0 0",
          maxWidth: 720,
          color: "#ffffff",
          fontSize: "clamp(26px, 5vw, 40px)",
          lineHeight: 1.12,
          letterSpacing: "-0.04em",
          fontWeight: 850,
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: "15px 0 0",
          maxWidth: 680,
          color: "#a1a1aa",
          fontSize: 14,
          lineHeight: 1.75,
        }}
      >
        {description}
      </p>
    </header>
  );
}

function ReportSection({
  eyebrow,
  children,
  first = false,
}: {
  eyebrow: string;
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <section
      style={{
        padding: first ? "0 0 34px" : "34px 0",
        borderBottom:
          "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <div style={reportLabelStyle}>{eyebrow}</div>

      <div style={{ marginTop: 18 }}>
        {children}
      </div>
    </section>
  );
}

function ReportList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <ReportSection eyebrow={title}>
      <div>
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            style={{
              display: "grid",
              gridTemplateColumns: "9px minmax(0, 1fr)",
              gap: 15,
              alignItems: "start",
              padding: "13px 0",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 5,
                height: 5,
                marginTop: 9,
                borderRadius: "50%",
                background: "#d4af37",
                boxShadow:
                  "0 0 9px rgba(255,241,168,0.38)",
              }}
            />

            <div
              style={{
                color: "#d4d4d8",
                fontSize: 14,
                lineHeight: 1.75,
              }}
            >
              {item}
            </div>
          </div>
        ))}
      </div>
    </ReportSection>
  );
}

const reportLabelStyle: React.CSSProperties = {
  color: "#fff1a8",
  fontSize: 11,
  fontWeight: 850,
  textTransform: "uppercase",
  letterSpacing: "0.15em",
};