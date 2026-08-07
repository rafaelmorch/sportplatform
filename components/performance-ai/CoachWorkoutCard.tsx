// components/performance-ai/CoachWorkoutCard.tsx

"use client";

import Link from "next/link";

import CoachCard from "./CoachCard";

import styles from "./CoachWorkoutCard.module.css";

type CoachWorkoutCardProps = {
  plannedWorkout?: string | null;
  plannedGoal?: string | null;
  completedWorkout?: string | null;
  completedSummary?: string | null;
};

export default function CoachWorkoutCard({
  plannedWorkout,
  plannedGoal,
  completedWorkout,
  completedSummary,
}: CoachWorkoutCardProps) {
  return (
    <CoachCard
      variant="flat"
      title="Treino"
      footer={
        <Link
          href="/performance-ai/training"
          className={styles.actionButton}
        >
          Ver treinos e atualizar Strava
          <span aria-hidden="true">→</span>
        </Link>
      }
    >
      <div className={styles.sections}>
        <section className={styles.section}>
          <div className={styles.label}>
            Treino planejado
          </div>

          <div className={styles.primaryText}>
            {plannedWorkout || "Nenhum treino planejado"}
          </div>

          {plannedGoal ? (
            <div className={styles.secondaryText}>
              {plannedGoal}
            </div>
          ) : null}
        </section>

        <section
          className={`${styles.section} ${styles.completedSection}`}
        >
          <div className={styles.label}>
            Treino realizado
          </div>

          {completedWorkout ? (
            <>
              <div className={styles.completedTitle}>
                {completedWorkout}
              </div>

              {completedSummary ? (
                <div className={styles.completedSummary}>
                  {completedSummary}
                </div>
              ) : null}
            </>
          ) : (
            <div className={styles.emptyText}>
              Nenhum treino registrado para este dia.
            </div>
          )}
        </section>
      </div>
    </CoachCard>
  );
}

