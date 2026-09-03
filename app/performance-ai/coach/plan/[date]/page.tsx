// app/performance-ai/coach/plan/[date]/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import CoachAnalysisCard from "@/components/performance-ai/CoachAnalysisCard";
import CoachDayNavigator from "@/components/performance-ai/CoachDayNavigator";
import CoachNutritionCard from "@/components/performance-ai/CoachNutritionCard";
import CoachWorkoutCard from "@/components/performance-ai/CoachWorkoutCard";
import PerformanceAiBackButton from "@/components/performance-ai/PerformanceAiBackButton";
import PerformanceAiFloatingMenu from "@/components/performance-ai/PerformanceAiFloatingMenu";
import {
  formatMealsForCoach,
  loadMealsForDate,
  type CoachMealRow,
} from "@/lib/performance-ai/loadMealsForDate";
import {
  formatWorkoutsForCoach,
  loadWorkoutsForDate,
  type CoachWorkoutRow,
} from "@/lib/performance-ai/loadWorkoutsForDate";
import { supabaseBrowser } from "@/lib/supabase-browser";

import styles from "./page.module.css";

type DailyTraining = {
  modality: string;
  duration: string;
  intensity: string;
  intensityExplanation: string;
  details: string;
  goal: string;
  caution: string;
};

type DailyNutrition = {
  dailyFocus: string;
  breakfast: string;
  lunch: string;
  preWorkout: string;
  postWorkout: string;
  dinner: string;
  hydration: string;
  proteinTarget: string;
  carbTarget: string;
};

type DailyPlanRow = {
  id: string;
  plan_date: string;
  training: DailyTraining;
  nutrition: DailyNutrition;
  coach_analysis: string | null;
};

function parseRouteDate(
  value: string
): Date | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date =
    new Date(year, month - 1, day);

  const isValid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return isValid ? date : null;
}

function formatDateForRoute(
  date: Date
): string {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function changeDateByDays(
  date: Date,
  amount: number
): Date {
  const nextDate = new Date(date);

  nextDate.setDate(
    nextDate.getDate() + amount
  );

  return nextDate;
}

function createToday(): Date {
  const today = new Date();

  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
}

function formatTrainingTitle(
  training: DailyTraining
): string {
  return [
    training.modality,
    training.duration,
  ]
    .filter(Boolean)
    .join(" · ");
}

function formatTrainingDetails(
  training: DailyTraining
): string {
  return [
    training.intensity
      ? `Intensidade: ${training.intensity}`
      : null,
    training.intensityExplanation || null,
    training.details || null,
    training.goal
      ? `Objetivo: ${training.goal}`
      : null,
    training.caution
      ? `Atenção: ${training.caution}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function formatNutritionPlan(
  nutrition: DailyNutrition
): string {
  return [
    nutrition.dailyFocus
      ? `Foco do dia: ${nutrition.dailyFocus}`
      : null,
    nutrition.breakfast
      ? `Café da manhã: ${nutrition.breakfast}`
      : null,
    nutrition.lunch
      ? `Almoço: ${nutrition.lunch}`
      : null,
    nutrition.preWorkout
      ? `Pré-treino: ${nutrition.preWorkout}`
      : null,
    nutrition.postWorkout
      ? `Pós-treino: ${nutrition.postWorkout}`
      : null,
    nutrition.dinner
      ? `Jantar: ${nutrition.dinner}`
      : null,
    nutrition.hydration
      ? `Hidratação: ${nutrition.hydration}`
      : null,
    nutrition.proteinTarget
      ? `Proteína: ${nutrition.proteinTarget}`
      : null,
    nutrition.carbTarget
      ? `Carboidratos: ${nutrition.carbTarget}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function CoachPlanDayPage() {
  const router = useRouter();
  const params =
    useParams<{ date: string }>();

  const supabase =
    useMemo(() => supabaseBrowser, []);

  const routeDate =
    typeof params.date === "string"
      ? params.date
      : "";

  const selectedDate = useMemo(
    () => parseRouteDate(routeDate),
    [routeDate]
  );

  const [loadingMeals, setLoadingMeals] =
    useState(true);

  const [loadingWorkouts, setLoadingWorkouts] =
    useState(true);

  const [loadingPlan, setLoadingPlan] =
    useState(true);

  const [generatingPlan, setGeneratingPlan] =
    useState(false);

  const [meals, setMeals] =
    useState<CoachMealRow[]>([]);

  const [workouts, setWorkouts] =
    useState<CoachWorkoutRow[]>([]);

  const [dailyPlan, setDailyPlan] =
    useState<DailyPlanRow | null>(null);

  const [mealError, setMealError] =
    useState<string | null>(null);

  const [workoutError, setWorkoutError] =
    useState<string | null>(null);

  const [planError, setPlanError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadPageData(): Promise<void> {
      if (!selectedDate) {
        setLoadingMeals(false);
        setLoadingWorkouts(false);
        setLoadingPlan(false);
        return;
      }

      setLoadingMeals(true);
      setLoadingWorkouts(true);
      setLoadingPlan(true);

      setMealError(null);
      setWorkoutError(null);
      setPlanError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      try {
        const { data, error } =
          await supabase
            .from(
              "performance_ai_daily_plans"
            )
            .select(
              "id,plan_date,training,nutrition,coach_analysis"
            )
            .eq("user_id", user.id)
            .eq("plan_date", routeDate)
            .maybeSingle();

        if (error) {
          throw error;
        }

        setDailyPlan(
          (data as DailyPlanRow | null) ??
            null
        );
      } catch (error) {
        setDailyPlan(null);

        setPlanError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o plano deste dia."
        );
      } finally {
        setLoadingPlan(false);
      }

      try {
        const dayMeals =
          await loadMealsForDate(
            user.id,
            selectedDate
          );

        setMeals(dayMeals);
      } catch (error) {
        setMeals([]);

        setMealError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a alimentação."
        );
      } finally {
        setLoadingMeals(false);
      }

      try {
        const dayWorkouts =
          await loadWorkoutsForDate(
            user.id,
            selectedDate
          );

        setWorkouts(dayWorkouts);
      } catch (error) {
        setWorkouts([]);

        setWorkoutError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os treinos."
        );
      } finally {
        setLoadingWorkouts(false);
      }
    }

    void loadPageData();
  }, [
    routeDate,
    router,
    selectedDate,
    supabase,
  ]);

  async function generateDailyPlan():
    Promise<void> {
    if (
      !selectedDate ||
      generatingPlan
    ) {
      return;
    }

    try {
      setGeneratingPlan(true);
      setPlanError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const [
        profileResult,
        tokenResult,
        mealsResult,
      ] = await Promise.all([
        supabase
          .from("performance_ai_profiles")
          .select(
            "weight_kg,height_cm,age,gender,goal,goal_text,goal_date,goal_type,goal_priority,level,days_per_week,minutes_per_session,sports,health_notes"
          )
          .eq("user_id", user.id)
          .maybeSingle(),

        supabase
            .from("imported_activities")
            .select(
              "id,name,sport_type,device_name,start_date,distance_m,moving_time_s,elev_gain_m,avg_heartrate,max_heartrate,calories,provider,external_id"
            )
            .eq("user_id", user.id)
            .order("start_date", {
              ascending: false,
            })
            .limit(30),

        supabase
          .from("performance_ai_meals")
          .select(
            "meal_text,eaten_at,meal_type,protein_level,quality_level,ai_notes"
          )
          .eq("user_id", user.id)
          .order("eaten_at", {
            ascending: false,
          })
          .limit(20),
      ]);

      const recentActivities =
          (tokenResult.data ?? []).map((activity) => ({
            name: activity.name ?? null,
            type: activity.sport_type ?? null,
            sport_type: activity.sport_type ?? null,
            start_date: activity.start_date ?? null,
            distance:
              activity.distance_m != null
                ? Number(activity.distance_m)
                : null,
            moving_time:
              activity.moving_time_s != null
                ? Number(activity.moving_time_s)
                : null,
            average_heartrate:
              activity.avg_heartrate != null
                ? Number(activity.avg_heartrate)
                : null,
            max_heartrate:
              activity.max_heartrate != null
                ? Number(activity.max_heartrate)
                : null,
            total_elevation_gain:
              activity.elev_gain_m != null
                ? Number(activity.elev_gain_m)
                : null,
            provider: activity.provider ?? null,
            device_name: activity.device_name ?? null,
          }));

      const response = await fetch(
        "/api/performance-ai/coach/day",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            planDate: routeDate,
            athleteContext: {
              profile:
                profileResult.data ?? null,
              recentActivities,
              recentMeals:
                mealsResult.data ?? [],
            },
          }),
        }
      );

      const json =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          json?.error ??
            "Não foi possível gerar o plano dos próximos 7 dias."
        );
      }

      if (
        !Array.isArray(json?.days) ||
        json.days.length !== 7
      ) {
        throw new Error(
          "O Coach não retornou os 7 dias do plano."
        );
      }

      const now =
        new Date().toISOString();

      const rows = json.days.map(
        (day: {
          planDate: string;
          training: DailyTraining;
          nutrition: DailyNutrition;
          coachAnalysis?: string;
        }) => ({
          user_id: user.id,
          plan_date: day.planDate,
          training: day.training,
          nutrition: day.nutrition,
          coach_analysis:
            day.coachAnalysis ?? null,
          updated_at: now,
        })
      );

      const {
        data: savedPlans,
        error: saveError,
      } = await supabase
        .from(
          "performance_ai_daily_plans"
        )
        .upsert(rows, {
          onConflict:
            "user_id,plan_date",
        })
        .select(
          "id,plan_date,training,nutrition,coach_analysis"
        );

      if (saveError) {
        throw saveError;
      }

      const selectedPlan =
        (savedPlans ?? []).find(
          (plan) =>
            plan.plan_date ===
            routeDate
        ) ?? null;

      if (!selectedPlan) {
        throw new Error(
          "O plano foi gerado, mas não foi possível carregar o dia selecionado."
        );
      }

      setDailyPlan(
        selectedPlan as DailyPlanRow
      );
    } catch (error) {
      setPlanError(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o plano dos próximos 7 dias."
      );
    } finally {
      setGeneratingPlan(false);
    }
  }

  if (!selectedDate) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <PerformanceAiBackButton
            href="/performance-ai/coach/plan"
          />

          <section
            className={styles.invalidDate}
          >
            <h1
              className={styles.invalidTitle}
            >
              Data inválida
            </h1>

            <p
              className={styles.invalidText}
            >
              Não foi possível identificar a data selecionada.
            </p>

            <button
              type="button"
              className={styles.returnButton}
              onClick={() =>
                router.push(
                  "/performance-ai/coach/plan"
                )
              }
            >
              Voltar ao calendário
            </button>
          </section>
        </div>

        <PerformanceAiFloatingMenu />
      </main>
    );
  }

  const currentDate = selectedDate;
  const today = createToday();

  const selectedDateIsPast =
    currentDate.getTime() <
    today.getTime();

  const selectedDateIsFuture =
    currentDate.getTime() >
    today.getTime();

  const registeredNutrition =
    formatMealsForCoach(meals);

  const workoutSummary =
    formatWorkoutsForCoach(workouts);

  const plannedWorkout =
    dailyPlan?.training
      ? formatTrainingTitle(
          dailyPlan.training
        )
      : null;

  const plannedGoal =
    dailyPlan?.training
      ? formatTrainingDetails(
          dailyPlan.training
        )
      : null;

  const plannedNutrition =
    dailyPlan?.nutrition
      ? formatNutritionPlan(
          dailyPlan.nutrition
        )
      : null;

  function navigateToDay(
    amount: number
  ): void {
    const nextDate =
      changeDateByDays(
        currentDate,
        amount
      );

    router.push(
      `/performance-ai/coach/plan/${formatDateForRoute(
        nextDate
      )}`
    );
  }

  const canGeneratePlan =
    !selectedDateIsPast &&
    !loadingPlan &&
    !dailyPlan;

  return (
    <main className={styles.page}>
      <div
        className={styles.backgroundGlow}
      />

      <div className={styles.container}>
        <header className={styles.header}>
          <PerformanceAiBackButton
            href="/performance-ai/coach/plan"
          />

          <div className={styles.heading}>
            <p className={styles.eyebrow}>
              Meu plano
            </p>

            <h1 className={styles.title}>
              Detalhes do dia
            </h1>
          </div>
        </header>

        <CoachDayNavigator
          selectedDate={currentDate}
          onPrevious={() =>
            navigateToDay(-1)
          }
          onNext={() =>
            navigateToDay(1)
          }
        />

        {canGeneratePlan ? (
          <section
            style={{
              marginTop: 24,
              marginBottom: 30,
              padding:
                "26px 0 28px",
              borderTop:
                "1px solid rgba(255,255,255,0.09)",
              borderBottom:
                "1px solid rgba(255,255,255,0.09)",
            }}
          >
            <div
              style={{
                color: "#D4AF37",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing:
                  "0.12em",
                textTransform:
                  "uppercase",
              }}
            >
              Coach IA
            </div>

            <h2
              style={{
                margin: "9px 0 0",
                color: "#ffffff",
                fontSize: 24,
                fontWeight: 400,
                lineHeight: 1.2,
              }}
            >
              Seu próximo ciclo ainda não está planejado
            </h2>

            <p
              style={{
                maxWidth: 620,
                margin: "10px 0 0",
                color:
                  "rgba(255,255,255,0.48)",
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              O Coach pode planejar os próximos 7 dias de treino e alimentação com base no seu objetivo e nos seus dados atuais.
            </p>

            <button
              type="button"
              disabled={generatingPlan}
              onClick={() =>
                void generateDailyPlan()
              }
              style={{
                width: "100%",
                minHeight: 50,
                marginTop: 20,
                border:
                  "1px solid rgba(212,175,55,0.55)",
                borderRadius: 11,
                background:
                  generatingPlan
                    ? "rgba(212,175,55,0.10)"
                    : "#D4AF37",
                color:
                  generatingPlan
                    ? "#8d7d48"
                    : "#090909",
                fontFamily:
                  "Montserrat, sans-serif",
                fontSize: 13,
                fontWeight: 700,
                cursor:
                  generatingPlan
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {generatingPlan
                ? "Gerando 7 dias..."
                : "Gerar plano dos próximos 7 dias"}
            </button>

            {planError ? (
              <p
                style={{
                  margin:
                    "12px 0 0",
                  color: "#fca5a5",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                {planError}
              </p>
            ) : null}
          </section>
        ) : null}

        <section
          className={styles.content}
        >
          <CoachWorkoutCard
            plannedTraining={
              loadingPlan
                ? null
                : dailyPlan?.training ?? null
            }
            plannedWorkout={
              loadingPlan
                ? "Carregando planejamento..."
                : plannedWorkout
            }
            plannedGoal={
              loadingPlan
                ? null
                : plannedGoal
            }
            completedWorkout={
              loadingWorkouts
                ? "Carregando treino..."
                : workoutError
                  ? "Não foi possível carregar o treino"
                  : workoutSummary.title
            }
            completedSummary={
              loadingWorkouts
                ? null
                : workoutError
                  ? workoutError
                  : workoutSummary.summary
            }
          />

          <CoachNutritionCard
            selectedDate={currentDate}
            plannedNutritionData={
              loadingPlan
                ? null
                : dailyPlan?.nutrition ?? null
            }
            plannedNutrition={
              loadingPlan
                ? "Carregando planejamento..."
                : plannedNutrition
            }
            registeredNutrition={
              loadingMeals
                ? "Carregando refeições..."
                : mealError
                  ? mealError
                  : registeredNutrition
            }
          />

          <CoachAnalysisCard
            analysis={
              dailyPlan?.coach_analysis ??
              (selectedDateIsPast
                ? "O Coach comparará o treino e a alimentação orientados com o que foi realmente realizado neste dia."
                : selectedDateIsFuture
                  ? "O Coach explicará por que este treino e esta alimentação foram planejados."
                  : "O Coach acompanhará seus registros de hoje e indicará se algum ajuste será necessário.")
            }
          />
        </section>
      </div>

      <PerformanceAiFloatingMenu />
    </main>
  );
}




