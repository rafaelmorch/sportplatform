"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import CoachHero from "@/components/performance/CoachHero";
import CoachCards from "@/components/performance/CoachCards";
import CoachRecommendation from "@/components/performance/CoachRecommendation";
import CoachPlan from "@/components/performance/CoachPlan";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
  formatDuration,
  formatShortDate,
} from "@/lib/performance/formatters";
import {
  isInRange,
} from "@/lib/performance/ranges";
import {
  classifyMeal,
} from "@/lib/performance/nutrition";

type ProfileRow = {
  id: string;
  user_id: string;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  gender: string | null;
  goal: string | null;
  health_notes: string | null;
  goal_date: string | null;
  goal_type: string | null;
  goal_priority: string | null;
};

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

function getDailyInsight(meals: MealRow[]) {
  if (!meals || meals.length === 0) {
    return "Nenhuma refeição registrada hoje.";
  }

  const proteinHigh = meals.filter((meal) => meal.protein_level === "alta").length;
  const qualityLow = meals.filter((meal) => meal.quality_level === "baixa").length;
  const qualityGood = meals.filter((meal) => meal.quality_level === "boa").length;

  if (qualityLow >= 2) {
    return "Sua alimentação hoje teve baixa qualidade. Tente reduzir ultraprocessados e incluir comida de verdade.";
  }

  if (proteinHigh >= 2) {
    return "Boa ingestão de proteína hoje. Isso ajuda na recuperação muscular.";
  }

  if (qualityGood >= 2) {
    return "Boa qualidade alimentar hoje. Continue mantendo consistência nas escolhas.";
  }

  if (meals.length <= 2) {
    return "Poucas refeições registradas. Tente manter mais consistência ao longo do dia.";
  }

  return "Seu dia está relativamente equilibrado até agora.";
}

function getCoachInsight(params: {
  meals: MealRow[];
  weeklyActivitiesCount: number;
  weeklyDistanceKm: number;
  weeklyMovingTime: number;
  avgHeartRate: number | null;
  weightLogs: WeightLogRow[];
}) {
  const {
    meals,
    weeklyActivitiesCount,
    weeklyDistanceKm,
    weeklyMovingTime,
    avgHeartRate,
    weightLogs,
  } = params;

  const lowQualityMeals = meals.filter((meal) => meal.quality_level === "baixa").length;
  const highProteinMeals = meals.filter((meal) => meal.protein_level === "alta").length;
  const totalTrainingHours = weeklyMovingTime / 3600;

  const currentWeight = weightLogs.length > 0 ? Number(weightLogs[0].weight_kg) : null;
  const previousWeight = weightLogs.length > 1 ? Number(weightLogs[1].weight_kg) : null;
  const weightDiff =
    currentWeight != null && previousWeight != null
      ? Number((currentWeight - previousWeight).toFixed(1))
      : null;

  if (weightDiff != null && weightDiff <= -1 && totalTrainingHours >= 3) {
    return "Seu peso caiu junto com um volume razoável de treino. Vale reforçar recuperação, hidratação e ingestão de proteína para evitar queda excessiva.";
  }

  if (weightDiff != null && weightDiff >= 1 && lowQualityMeals >= 2) {
    return "Seu peso subiu e sua alimentação recente teve baixa qualidade. Tente reduzir ultraprocessados e voltar para refeições mais equilibradas.";
  }

  if (weightLogs.length === 0) {
    return "Você ainda não registrou seu peso. Isso limita a precisão das orientações. Tente atualizar o peso algumas vezes por semana.";
  }

  if (weeklyActivitiesCount >= 4 && highProteinMeals <= 1) {
    return "Você treinou bem nos últimos dias, mas sua ingestão de proteína parece baixa. Priorize proteína nas próximas refeições para ajudar na recuperação.";
  }

  if (weeklyDistanceKm >= 25 && meals.length <= 2) {
    return "Seu volume de treino está alto para poucas refeições registradas. Vale reforçar alimentação e hidratação ao longo do dia.";
  }

  if (avgHeartRate && avgHeartRate >= 155 && lowQualityMeals >= 1) {
    return "Seu treino mostra esforço elevado e sua alimentação pode melhorar. Hoje vale focar em comida de verdade, hidratação e recuperação.";
  }

  if (lowQualityMeals >= 2) {
    return "Hoje sua alimentação teve qualidade baixa. Tente reduzir ultraprocessados e incluir uma refeição mais completa com proteína e carboidrato de melhor qualidade.";
  }

  if (weeklyActivitiesCount === 0 && meals.length > 0) {
    return "Você registrou alimentação, mas não há treinos recentes no Strava. Se hoje for dia de descanso, foque em recuperação e consistência.";
  }

  if (totalTrainingHours >= 3 && highProteinMeals >= 2) {
    return "Bom equilíbrio entre treino e alimentação. Você está sustentando bem a recuperação nesta fase.";
  }

  if (weightDiff != null && Math.abs(weightDiff) < 0.3 && weeklyActivitiesCount >= 3) {
    return "Seu peso está estável e sua rotina de treino segue ativa. Isso sugere boa consistência nesta fase.";
  }

  return "Seu quadro está relativamente equilibrado. Continue registrando refeições, peso e treinos para receber orientações mais precisas.";
}

function highLevelFoodTip(meals: MealRow[]) {
  if (!meals || meals.length === 0) {
    return "Registre suas refeições para receber orientação.";
  }

  const lowQualityMeals = meals.filter((m) => m.quality_level === "baixa").length;
  const highProteinMeals = meals.filter((m) => m.protein_level === "alta").length;

  if (lowQualityMeals >= 2) {
    return "Hoje vale focar em comida de verdade e reduzir ultraprocessados.";
  }

  if (highProteinMeals >= 2) {
    return "Boa ingestão de proteína hoje. Continue assim.";
  }

  return "Tente incluir proteína e manter refeições mais equilibradas.";
}

function highLevelTrainingTip(count: number, distance: number, time: number) {
  if (count === 0) return "Sem treinos recentes. Comece leve.";
  if (distance >= 20) return "Volume alto. Priorize recuperação.";
  if (count >= 4) return "Boa frequência. Mantenha consistência.";
  if (time / 3600 >= 3) return "Carga relevante. Evite aumentar tudo de uma vez.";
  return "Continue treinando e aumente gradualmente.";
}

function getTrainingCoachInsight(params: {
  weeklyActivitiesCount: number;
  weeklyDistanceKm: number;
  weeklyMovingTime: number;
  avgHeartRate: number | null;
  weightLogs: WeightLogRow[];
}) {
  const {
    weeklyActivitiesCount,
    weeklyDistanceKm,
    weeklyMovingTime,
    avgHeartRate,
    weightLogs,
  } = params;

  const totalTrainingHours = weeklyMovingTime / 3600;
  const currentWeight = weightLogs.length > 0 ? Number(weightLogs[0].weight_kg) : null;
  const previousWeight = weightLogs.length > 1 ? Number(weightLogs[1].weight_kg) : null;
  const weightDiff =
    currentWeight != null && previousWeight != null
      ? Number((currentWeight - previousWeight).toFixed(1))
      : null;

  if (weeklyActivitiesCount === 0) {
    return "Você está sem treinos recentes no Strava. Vale voltar com uma sessão leve para retomar consistência.";
  }

  if (weeklyDistanceKm >= 30 || totalTrainingHours >= 4) {
    return "Seu volume recente está alto. Hoje a prioridade deve ser recuperação ou um treino leve.";
  }

  if (avgHeartRate && avgHeartRate >= 155) {
    return "Seu esforço médio está alto. Evite aumentar carga em sequência e preste atenção na recuperação.";
  }

  if (weightDiff != null && weightDiff <= -1 && totalTrainingHours >= 3) {
    return "Seu peso caiu junto com uma boa carga de treino. Monitore energia e recuperação para não entrar em déficit excessivo.";
  }

  if (weeklyActivitiesCount >= 4) {
    return "Boa frequência de treino. O foco agora é manter constância e não subir a carga rápido demais.";
  }

  return "Sua rotina de treino está em andamento. Tente manter regularidade e evolução gradual.";
}

function getNutritionCoachInsight(params: {
  meals: MealRow[];
  weeklyActivitiesCount: number;
  weeklyDistanceKm: number;
  weeklyMovingTime: number;
}) {
  const { meals, weeklyActivitiesCount, weeklyDistanceKm, weeklyMovingTime } = params;

  const lowQualityMeals = meals.filter((meal) => meal.quality_level === "baixa").length;
  const highProteinMeals = meals.filter((meal) => meal.protein_level === "alta").length;
  const totalTrainingHours = weeklyMovingTime / 3600;

  if (meals.length === 0) {
    return "Você ainda não registrou alimentação. Sem isso, a recomendação nutricional fica limitada.";
  }

  if ((weeklyDistanceKm >= 25 || totalTrainingHours >= 3) && highProteinMeals <= 1) {
    return "Seu treino pede mais recuperação nutricional. Vale reforçar proteína nas próximas refeições.";
  }

  if (lowQualityMeals >= 2) {
    return "Sua alimentação recente teve qualidade baixa. Tente reduzir ultraprocessados e voltar para comida de verdade.";
  }

  if (weeklyActivitiesCount >= 4 && meals.length <= 2) {
    return "Você treinou bem, mas registrou poucas refeições. Pode estar faltando consistência na alimentação.";
  }

  if (highProteinMeals >= 2) {
    return "Boa ingestão de proteína. Isso favorece recuperação e manutenção de performance.";
  }

  return "Sua alimentação está razoável, mas ainda pode ficar mais estratégica para acompanhar a carga de treino.";
}


function CoachDataSources({
  profileId,
  weightKg,
  heightCm,
  age,
  gender,
  goal,
  weightLogs,
  bioimpedanceLogs,
  bloodTestLogs,
  stravaActivities,
  meals,
}: {
  profileId: string | null;
  weightKg: string;
  heightCm: string;
  age: string;
  gender: string;
  goal: string;
  weightLogs: WeightLogRow[];
  bioimpedanceLogs: BioimpedanceRow[];
  bloodTestLogs: BloodTestRow[];
  stravaActivities: StravaActivityRow[];
  meals: MealRow[];
}) {
  const latestWeight =
    weightLogs.length > 0
      ? `${weightLogs[0].weight_kg} kg`
      : weightKg.trim()
        ? `${weightKg.trim()} kg`
        : null;

  const profileFields = [
    weightKg,
    heightCm,
    age,
    gender,
    goal,
  ];

  const completedProfileFields = profileFields.filter(
    (value) => value.trim().length > 0
  ).length;

  const profileScore = profileId
    ? Math.round(
        (completedProfileFields / profileFields.length) * 20
      )
    : 0;

  const trainingScore =
    stravaActivities.length > 0 ? 30 : 0;

  const bodyScore =
    (latestWeight ? 10 : 0) +
    (bioimpedanceLogs.length > 0 ? 5 : 0);

  const healthScore =
    (bloodTestLogs.length > 0 ? 12 : 0) +
    (bioimpedanceLogs.length > 0 ? 8 : 0);

  const nutritionScore =
    meals.length >= 7
      ? 15
      : meals.length > 0
        ? 8
        : 0;

  const dataQuality = Math.min(
    100,
    profileScore +
      trainingScore +
      bodyScore +
      healthScore +
      nutritionScore
  );

  const qualityLabel =
    dataQuality >= 85
      ? "Excelente"
      : dataQuality >= 65
        ? "Muito boa"
        : dataQuality >= 40
          ? "Em desenvolvimento"
          : "Precisa de mais dados";

  const examCount =
    bloodTestLogs.length + bioimpedanceLogs.length;

  const latestActivity = stravaActivities[0] ?? null;

  const latestActivityDescription = latestActivity
    ? [
        latestActivity.name?.trim() ||
          latestActivity.sport_type?.trim() ||
          latestActivity.type?.trim() ||
          "Treino recente",
        latestActivity.distance
          ? `${(latestActivity.distance / 1000).toFixed(1)} km`
          : null,
        latestActivity.moving_time
          ? `${Math.round(
              latestActivity.moving_time / 60
            )} min`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  const sources = [
    {
      title: "Perfil do atleta",
      status:
        completedProfileFields >= 4
          ? "Completo"
          : `${completedProfileFields} de ${profileFields.length}`,
      description:
        completedProfileFields >= 4
          ? "Objetivo e principais informações físicas disponíveis para personalização."
          : "Complete objetivo, peso, altura, idade e gênero para melhorar as recomendações.",
      available: completedProfileFields >= 4,
      href: "/performance-ai/profile",
      action: profileId
        ? "Abrir perfil"
        : "Completar perfil",
    },
    {
      title: "Treinamentos",
      status:
        stravaActivities.length > 0
          ? `${stravaActivities.length} atividades`
          : "Não sincronizado",
      description: latestActivityDescription
        ? `Último treino: ${latestActivityDescription}.`
        : "Conecte ou sincronize seus aplicativos esportivos para o Coach analisar volume, intensidade e evolução.",
      available: stravaActivities.length > 0,
      href: "/performance-ai/training",
      action:
        stravaActivities.length > 0
          ? "Ver treinamentos"
          : "Conectar ou sincronizar",
    },
    {
      title: "Corpo",
      status: latestWeight
        ? "Dados disponíveis"
        : "Sem peso",
      description: latestWeight
        ? `Último peso: ${latestWeight}. ${bioimpedanceLogs.length} avaliação${bioimpedanceLogs.length === 1 ? "" : "ões"} corporal${bioimpedanceLogs.length === 1 ? "" : "es"} disponível${bioimpedanceLogs.length === 1 ? "" : "is"}.`
        : "Registre peso e composição corporal para acompanhar mudanças ao longo do treinamento.",
      available: Boolean(latestWeight),
      href: "/performance-ai/profile",
      action: latestWeight
        ? "Ver dados corporais"
        : "Registrar peso",
    },
    {
      title: "Saúde",
      status:
        examCount > 0
          ? `${examCount} registros`
          : "Sem registros",
      description:
        examCount > 0
          ? `${bloodTestLogs.length} exame${bloodTestLogs.length === 1 ? "" : "s"} de sangue e ${bioimpedanceLogs.length} avaliação${bioimpedanceLogs.length === 1 ? "" : "ões"} corporal${bioimpedanceLogs.length === 1 ? "" : "es"}.`
          : "Adicione exames e avaliações corporais para contextualizar recuperação e desempenho.",
      available: examCount > 0,
      href: "/performance-ai/profile",
      action:
        examCount > 0
          ? "Ver dados de saúde"
          : "Adicionar dados",
    },
    {
      title: "Nutrição",
      status:
        meals.length > 0
          ? `${meals.length} registros`
          : "Sem registros",
      description:
        meals.length > 0
          ? `${meals.length} refeição${meals.length === 1 ? "" : "ões"} recente${meals.length === 1 ? "" : "s"} disponível${meals.length === 1 ? "" : "is"} para análise de energia e recuperação.`
          : "Registre refeições para o Coach relacionar alimentação, energia, treino e recuperação.",
      available: meals.length > 0,
      href: "/performance-ai/nutrition",
      action:
        meals.length > 0
          ? "Abrir nutrição"
          : "Registrar refeição",
    },
  ];

  return (
    <section
      style={{
        width: "100%",
        background: "#101010",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        borderBottom:
          "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          width: "min(100%, 1120px)",
          margin: "0 auto",
          padding:
            "clamp(52px, 8vw, 88px) clamp(20px, 5vw, 64px)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 310px), 1fr))",
            gap: "clamp(32px, 7vw, 80px)",
            alignItems: "end",
          }}
        >
          <div style={{ maxWidth: 700 }}>
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
              Centro de performance
            </div>

            <h2
              style={{
                margin: "12px 0 0",
                color: "#ffffff",
                fontSize: "clamp(30px, 5vw, 48px)",
                fontWeight: 780,
                lineHeight: 1.05,
                letterSpacing: "-0.035em",
              }}
            >
              Fontes de dados do Coach
            </h2>

            <p
              style={{
                margin: "18px 0 0",
                maxWidth: 680,
                color: "#a1a1aa",
                fontSize: "clamp(15px, 2vw, 17px)",
                lineHeight: 1.75,
              }}
            >
              Quanto mais completos e atuais forem seus
              dados, mais personalizadas serão as análises
              e recomendações do Coach.
            </p>
          </div>

          <div
            style={{
              padding: "22px 0 4px",
              borderTop:
                "1px solid rgba(255,255,255,0.14)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 20,
              }}
            >
              <div>
                <div
                  style={{
                    color: "#8f8f98",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    lineHeight: 1.4,
                    textTransform: "uppercase",
                  }}
                >
                  Qualidade dos dados
                </div>

                <div
                  style={{
                    marginTop: 8,
                    color: "#ffffff",
                    fontSize:
                      "clamp(22px, 4vw, 32px)",
                    fontWeight: 780,
                    letterSpacing: "-0.035em",
                  }}
                >
                  {qualityLabel}
                </div>
              </div>

              <div
                style={{
                  color: "#fff1a8",
                  fontSize:
                    "clamp(32px, 6vw, 54px)",
                  fontWeight: 760,
                  lineHeight: 0.95,
                  letterSpacing: "-0.055em",
                }}
              >
                {dataQuality}%
              </div>
            </div>

            <div
              style={{
                marginTop: 18,
                height: 4,
                overflow: "hidden",
                background:
                  "rgba(255,255,255,0.1)",
              }}
            >
              <div
                style={{
                  width: `${dataQuality}%`,
                  height: "100%",
                  background: "#fff1a8",
                  transition: "width 300ms ease",
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "clamp(38px, 6vw, 58px)",
            borderTop:
              "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {sources.map((source, index) => (
            <div
              key={source.title}
              style={{
                padding:
                  "clamp(24px, 4vw, 34px) 0",
                borderBottom:
                  index === sources.length - 1
                    ? "none"
                    : "1px solid rgba(255,255,255,0.09)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 24,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                    flex: "1 1 480px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: source.available
                          ? "#fff1a8"
                          : "#5f5f67",
                        boxShadow: source.available
                          ? "0 0 14px rgba(255,241,168,0.35)"
                          : "none",
                      }}
                    />

                    <div
                      style={{
                        color: "#f4f4f5",
                        fontSize:
                          "clamp(17px, 2.5vw, 20px)",
                        fontWeight: 720,
                        lineHeight: 1.35,
                      }}
                    >
                      {source.title}
                    </div>

                    <div
                      style={{
                        color: source.available
                          ? "#fff1a8"
                          : "#8f8f98",
                        fontSize: 10,
                        fontWeight: 800,
                        lineHeight: 1.4,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {source.status}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 9,
                      maxWidth: 720,
                      color: "#85858e",
                      fontSize: 14,
                      lineHeight: 1.7,
                    }}
                  >
                    {source.description}
                  </div>
                </div>

                <a
                  href={source.href}
                  style={{
                    color: "#fff1a8",
                    fontSize: 13,
                    fontWeight: 750,
                    lineHeight: 1.4,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {source.action} →
                </a>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 30,
            paddingLeft: 16,
            borderLeft:
              "2px solid rgba(255,241,168,0.68)",
            color: "#8f8f98",
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          O Coach usa essas informações exclusivamente
          para contextualizar treinamento, performance,
          preparação para provas, recuperação e alimentação
          relacionada ao exercício.
        </div>
      </div>
    </section>
  );
}
type CoachConversationMessage = {
  id: string;
  role: "user" | "coach";
  content: string;
};

function CoachConversation({
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
      style={{
        width: "100%",
        background: "#050505",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          width: "min(100%, 1120px)",
          margin: "0 auto",
          padding:
            "clamp(58px, 9vw, 104px) clamp(20px, 5vw, 64px) clamp(90px, 12vw, 140px)",
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
export default function PerformanceAIPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser, []);


  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingMeal, setAddingMeal] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [goal, setGoal] = useState("");
  const [healthNotes, setHealthNotes] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [goalType, setGoalType] = useState("");
  const [goalPriority, setGoalPriority] = useState("");
  const [mealText, setMealText] = useState("");

  const [mealDate, setMealDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [mealTime, setMealTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [message, setMessage] = useState<string | null>(null);

  const [bloodTestFile, setBloodTestFile] = useState<File | null>(null);
  const [bloodTestNotes, setBloodTestNotes] = useState("");
  const [uploadingBloodTest, setUploadingBloodTest] = useState(false);
  const [bloodExamDate, setBloodExamDate] = useState(new Date().toISOString().split("T")[0]);
  const [bloodHemoglobin, setBloodHemoglobin] = useState("");
  const [bloodFerritin, setBloodFerritin] = useState("");
  const [bloodVitaminD, setBloodVitaminD] = useState("");
  const [bloodGlucose, setBloodGlucose] = useState("");
  const [bloodTotalCholesterol, setBloodTotalCholesterol] = useState("");
  const [bloodHdl, setBloodHdl] = useState("");
  const [bloodLdl, setBloodLdl] = useState("");
  const [bloodTriglycerides, setBloodTriglycerides] = useState("");
  const [bloodTsh, setBloodTsh] = useState("");
  const [bloodCreatinine, setBloodCreatinine] = useState("");

  const [bioimpedanceFile, setBioimpedanceFile] = useState<File | null>(null);
  const [bioimpedanceNotes, setBioimpedanceNotes] = useState("");
  const [uploadingBioimpedance, setUploadingBioimpedance] = useState(false);
  const [bioAssessmentDate, setBioAssessmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [bioWeightKg, setBioWeightKg] = useState("");
  const [bioBodyFat, setBioBodyFat] = useState("");
  const [bioMuscleMass, setBioMuscleMass] = useState("");
  const [bioVisceralFat, setBioVisceralFat] = useState("");
  const [bioBodyWater, setBioBodyWater] = useState("");
  const [bioBmr, setBioBmr] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [meals, setMeals] = useState<MealRow[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLogRow[]>([]);
  const [bioimpedanceLogs, setBioimpedanceLogs] = useState<BioimpedanceRow[]>([]);
  const [bloodTestLogs, setBloodTestLogs] = useState<BloodTestRow[]>([]);
  const [stravaActivities, setStravaActivities] = useState<StravaActivityRow[]>([]);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [range, setRange] = useState<RangeKey>("7d");

  useEffect(() => {
    const loadPage = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user ?? null;

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("performance_ai_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle<ProfileRow>();

      if (profile) {
        setProfileId(profile.id);
        setWeightKg(profile.weight_kg?.toString() ?? "");
        setHeightCm(profile.height_cm?.toString() ?? "");
        setAge(profile.age?.toString() ?? "");
        setGender(profile.gender ?? "");
        setGoal(
          profile.goal && ["performance", "weight_loss", "conditioning", "maintenance"].includes(profile.goal)
            ? ""
            : profile.goal ?? ""
        );
        setHealthNotes(profile.health_notes ?? "");
        setGoalDate(profile.goal_date ?? "");
        setGoalType(profile.goal_type ?? "");
        setGoalPriority(profile.goal_priority ?? "");
      }

      const { data: mealsData } = await supabase
        .from("performance_ai_meals")
        .select("id, meal_text, eaten_at, meal_type, protein_level, quality_level, ai_notes")
        .eq("user_id", user.id)
        .order("eaten_at", { ascending: false })
        .limit(10);

      setMeals((mealsData ?? []) as MealRow[]);

      const { data: weightData } = await supabase
        .from("performance_ai_weight_logs")
        .select("id, weight_kg, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setWeightLogs((weightData ?? []) as WeightLogRow[]);


      const { data: bioimpedanceData } = await supabase
        .from("performance_ai_bioimpedance")
        .select("id, assessment_date, weight_kg, body_fat_percent, muscle_mass_kg, visceral_fat, body_water_percent, bmr, notes, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setBioimpedanceLogs((bioimpedanceData ?? []) as BioimpedanceRow[]);

      const { data: bloodTestData } = await supabase
        .from("performance_ai_blood_tests")
        .select("id, exam_date, hemoglobin, ferritin, vitamin_d, glucose, total_cholesterol, hdl, ldl, triglycerides, tsh, creatinine, notes, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setBloodTestLogs((bloodTestData ?? []) as BloodTestRow[]);

      const { data: tokenRow } = await supabase
        .from("strava_tokens")
        .select("athlete_id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tokenRow?.athlete_id) {
        setStravaConnected(true);

        const { data: activitiesData } = await supabase
          .from("strava_activities")
          .select("id, athlete_id, name, type, sport_type, start_date, distance, moving_time, average_heartrate, max_heartrate")
          .eq("athlete_id", tokenRow.athlete_id)
          .order("start_date", { ascending: false })
          .limit(20);

        setStravaActivities((activitiesData ?? []) as StravaActivityRow[]);
      }

      
      const { data: latestAI } = await supabase
        .from("performance_ai_ai_results")
        .select("analysis")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestAI?.analysis) {
        setAiResult(latestAI.analysis);
      }
      setLoading(false);
    };

    loadPage();
  }, [router, supabase]);

  const handleSync = async () => {
    try {
      setMessage(null);
      setSyncing(true);

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        console.error("Erro ao pegar sessão (sync):", sessionErr);
        setMessage("Erro ao autenticar para sincronizar. Faça login novamente.");
        setSyncing(false);
        return;
      }

      const accessToken = sessionData.session?.access_token ?? null;
      if (!accessToken) {
        setMessage("Você precisa estar logado para sincronizar.");
        setSyncing(false);
        return;
      }

      const res = await fetch("/api/strava/sync", {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Sync falhou:", { status: res.status, statusText: res.statusText, json });
        setMessage(
          (json?.message as string) ?? "Falha ao sincronizar com o Strava. Tente novamente."
        );
        setSyncing(false);
        return;
      }

      setMessage(
        typeof json?.fetched === "number"
          ? `Sincronizado: ${json.fetched} atividades verificadas. Recarregando...`
          : "Sincronizado. Recarregando..."
      );

      window.location.reload();
    } catch (e) {
      console.error("Erro inesperado no sync:", e);
      setMessage("Erro inesperado ao sincronizar. Tente novamente.");
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    setMessage(null);

    const payload = {
      user_id: userId,
      weight_kg: weightKg ? Number(weightKg) : null,
      height_cm: heightCm ? Number(heightCm) : null,
      age: age ? Number(age) : null,
      gender: gender || null,
      goal: goal || null,
      health_notes: healthNotes || null,
      goal_date: goalDate || null,
      goal_type: goalType || null,
      goal_priority: goalPriority || null,
      updated_at: new Date().toISOString(),
    };

    if (profileId) {
      const { error } = await supabase
        .from("performance_ai_profiles")
        .update(payload)
        .eq("id", profileId);

      setMessage(error ? error.message : "Perfil salvo com sucesso.");
    } else {
      const { data, error } = await supabase
        .from("performance_ai_profiles")
        .insert(payload)
        .select("id")
        .single();

      if (!error && data?.id) setProfileId(data.id);
      setMessage(error ? error.message : "Perfil criado com sucesso.");
    }

    setSaving(false);
  };

  const handleAddWeight = async () => {
    if (!userId || !weightKg.trim()) return;

    setSavingWeight(true);
    setMessage(null);

    const weightNumber = Number(weightKg);

    if (Number.isNaN(weightNumber) || weightNumber <= 0) {
      setMessage("Digite um peso válido.");
      setSavingWeight(false);
      return;
    }

    const { data, error } = await supabase
      .from("performance_ai_weight_logs")
      .insert({
        user_id: userId,
        weight_kg: weightNumber,
      })
      .select("id, weight_kg, created_at")
      .single();

    if (!error && data) {
      setWeightLogs((prev) => [data as WeightLogRow, ...prev].slice(0, 10));
      setMessage("Peso registrado com sucesso.");
    } else {
      setMessage(error?.message ?? "Erro ao registrar peso.");
    }

    setSavingWeight(false);
  };

  
  
  const handleAnalyzeWithAI = async () => {
    if (!userId) return;

    setAiLoading(true);
    setMessage(null);
    setAiResult(null);

    const { data: bloodTests } = await supabase
      .from("performance_ai_blood_tests")
      .select("file_url, notes, ai_summary, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    const payload = {
      profile: {
        weightKg,
        heightCm,
        age,
        gender,
        goal,
        healthNotes,
      },
      training: {
        activities: stravaActivities.slice(0, 30),
        totalActivities: weeklyActivitiesCount,
        totalDistanceKm: weeklyDistanceKm,
        totalMovingTimeSeconds: weeklyMovingTime,
        avgHeartRate,
        maxHeartRate,
      },
      nutrition: {
        meals: meals.slice(0, 20),
      },
      weightHistory: weightLogs.slice(0, 10),
      bloodTestsStructured: bloodTestLogs.slice(0, 5),
      bioimpedance: bioimpedanceLogs.slice(0, 5),
      bloodTests: bloodTests ?? [],
    };

    const res = await fetch("/api/performance-ai/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      setMessage(json?.error ?? "Erro ao analisar com IA.");
      setAiLoading(false);
      return;
    }

        const analysisData = json?.analysis ?? null;

    setAiResult(analysisData);

    if (analysisData && userId) {
      await supabase
        .from("performance_ai_ai_results")
        .insert({
          user_id: userId,
          analysis: analysisData,
        });
    }
    setAiLoading(false);
  };
  const handleSaveBloodTest = async () => {
    if (!userId) return;

    setUploadingBloodTest(true);
    setMessage(null);

    const { data, error } = await supabase
      .from("performance_ai_blood_tests")
      .insert({
        user_id: userId,
        profile_id: profileId,
        exam_date: bloodExamDate || null,
        hemoglobin: bloodHemoglobin ? Number(bloodHemoglobin) : null,
        ferritin: bloodFerritin ? Number(bloodFerritin) : null,
        vitamin_d: bloodVitaminD ? Number(bloodVitaminD) : null,
        glucose: bloodGlucose ? Number(bloodGlucose) : null,
        total_cholesterol: bloodTotalCholesterol ? Number(bloodTotalCholesterol) : null,
        hdl: bloodHdl ? Number(bloodHdl) : null,
        ldl: bloodLdl ? Number(bloodLdl) : null,
        triglycerides: bloodTriglycerides ? Number(bloodTriglycerides) : null,
        tsh: bloodTsh ? Number(bloodTsh) : null,
        creatinine: bloodCreatinine ? Number(bloodCreatinine) : null,
        notes: bloodTestNotes || null,
      })
      .select("id, exam_date, hemoglobin, ferritin, vitamin_d, glucose, total_cholesterol, hdl, ldl, triglycerides, tsh, creatinine, notes, created_at")
      .single();

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Exame de sangue salvo com sucesso.");
      if (data) {
        setBloodTestLogs((prev) => [data as BloodTestRow, ...prev].slice(0, 5));
      }
      setBloodExamDate(new Date().toISOString().split("T")[0]);
      setBloodHemoglobin("");
      setBloodFerritin("");
      setBloodVitaminD("");
      setBloodGlucose("");
      setBloodTotalCholesterol("");
      setBloodHdl("");
      setBloodLdl("");
      setBloodTriglycerides("");
      setBloodTsh("");
      setBloodCreatinine("");
      setBloodTestNotes("");
    }

    setUploadingBloodTest(false);
  };
  const handleSaveBioimpedance = async () => {
    if (!userId) return;

    setUploadingBioimpedance(true);
    setMessage(null);

    const { data, error } = await supabase
      .from("performance_ai_bioimpedance")
      .insert({
        user_id: userId,
        profile_id: profileId,
        assessment_date: bioAssessmentDate || null,
        weight_kg: bioWeightKg ? Number(bioWeightKg) : null,
        body_fat_percent: bioBodyFat ? Number(bioBodyFat) : null,
        muscle_mass_kg: bioMuscleMass ? Number(bioMuscleMass) : null,
        visceral_fat: bioVisceralFat ? Number(bioVisceralFat) : null,
        body_water_percent: bioBodyWater ? Number(bioBodyWater) : null,
        bmr: bioBmr ? Number(bioBmr) : null,
        notes: bioimpedanceNotes || null,
      })
      .select("id, assessment_date, weight_kg, body_fat_percent, muscle_mass_kg, visceral_fat, body_water_percent, bmr, notes, created_at")
      .single();

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Bioimpedância salva com sucesso.");
      if (data) {
        setBioimpedanceLogs((prev) => [data as BioimpedanceRow, ...prev].slice(0, 5));
      }

      setBioAssessmentDate(new Date().toISOString().split("T")[0]);
      setBioWeightKg("");
      setBioBodyFat("");
      setBioMuscleMass("");
      setBioVisceralFat("");
      setBioBodyWater("");
      setBioBmr("");
      setBioimpedanceNotes("");
    }

    setUploadingBioimpedance(false);
  };
  const handleDeleteBloodTest = async (id: string) => {
    const { error } = await supabase
      .from("performance_ai_blood_tests")
      .delete()
      .eq("id", id);

    if (!error) {
      setBloodTestLogs((prev) => prev.filter((item) => item.id !== id));
      setMessage("Exame removido.");
    } else {
      setMessage(error.message);
    }
  };

  const handleDeleteBioimpedance = async (id: string) => {
    const { error } = await supabase
      .from("performance_ai_bioimpedance")
      .delete()
      .eq("id", id);

    if (!error) {
      setBioimpedanceLogs((prev) => prev.filter((item) => item.id !== id));
      setMessage("Bioimpedância removida.");
    } else {
      setMessage(error.message);
    }
  };

  const handleDeleteWeight = async (id: string) => {
    const { error } = await supabase
      .from("performance_ai_weight_logs")
      .delete()
      .eq("id", id);

    if (!error) {
      setWeightLogs((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleAddMeal = async () => {
    if (!userId || !mealText.trim()) return;

    setAddingMeal(true);
    setMessage(null);

    const mealAnalysis = classifyMeal(mealText.trim());

    const { data, error } = await supabase
      .from("performance_ai_meals")
      .insert({
        user_id: userId,
        profile_id: profileId,
        meal_text: mealText.trim(),
        eaten_at: `${mealDate}T${mealTime}:00`,
        ...mealAnalysis,
      })
      .select("id, meal_text, eaten_at, meal_type, protein_level, quality_level, ai_notes")
      .single();

    if (!error && data) {
      setMeals((prev) => [data as MealRow, ...prev].slice(0, 10));
      setMealText("");
      setMealDate(new Date().toISOString().split("T")[0]);
      setMealTime(new Date().toTimeString().slice(0, 5));
      setMessage("Refeição adicionada.");
    } else {
      setMessage(error?.message ?? "Erro ao adicionar refeição.");
    }

    setAddingMeal(false);
  };

  const now = new Date();

  const filteredActivities = stravaActivities.filter((item) =>
    isInRange(item.start_date, range, now)
  );

  const weeklyActivitiesCount = filteredActivities.length;
  const weeklyDistanceKm = filteredActivities.reduce((sum, item) => sum + ((item.distance ?? 0) / 1000), 0);
  const weeklyMovingTime = filteredActivities.reduce((sum, item) => sum + (item.moving_time ?? 0), 0);

  const activitiesWithHr = filteredActivities.filter(
    (item) => item.average_heartrate != null || item.max_heartrate != null
  );

  const avgHeartRate =
    activitiesWithHr.length > 0
      ? Math.round(
          activitiesWithHr.reduce((sum, item) => sum + (item.average_heartrate ?? 0), 0) /
            activitiesWithHr.length
        )
      : null;

  const maxHeartRate =
    activitiesWithHr.length > 0
      ? Math.round(Math.max(...activitiesWithHr.map((item) => item.max_heartrate ?? 0)))
      : null;

  const lastActivity = filteredActivities.length > 0 ? filteredActivities[0] : null;

      const coachInsight = getCoachInsight({
    meals,
    weeklyActivitiesCount,
    weeklyDistanceKm,
    weeklyMovingTime,
    avgHeartRate,
    weightLogs,
  });

  const trainingCoachInsight = getTrainingCoachInsight({
    weeklyActivitiesCount,
    weeklyDistanceKm,
    weeklyMovingTime,
    avgHeartRate,
    weightLogs,
  });

  const nutritionCoachInsight = getNutritionCoachInsight({
    meals,
    weeklyActivitiesCount,
    weeklyDistanceKm,
    weeklyMovingTime,

  });


  const chartActivities = [...filteredActivities]
    .slice(0, 12)
    .reverse();

  const chartMaxKm = Math.max(
    1,
    ...chartActivities.map((item) => (item.distance ?? 0) / 1000)
  );

  const chartWidth = 900;
  const chartHeight = 260;
  const chartPaddingX = 24;
  const chartPaddingTop = 20;
  const chartPaddingBottom = 34;

  const linePoints = chartActivities.map((activity, index) => {
    const km = (activity.distance ?? 0) / 1000;
    const usableWidth = chartWidth - chartPaddingX * 2;
    const usableHeight = chartHeight - chartPaddingTop - chartPaddingBottom;

    const x =
      chartActivities.length <= 1
        ? chartWidth / 2
        : chartPaddingX + (index * usableWidth) / (chartActivities.length - 1);

    const y =
      chartHeight - chartPaddingBottom - (km / chartMaxKm) * usableHeight;

    return {
      x,
      y,
      km,
      label: formatShortDate(activity.start_date),
      title: activity.name ?? activity.type ?? activity.sport_type ?? "Atividade",
    };
  });

  const linePath =
    linePoints.length > 0
      ? linePoints
          .map((point, index) =>
            `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
          )
          .join(" ")
      : "";

  const currentCoachWeight =
    weightLogs.length > 0 ? Number(weightLogs[0].weight_kg) : null;

  const previousCoachWeight =
    weightLogs.length > 1 ? Number(weightLogs[1].weight_kg) : null;

  const coachWeightDifference =
    currentCoachWeight != null && previousCoachWeight != null
      ? Number((currentCoachWeight - previousCoachWeight).toFixed(1))
      : null;

  const trainingScore = Math.max(
    0,
    Math.min(
      100,
      (stravaConnected ? 40 : 20) +
        Math.min(weeklyActivitiesCount * 10, 30) +
        Math.min(weeklyDistanceKm, 25) +
        (avgHeartRate && avgHeartRate >= 165 ? -5 : 5)
    )
  );

  const lowQualityMealCount = meals.filter(
    (meal) => meal.quality_level === "baixa"
  ).length;

  const highProteinMealCount = meals.filter(
    (meal) => meal.protein_level === "alta"
  ).length;

  const nutritionScore = Math.max(
    0,
    Math.min(
      100,
      35 +
        Math.min(meals.length * 7, 35) +
        Math.min(highProteinMealCount * 8, 24) -
        lowQualityMealCount * 10
    )
  );

  const weightScore =
    currentCoachWeight == null
      ? 45
      : coachWeightDifference == null
        ? 70
        : Math.abs(coachWeightDifference) < 0.3
          ? 90
          : Math.abs(coachWeightDifference) <= 0.7
            ? 80
            : Math.abs(coachWeightDifference) <= 1
              ? 65
              : 50;

  const healthScore = Math.min(
    100,
    40 +
      (bloodTestLogs.length > 0 ? 20 : 0) +
      (bioimpedanceLogs.length > 0 ? 20 : 0) +
      (healthNotes.trim() ? 10 : 0) +
      (age.trim() && heightCm.trim() ? 10 : 0)
  );

  const goalScore = Math.min(
    100,
    40 +
      (goal.trim() ? 20 : 0) +
      (goalType.trim() ? 15 : 0) +
      (goalDate.trim() ? 15 : 0) +
      (goalPriority.trim() ? 10 : 0)
  );

  const performanceScore = Math.round(
    trainingScore * 0.32 +
      nutritionScore * 0.23 +
      weightScore * 0.15 +
      healthScore * 0.15 +
      goalScore * 0.15
  );

  const performanceStatus =
    performanceScore >= 85
      ? "Excelente"
      : performanceScore >= 70
        ? "Muito bom"
        : performanceScore >= 55
          ? "Em evolução"
          : "Precisa de atenção";

  const statusDescription =
    performanceScore >= 85
      ? "Seus registros mostram uma rotina muito consistente."
      : performanceScore >= 70
        ? "Você está construindo uma boa base de desempenho."
        : performanceScore >= 55
          ? "Existem bons sinais, mas ainda há espaço para maior consistência."
          : "Complete seus dados e retome a regularidade para receber orientações melhores.";

  const coachCards = [
    {
      title: "Treinamento",
      score: Math.round(trainingScore),
      text: trainingCoachInsight,
      detail: `${weeklyActivitiesCount} atividades · ${weeklyDistanceKm.toFixed(1)} km · ${formatDuration(weeklyMovingTime)}`,
    },
    {
      title: "Nutrição",
      score: Math.round(nutritionScore),
      text: nutritionCoachInsight,
      detail: `${meals.length} refeições registradas · ${highProteinMealCount} com proteína alta`,
    },
    {
      title: "Peso e composição",
      score: Math.round(weightScore),
      text:
        currentCoachWeight == null
          ? "Registre seu peso para acompanhar sua evolução."
          : coachWeightDifference == null
            ? `Peso atual registrado: ${currentCoachWeight.toFixed(1)} kg.`
            : `Peso atual: ${currentCoachWeight.toFixed(1)} kg · variação: ${coachWeightDifference > 0 ? "+" : ""}${coachWeightDifference.toFixed(1)} kg.`,
      detail:
        bioimpedanceLogs.length > 0
          ? "Bioimpedância disponível para análise."
          : "Nenhuma bioimpedância registrada.",
    },
    {
      title: "Saúde",
      score: Math.round(healthScore),
      text:
        bloodTestLogs.length > 0 || bioimpedanceLogs.length > 0
          ? "Seus dados de saúde estão disponíveis para contextualizar as recomendações."
          : "Adicione exames ou bioimpedância para ampliar a análise.",
      detail: `${bloodTestLogs.length} exames · ${bioimpedanceLogs.length} avaliações corporais`,
    },
    {
      title: "Objetivo",
      score: Math.round(goalScore),
      text:
        goal.trim() || goalType.trim()
          ? goal.trim() || goalType.trim()
          : "Defina um objetivo para tornar as recomendações mais específicas.",
      detail: goalDate
        ? `Data da meta: ${new Date(`${goalDate}T12:00:00`).toLocaleDateString("pt-BR")}`
        : "Nenhuma data definida.",
    },
  ];
  if (loading) {
    return (
      <main style={pageStyle}>
        Carregando...
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={{ marginBottom: 18 }}>
        <BackButton />
      </div>

      {message ? <div style={globalMessageStyle}>{message}</div> : null}

      <section
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          display: "grid",
          gap: 0,
        }}
      >
        <CoachHero
          performanceScore={performanceScore}
          performanceStatus={performanceStatus}
          statusDescription={statusDescription}
        />

        <CoachRecommendation insight={coachInsight} />

        <CoachCards cards={coachCards} />

        <CoachDataSources
          profileId={profileId}
          weightKg={weightKg}
          heightCm={heightCm}
          age={age}
          gender={gender}
          goal={goal}
          weightLogs={weightLogs}
          bioimpedanceLogs={bioimpedanceLogs}
          bloodTestLogs={bloodTestLogs}
          stravaActivities={stravaActivities}
          meals={meals}
        />

        <CoachPlan
          aiResult={aiResult}
          aiLoading={aiLoading}
          onAnalyze={handleAnalyzeWithAI}
        />

        <CoachConversation
          profile={{
            weightKg,
            heightCm,
            age,
            gender,
            goal,
            goalDate,
            goalType,
            goalPriority,
            healthNotes,
          }}
          training={{
            activities: stravaActivities,
            stravaConnected,
          }}
          meals={meals}
          weightLogs={weightLogs}
          bioimpedanceLogs={bioimpedanceLogs}
          bloodTestLogs={bloodTestLogs}
          latestAnalysis={aiResult}
        />
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 50% -120px, rgba(212,175,55,0.13) 0%, rgba(212,175,55,0.035) 24%, rgba(9,9,11,0) 48%), linear-gradient(180deg, #09090b 0%, #050506 55%, #000000 100%)",
  padding: "20px 16px 110px",
  fontFamily: "Montserrat, sans-serif",
  color: "#f4f4f5",
};

const globalMessageStyle: React.CSSProperties = {
  maxWidth: 1080,
  margin: "0 auto 16px",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(212,175,55,0.42)",
  background:
    "linear-gradient(145deg, rgba(39,39,42,0.96) 0%, rgba(15,15,17,0.98) 100%)",
  boxShadow:
    "0 14px 30px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.06)",
  color: "#f5e6b3",
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 700,
};















