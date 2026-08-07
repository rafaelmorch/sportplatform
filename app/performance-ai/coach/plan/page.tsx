// app/performance-ai/coach/plan/page.tsx

"use client";

import {
  useCallback,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import CoachMonthlyCalendar, {
  type CalendarDayStatus,
} from "@/components/performance-ai/CoachMonthlyCalendar";
import PerformanceAiBackButton from "@/components/performance-ai/PerformanceAiBackButton";
import PerformanceAiFloatingMenu from "@/components/performance-ai/PerformanceAiFloatingMenu";
import { supabaseBrowser } from "@/lib/supabase-browser";

import styles from "./page.module.css";

function createToday(): Date {
  const today = new Date();

  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
}

function formatDateForRoute(
  date: Date
): string {
  const year =
    date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function localDateKeyFromIso(
  value: string
): string | null {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return formatDateForRoute(
    date
  );
}

export default function CoachPlanPage() {
  const router =
    useRouter();

  const supabase =
    useMemo(
      () => supabaseBrowser,
      []
    );

  const [
    statuses,
    setStatuses,
  ] = useState<
    Record<
      string,
      CalendarDayStatus
    >
  >({});

  function openSelectedDay(
    date: Date
  ): void {
    const dateParameter =
      formatDateForRoute(date);

    router.push(
      `/performance-ai/coach/plan/${dateParameter}`
    );
  }

  const loadMonthStatuses =
    useCallback(
      async (
        displayedMonth: Date
      ): Promise<void> => {
        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !user
        ) {
          return;
        }

        const rangeStart =
          new Date(
            displayedMonth.getFullYear(),
            displayedMonth.getMonth(),
            -7
          );

        const rangeEnd =
          new Date(
            displayedMonth.getFullYear(),
            displayedMonth.getMonth() +
              1,
            8
          );

        const startDate =
          formatDateForRoute(
            rangeStart
          );

        const endDate =
          formatDateForRoute(
            rangeEnd
          );

        const startTimestamp =
          new Date(
            rangeStart.getFullYear(),
            rangeStart.getMonth(),
            rangeStart.getDate(),
            0,
            0,
            0,
            0
          ).toISOString();

        const endTimestamp =
          new Date(
            rangeEnd.getFullYear(),
            rangeEnd.getMonth(),
            rangeEnd.getDate() + 1,
            0,
            0,
            0,
            0
          ).toISOString();

        const [
          plansResult,
          mealsResult,
        ] =
          await Promise.all([
            supabase
              .from(
                "performance_ai_daily_plans"
              )
              .select(
                "plan_date,training"
              )
              .eq(
                "user_id",
                user.id
              )
              .gte(
                "plan_date",
                startDate
              )
              .lte(
                "plan_date",
                endDate
              ),

            supabase
              .from(
                "performance_ai_meals"
              )
              .select(
                "eaten_at"
              )
              .eq(
                "user_id",
                user.id
              )
              .gte(
                "eaten_at",
                startTimestamp
              )
              .lt(
                "eaten_at",
                endTimestamp
              ),
          ]);

        const nextStatuses:
          Record<
            string,
            CalendarDayStatus
          > = {};

        for (
          const plan of
            plansResult.data ?? []
        ) {
          const dateKey =
            plan.plan_date;

          if (!dateKey) {
            continue;
          }

          nextStatuses[
            dateKey
          ] = {
            hasPlannedWorkout:
              Boolean(
                plan.training
              ),
            hasRegisteredNutrition:
              nextStatuses[
                dateKey
              ]
                ?.hasRegisteredNutrition ??
              false,
          };
        }

        for (
          const meal of
            mealsResult.data ?? []
        ) {
          const dateKey =
            localDateKeyFromIso(
              meal.eaten_at
            );

          if (!dateKey) {
            continue;
          }

          nextStatuses[
            dateKey
          ] = {
            hasPlannedWorkout:
              nextStatuses[
                dateKey
              ]
                ?.hasPlannedWorkout ??
              false,
            hasRegisteredNutrition:
              true,
          };
        }

        setStatuses(
          nextStatuses
        );
      },
      [supabase]
    );

  return (
    <main
      className={styles.page}
    >
      <div
        className={
          styles.backgroundGlow
        }
      />

      <div
        className={
          styles.container
        }
      >
        <header
          className={
            styles.header
          }
        >
          <PerformanceAiBackButton
            href="/performance-ai/performance"
          />

          <div
            className={
              styles.heading
            }
          >
            <p
              className={
                styles.eyebrow
              }
            >
              Coach IA
            </p>

            <h1
              className={
                styles.title
              }
            >
              Meu plano
            </h1>

            <p
              className={
                styles.description
              }
            >
              Escolha uma data para visualizar o treino, a alimentação e as orientações do Coach para aquele dia.
            </p>
          </div>
        </header>

        <CoachMonthlyCalendar
          selectedDate={
            createToday()
          }
          onSelectDate={
            openSelectedDay
          }
          statuses={
            statuses
          }
          onDisplayedMonthChange={
            loadMonthStatuses
          }
        />
      </div>

      <PerformanceAiFloatingMenu />
    </main>
  );
}
