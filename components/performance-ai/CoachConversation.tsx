"use client";

import { useState } from "react";
type MealRow = {
  id: string;
  meal_text: string;
  eaten_at: string;
  meal_type: string | null;
  protein_level: string | null;
  quality_level: string | null;
  ai_notes: string | null;
};

type BloodTestRow = {
  id: string;
  exam_date: string | null;
  hemoglobin: number | null;
  ferritin: number | null;
  vitamin_d: number | null;
  glucose: number | null;
  total_cholesterol: number | null;
  hdl: number | null;
  ldl: number | null;
  triglycerides: number | null;
  tsh: number | null;
  creatinine: number | null;
  notes: string | null;
  created_at: string;
};

type BioimpedanceRow = {
  id: string;
  assessment_date: string | null;
  weight_kg: number | null;
  body_fat_percent: number | null;
  muscle_mass_kg: number | null;
  visceral_fat: number | null;
  body_water_percent: number | null;
  bmr: number | null;
  notes: string | null;
  created_at: string;
};

type WeightLogRow = {
  id: string;
  weight_kg: number;
  created_at: string;
};

type RangeKey = "7d" | "30d" | "6m" | "all";

type StravaActivityRow = {
  id: string;
  athlete_id: number;
  name: string | null;
  type: string | null;
  sport_type: string | null;
  start_date: string | null;
  distance: number | null;
  moving_time: number | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
};

type CoachConversationMessage = {
  id: string;
  role: "user" | "coach";
  content: string;
};

export default function CoachConversation({
  profile,
  training,
  meals,
  weightLogs,
  bioimpedanceLogs,
  bloodTestLogs,
  latestAnalysis,
}: {
  profile: {
    weightKg: string;
    heightCm: string;
    age: string;
    gender: string;
    goal: string;
    goalDate: string;
    goalType: string;
    goalPriority: string;
    healthNotes: string;
  };
  training: {
    activities: StravaActivityRow[];
    stravaConnected: boolean;
  };
  meals: MealRow[];
  weightLogs: WeightLogRow[];
  bioimpedanceLogs: BioimpedanceRow[];
  bloodTestLogs: BloodTestRow[];
  latestAnalysis: any | null;
}) {
  const suggestions = [
    "Analise meu último treino",
    "Estou pronto para correr 21 km?",
    "O que devo fazer amanhã?",
    "Minha carga de treinamento está alta?",
    "Como posso melhorar meu pace?",
    "Estou recuperado para treinar?",
    "Preciso descansar hoje?",
    "Analise minha evolução",
  ];

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<CoachConversationMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [conversationError, setConversationError] =
    useState<string | null>(null);

  const submitQuestion = async (questionText?: string) => {
    const finalQuestion = (questionText ?? question).trim();

    if (!finalQuestion || sending) {
      return;
    }

    const previousMessages = messages.slice(-8);

    const userMessage: CoachConversationMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: finalQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setConversationError(null);
    setSending(true);

    try {
      const response = await fetch("/api/performance-ai/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: finalQuestion,
          history: previousMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          athleteContext: {
            profile,
            training: {
              stravaConnected: training.stravaConnected,
              activities: training.activities.slice(0, 30),
              activitiesAvailable: training.activities.length,
            },
            nutrition: {
              recentMeals: meals.slice(0, 20),
              mealsAvailable: meals.length,
            },
            weightHistory: weightLogs.slice(0, 10),
            bioimpedance: bioimpedanceLogs.slice(0, 5),
            bloodTests: bloodTestLogs.slice(0, 5),
            latestCoachAnalysis: latestAnalysis,
          },
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          json?.error ??
            "Não foi possível obter uma resposta do Coach."
        );
      }

      const answer =
        typeof json?.answer === "string"
          ? json.answer.trim()
          : "";

      if (!answer) {
        throw new Error("O Coach retornou uma resposta vazia.");
      }

      const coachMessage: CoachConversationMessage = {
        id: `coach-${Date.now()}`,
        role: "coach",
        content: answer,
      };

      setMessages((current) => [...current, coachMessage]);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao conversar com o Coach.";

      setConversationError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      id="coach-conversation"
      style={{
        width: "100%",
        background: "#050505",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        scrollMarginTop: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding:
            "clamp(58px, 9vw, 104px) 16px max(110px, env(safe-area-inset-bottom))",
        }}
      >
        <div style={{ maxWidth: 790 }}>
          <div
            style={{
              color: "#fff1a8",
              fontSize: 11,
              fontWeight: 850,
              letterSpacing: "0.14em",
              lineHeight: 1.4,
              textTransform: "uppercase",
            }}
          >
            Coach IA
          </div>

          <h2
            style={{
              margin: "12px 0 0",
              color: "#ffffff",
              fontSize: "clamp(34px, 6vw, 58px)",
              fontWeight: 790,
              lineHeight: 1.02,
              letterSpacing: "-0.045em",
            }}
          >
            Converse com seu Coach
          </h2>

          <p
            style={{
              margin: "20px 0 0",
              maxWidth: 690,
              color: "#a1a1aa",
              fontSize: "clamp(15px, 2vw, 18px)",
              lineHeight: 1.75,
            }}
          >
            Pergunte sobre seus treinos, recuperação, preparação para provas,
            evolução esportiva e alimentação relacionada ao exercício.
          </p>
        </div>

        {messages.length > 0 && (
          <div
            style={{
              marginTop: "clamp(40px, 6vw, 62px)",
              borderTop: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  padding: "clamp(25px, 4vw, 36px) 0",
                  borderBottom: "1px solid rgba(255,255,255,0.09)",
                }}
              >
                <div
                  style={{
                    color:
                      message.role === "coach"
                        ? "#fff1a8"
                        : "#8f8f98",
                    fontSize: 10,
                    fontWeight: 850,
                    lineHeight: 1.4,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {message.role === "coach" ? "Coach" : "Você"}
                </div>

                <div
                  style={{
                    marginTop: 11,
                    maxWidth: 760,
                    color:
                      message.role === "coach"
                        ? "#f4f4f5"
                        : "#d4d4d8",
                    fontSize: "clamp(15px, 2vw, 17px)",
                    lineHeight: 1.75,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {sending && (
              <div
                style={{
                  padding: "26px 0",
                  color: "#a1a1aa",
                  fontSize: 14,
                  lineHeight: 1.6,
                  borderBottom: "1px solid rgba(255,255,255,0.09)",
                }}
              >
                O Coach está analisando seus dados...
              </div>
            )}
          </div>
        )}

        {conversationError && (
          <div
            role="alert"
            style={{
              marginTop: 24,
              padding: "14px 16px",
              border: "1px solid rgba(248,113,113,0.35)",
              background: "rgba(127,29,29,0.14)",
              color: "#fecaca",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {conversationError}
          </div>
        )}

        <div
          style={{
            marginTop:
              messages.length > 0
                ? "clamp(34px, 5vw, 48px)"
                : "clamp(44px, 7vw, 68px)",
          }}
        >
          <label
            htmlFor="coach-question"
            style={{
              display: "block",
              color: "#f4f4f5",
              fontSize: 13,
              fontWeight: 750,
              lineHeight: 1.4,
              marginBottom: 12,
            }}
          >
            O que você gostaria de perguntar?
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <textarea
              id="coach-question"
              value={question}
              maxLength={2000}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  void submitQuestion();
                }
              }}
              placeholder="Exemplo: estou pronto para aumentar meu longão?"
              rows={3}
              style={{
                flex: "1 1 560px",
                width: "100%",
                minHeight: 112,
                resize: "vertical",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: 0,
                outline: "none",
                background: "#111111",
                color: "#ffffff",
                padding: "17px 18px",
                fontFamily: "inherit",
                fontSize: 15,
                lineHeight: 1.65,
              }}
            />

            <button
              type="button"
              onClick={() => void submitQuestion()}
              disabled={!question.trim() || sending}
              style={{
                alignSelf: "stretch",
                minWidth: 132,
                border: "1px solid rgba(255,241,168,0.78)",
                borderRadius: 0,
                background:
                  !question.trim() || sending
                    ? "rgba(255,241,168,0.12)"
                    : "#fff1a8",
                color:
                  !question.trim() || sending
                    ? "#77776f"
                    : "#111111",
                padding: "15px 24px",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 850,
                lineHeight: 1.4,
                cursor:
                  !question.trim() || sending
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {sending ? "Analisando..." : "Enviar"}
            </button>
          </div>

          <div
            style={{
              marginTop: 10,
              color: "#68686f",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            Pressione Enter para enviar ou Shift + Enter para quebrar a linha.
          </div>
        </div>

        <div
          style={{
            marginTop: "clamp(38px, 6vw, 58px)",
          }}
        >
          <div
            style={{
              color: "#8f8f98",
              fontSize: 11,
              fontWeight: 800,
              lineHeight: 1.4,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Sugestões
          </div>

          <div
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
              columnGap: "clamp(22px, 4vw, 42px)",
              rowGap: 0,
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void submitQuestion(suggestion)}
                disabled={sending}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 14,
                  border: "none",
                  borderBottom:
                    "1px solid rgba(255,255,255,0.09)",
                  background: "transparent",
                  color: sending ? "#66666c" : "#d4d4d8",
                  padding: "19px 0",
                  textAlign: "left",
                  fontFamily: "inherit",
                  fontSize: 14,
                  fontWeight: 620,
                  lineHeight: 1.5,
                  cursor: sending ? "not-allowed" : "pointer",
                }}
              >
                <span>{suggestion}</span>

                <span
                  aria-hidden="true"
                  style={{
                    flex: "0 0 auto",
                    color: sending ? "#66666c" : "#fff1a8",
                    fontSize: 17,
                    lineHeight: 1,
                  }}
                >
                  →
                </span>
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: "clamp(38px, 6vw, 58px)",
            paddingLeft: 16,
            borderLeft: "2px solid rgba(255,241,168,0.68)",
            maxWidth: 760,
            color: "#85858e",
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          O Coach não substitui avaliação médica. Ele utiliza seus dados
          esportivos para orientar treinamento, recuperação e preparação para
          objetivos esportivos.
        </div>
      </div>
    </section>
  );
}
