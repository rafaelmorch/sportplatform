"use client";

import Link from "next/link";

import CoachCard from "./CoachCard";
import styles from "./CoachWorkoutCard.module.css";

type PlannedTraining = {
  modality: string;
  duration: string;
  intensity: string;
  intensityExplanation: string;
  details: string;
  goal: string;
  caution: string;
};

type CoachWorkoutCardProps = {
  plannedWorkout?: string | null;
  plannedGoal?: string | null;
  plannedTraining?: PlannedTraining | null;

  completedWorkout?: string | null;
  completedSummary?: string | null;
};

export default function CoachWorkoutCard({
  plannedWorkout,
  plannedGoal,
  plannedTraining,
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
          <span>Ver treinos e atualizar Strava</span>
          <span aria-hidden="true">→</span>
        </Link>
      }
    >
      <div>
        <section className={styles.section}>
          <div className={styles.label}>
            Treino planejado
          </div>

          {plannedTraining ? (
            <>
              <div
                style={{
                  marginTop: 9,
                  color: "#ffffff",
                  fontSize: 17,
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}
              >
                {plannedTraining.modality}
                {plannedTraining.duration
                  ? ` · ${plannedTraining.duration}`
                  : ""}
              </div>

              {plannedTraining.details ? (
                <div
                  style={{
                    marginTop: 10,
                    color: "rgba(255,255,255,0.56)",
                    fontSize: 13,
                    lineHeight: 1.7,
                  }}
                >
                  {plannedTraining.details}
                </div>
              ) : null}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: 0,
                  marginTop: 20,
                  borderTop:
                    "1px solid rgba(255,255,255,0.08)",
                  borderBottom:
                    "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    padding: "16px 14px 16px 0",
                    borderRight:
                      "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      color: "#D4AF37",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    Intensidade
                  </div>

                  <div
                    style={{
                      marginTop: 7,
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    {plannedTraining.intensity || "—"}
                  </div>

                  {plannedTraining.intensityExplanation ? (
                    <div
                      style={{
                        marginTop: 7,
                        color: "#ffffff",
                        fontSize: 13,
                        fontWeight: 400,
                        lineHeight: 1.55,
                      }}
                    >
                      {
                        plannedTraining.intensityExplanation
                      }
                    </div>
                  ) : null}
                </div>

                <div
                  style={{
                    padding: "16px 14px",
                  }}
                >
                  <div
                    style={{
                      color: "#D4AF37",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    Objetivo
                  </div>

                  <div
                    style={{
                      marginTop: 7,
                      color: "#ffffff",
                      fontSize: 13,
                      lineHeight: 1.55,
                    }}
                  >
                    {plannedTraining.goal || "—"}
                  </div>
                </div>
              </div>

              {plannedTraining.caution ? (
                <div
                  style={{
                    marginTop: 16,
                    padding: "13px 14px",
                    border:
                      "1px solid rgba(212,175,55,0.22)",
                    borderRadius: 10,
                    background:
                      "rgba(212,175,55,0.035)",
                  }}
                >
                  <div
                    style={{
                      color: "#D4AF37",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    Atenção
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      color: "rgba(255,255,255,0.62)",
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    {plannedTraining.caution}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className={styles.primaryText}>
                {plannedWorkout ||
                  "Nenhum treino planejado"}
              </div>

              {plannedGoal ? (
                <div className={styles.secondaryText}>
                  {plannedGoal}
                </div>
              ) : null}
            </>
          )}
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
                <div
                  className={
                    styles.completedSummary
                  }
                >
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

