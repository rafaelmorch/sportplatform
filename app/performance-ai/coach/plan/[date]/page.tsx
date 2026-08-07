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

function parseRouteDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  const isValid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return isValid ? date : null;
}

function formatDateForRoute(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function changeDateByDays(date: Date, amount: number): Date {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + amount);

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

export default function CoachPlanDayPage() {
  const router = useRouter();
  const params = useParams<{ date: string }>();

  const supabase = useMemo(() => supabaseBrowser, []);

  const routeDate =
    typeof params.date === "string" ? params.date : "";

  const selectedDate = useMemo(
    () => parseRouteDate(routeDate),
    [routeDate]
  );

  const [loadingMeals, setLoadingMeals] =
    useState(true);

  const [loadingWorkouts, setLoadingWorkouts] =
    useState(true);

  const [meals, setMeals] =
    useState<CoachMealRow[]>([]);

  const [workouts, setWorkouts] =
    useState<CoachWorkoutRow[]>([]);

  const [mealError, setMealError] =
    useState<string | null>(null);

  const [workoutError, setWorkoutError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadPageData(): Promise<void> {
      if (!selectedDate) {
        setLoadingMeals(false);
        setLoadingWorkouts(false);
        return;
      }

      setLoadingMeals(true);
      setLoadingWorkouts(true);
      setMealError(null);
      setWorkoutError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      try {
        const dayMeals = await loadMealsForDate(
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
        const dayWorkouts = await loadWorkoutsForDate(
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
  }, [router, selectedDate, supabase]);

  if (!selectedDate) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <PerformanceAiBackButton href="/performance-ai/coach/plan" />

          <section className={styles.invalidDate}>
            <h1 className={styles.invalidTitle}>
              Data inválida
            </h1>

            <p className={styles.invalidText}>
              Não foi possível identificar a data selecionada.
            </p>

            <button
              type="button"
              className={styles.returnButton}
              onClick={() =>
                router.push("/performance-ai/coach/plan")
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
    currentDate.getTime() < today.getTime();

  const selectedDateIsFuture =
    currentDate.getTime() > today.getTime();

  const registeredNutrition =
    formatMealsForCoach(meals);

  const workoutSummary =
    formatWorkoutsForCoach(workouts);

  function navigateToDay(amount: number): void {
    const nextDate =
      changeDateByDays(currentDate, amount);

    router.push(
      `/performance-ai/coach/plan/${formatDateForRoute(
        nextDate
      )}`
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} />

      <div className={styles.container}>
        <header className={styles.header}>
          <PerformanceAiBackButton href="/performance-ai/coach/plan" />

          <div className={styles.heading}>
            <p className={styles.eyebrow}>Meu plano</p>

            <h1 className={styles.title}>
              Detalhes do dia
            </h1>
          </div>
        </header>

        <CoachDayNavigator
          selectedDate={currentDate}
          onPrevious={() => navigateToDay(-1)}
          onNext={() => navigateToDay(1)}
        />

        <section className={styles.content}>
          <CoachWorkoutCard
            plannedWorkout={
              selectedDateIsFuture
                ? "Treino planejado"
                : selectedDateIsPast
                  ? "Treino orientado para este dia"
                  : "Treino planejado para hoje"
            }
            plannedGoal={
              selectedDateIsFuture
                ? "Os detalhes do planejamento aparecerão aqui."
                : "A orientação completa do treino aparecerá aqui."
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
            plannedNutrition={
              selectedDateIsFuture
                ? "A alimentação planejada para este dia aparecerá aqui."
                : "As orientações alimentares deste dia aparecerão aqui."
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
              selectedDateIsPast
                ? "O Coach comparará o treino e a alimentação orientados com o que foi realmente realizado neste dia."
                : selectedDateIsFuture
                  ? "O Coach explicará por que este treino e esta alimentação foram planejados."
                  : "O Coach acompanhará seus registros de hoje e indicará se algum ajuste será necessário."
            }
          />
        </section>
      </div>

      <PerformanceAiFloatingMenu />
    </main>
  );
}
