// app/performance-ai/coach/plan/page.tsx

"use client";

import { useRouter } from "next/navigation";

import CoachMonthlyCalendar from "@/components/performance-ai/CoachMonthlyCalendar";
import PerformanceAiBackButton from "@/components/performance-ai/PerformanceAiBackButton";
import PerformanceAiFloatingMenu from "@/components/performance-ai/PerformanceAiFloatingMenu";

import styles from "./page.module.css";

function createToday(): Date {
  const today = new Date();

  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
}

function formatDateForRoute(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function CoachPlanPage() {
  const router = useRouter();

  function openSelectedDay(date: Date): void {
    const dateParameter = formatDateForRoute(date);

    router.push(`/performance-ai/coach/plan/${dateParameter}`);
  }

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} />

      <div className={styles.container}>
        <header className={styles.header}>
          <PerformanceAiBackButton href="/performance-ai/coach" />

          <div className={styles.heading}>
            <p className={styles.eyebrow}>Coach IA</p>

            <h1 className={styles.title}>Meu plano</h1>

            <p className={styles.description}>
              Escolha uma data para visualizar o treino, a alimentação e
              as orientações do Coach para aquele dia.
            </p>
          </div>
        </header>

        <CoachMonthlyCalendar
          selectedDate={createToday()}
          onSelectDate={openSelectedDay}
        />
      </div>

      <PerformanceAiFloatingMenu />
    </main>
  );
}