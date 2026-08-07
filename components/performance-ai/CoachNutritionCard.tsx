// components/performance-ai/CoachNutritionCard.tsx

"use client";

import Link from "next/link";

import CoachCard from "./CoachCard";

import styles from "./CoachNutritionCard.module.css";

type CoachNutritionCardProps = {
  selectedDate: Date;
  plannedNutrition?: string | null;
  registeredNutrition?: string | null;
};

function formatDateParameter(date: Date): string {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function CoachNutritionCard({
  selectedDate,
  plannedNutrition,
  registeredNutrition,
}: CoachNutritionCardProps) {
  const selectedDateParameter =
    formatDateParameter(selectedDate);

  return (
    <CoachCard
      variant="flat"
      title="Alimentação"
      footer={
        <Link
          href={`/performance-ai/nutrition?date=${selectedDateParameter}`}
          className={styles.actionButton}
        >
          Adicionar refeição
          <span aria-hidden="true">+</span>
        </Link>
      }
    >
      <div className={styles.sections}>
        <section className={styles.section}>
          <div className={styles.label}>
            Alimentação planejada
          </div>

          {plannedNutrition ? (
            <div className={styles.plannedText}>
              {plannedNutrition}
            </div>
          ) : (
            <div className={styles.emptyText}>
              Nenhuma orientação alimentar planejada para
              este dia.
            </div>
          )}
        </section>

        <section
          className={`${styles.section} ${styles.registeredSection}`}
        >
          <div className={styles.label}>
            Alimentação registrada
          </div>

          {registeredNutrition ? (
            <div className={styles.registeredText}>
              {registeredNutrition}
            </div>
          ) : (
            <div className={styles.emptyText}>
              Nenhuma refeição registrada para este dia.
            </div>
          )}
        </section>
      </div>
    </CoachCard>
  );
}

