"use client";

type CoachPlanProps = {
  aiResult: any | null;
  aiLoading: boolean;
  onAnalyze: () => void;
};

export default function CoachPlan({
  aiResult,
  aiLoading,
  onAnalyze,
}: CoachPlanProps) {
  return (
    <section
      style={{
        borderRadius: 18,
        border: "1px solid #e2e8f0",
        background: "#ffffff",
        padding: 20,
        display: "grid",
        gap: 16,
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 23,
            fontWeight: 900,
            color: "#0f172a",
          }}
        >
          Plano dos próximos 7 dias
        </h2>

        <div
          style={{
            marginTop: 6,
            fontSize: 14,
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          Gere um plano personalizado usando os dados já registrados no seu
          perfil.
        </div>
      </div>

      <button
        type="button"
        onClick={onAnalyze}
        disabled={aiLoading}
        style={{
          minHeight: 48,
          border: "none",
          borderRadius: 12,
          padding: "0 20px",
          background: aiLoading ? "#64748b" : "#0f172a",
          color: "#ffffff",
          fontWeight: 900,
          fontFamily: "Montserrat, sans-serif",
          cursor: aiLoading ? "default" : "pointer",
        }}
      >
        {aiLoading
          ? "Analisando seus dados..."
          : aiResult
            ? "Gerar nova análise"
            : "Analisar com IA"}
      </button>

      {aiResult ? (
        <div style={{ display: "grid", gap: 16 }}>
          {aiResult.summary ? (
            <div
              style={{
                padding: 16,
                borderRadius: 14,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: 8,
                }}
              >
                Resumo geral
              </div>

              <div
                style={{
                  fontSize: 15,
                  color: "#334155",
                  lineHeight: 1.6,
                }}
              >
                {aiResult.summary}
              </div>
            </div>
          ) : null}

          {Array.isArray(aiResult.days) ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 14,
              }}
            >
              {aiResult.days.map((day: any, index: number) => (
                <article
                  key={index}
                  style={{
                    borderRadius: 16,
                    border: "1px solid #cbd5e1",
                    padding: 16,
                    background: "#ffffff",
                    display: "grid",
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 19,
                        fontWeight: 900,
                      }}
                    >
                      Dia {day.day ?? index + 1}
                    </h3>

                    <span
                      style={{
                        borderRadius: 999,
                        padding: "5px 9px",
                        background: "#dbeafe",
                        color: "#1d4ed8",
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      Plano IA
                    </span>
                  </div>

                  <div
                    style={{
                      borderRadius: 12,
                      padding: 14,
                      background: "#f8fafc",
                      display: "grid",
                      gap: 6,
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Treino</strong>

                    <div>
                      {day.training?.modality ?? "Atividade"}
                      {day.training?.duration
                        ? ` · ${day.training.duration}`
                        : ""}
                    </div>

                    <div>
                      {day.training?.details ??
                        day.training?.goal ??
                        "Detalhes não informados."}
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: 12,
                      padding: 14,
                      background: "#f0fdf4",
                      display: "grid",
                      gap: 6,
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Alimentação</strong>

                    <div>
                      {day.nutrition?.dailyFocus ??
                        "Mantenha uma alimentação equilibrada."}
                    </div>

                    <div>
                      Hidratação:{" "}
                      {day.nutrition?.hydration ?? "conforme sua rotina"}
                    </div>
                  </div>

                  {day.training?.caution ? (
                    <div
                      style={{
                        borderRadius: 12,
                        padding: 12,
                        background: "#fff7ed",
                        color: "#9a3412",
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      <strong>Atenção:</strong> {day.training.caution}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}

          {Array.isArray(aiResult.attentionPoints) &&
          aiResult.attentionPoints.length > 0 ? (
            <div
              style={{
                padding: 16,
                borderRadius: 14,
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                display: "grid",
                gap: 8,
              }}
            >
              <strong style={{ color: "#9a3412" }}>
                Pontos de atenção
              </strong>

              {aiResult.attentionPoints.map(
                (point: string, index: number) => (
                  <div
                    key={index}
                    style={{
                      fontSize: 13,
                      color: "#7c2d12",
                      lineHeight: 1.5,
                    }}
                  >
                    • {point}
                  </div>
                )
              )}
            </div>
          ) : null}

          {aiResult.disclaimer ? (
            <div
              style={{
                fontSize: 11,
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              {aiResult.disclaimer}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
