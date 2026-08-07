"use client";

import Link from "next/link";

import CoachCard from "./CoachCard";
import styles from "./CoachNutritionCard.module.css";

type PlannedNutrition = {
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

type CoachNutritionCardProps = {
  selectedDate: Date;
  plannedNutrition?: string | null;
  plannedNutritionData?: PlannedNutrition | null;
  registeredNutrition?: string | null;
};

function formatDateParameter(
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

export default function CoachNutritionCard({
  selectedDate,
  plannedNutrition,
  plannedNutritionData,
  registeredNutrition,
}: CoachNutritionCardProps) {
  const selectedDateParameter =
    formatDateParameter(selectedDate);

  const mealRows = plannedNutritionData
    ? [
        ["Café da manhã", plannedNutritionData.breakfast],
        ["Almoço", plannedNutritionData.lunch],
        ["Pré-treino", plannedNutritionData.preWorkout],
        ["Pós-treino", plannedNutritionData.postWorkout],
        ["Jantar", plannedNutritionData.dinner],
        ["Hidratação", plannedNutritionData.hydration],
      ].filter(([, value]) => Boolean(value))
    : [];

  return (
    <CoachCard
      variant="flat"
      title="Alimentação"
      footer={
        <Link
          href={`/performance-ai/nutrition?date=${selectedDateParameter}`}
          className={styles.actionButton}
        >
          <span>Adicionar refeição</span>
          <span aria-hidden="true">+</span>
        </Link>
      }
    >
      <div>
        <section className={styles.section}>
          <div className={styles.label}>
            Alimentação planejada
          </div>

          {plannedNutritionData ? (
            <>
              {plannedNutritionData.dailyFocus ? (
                <div
                  style={{
                    marginTop: 12,
                    padding: "13px 0 15px",
                    borderBottom:
                      "1px solid rgba(255,255,255,0.08)",
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
                    Foco do dia
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      color: "#ffffff",
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    {plannedNutritionData.dailyFocus}
                  </div>
                </div>
              ) : null}

              <div>
                {mealRows.map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(100px, 0.35fr) minmax(0, 1fr)",
                      gap: 16,
                      padding: "14px 0",
                      borderBottom:
                        "1px solid rgba(255,255,255,0.065)",
                    }}
                  >
                    <div
                      style={{
                        color: "#ffffff",
                        fontSize: 12,
                        fontWeight: 600,
                        lineHeight: 1.5,
                      }}
                    >
                      {label}
                    </div>

                    <div
                      style={{
                        color:
                          "rgba(255,255,255,0.58)",
                        fontSize: 12,
                        lineHeight: 1.6,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px 24px",
                  marginTop: 16,
                  paddingTop: 14,
                }}
              >
                {plannedNutritionData.proteinTarget ? (
                  <div>
                    <span
                      style={{
                        color:
                          "rgba(255,255,255,0.38)",
                        fontSize: 10,
                      }}
                    >
                      Proteína{" "}
                    </span>

                    <span
                      style={{
                        color: "#ffffff",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {
                        plannedNutritionData.proteinTarget
                      }
                    </span>
                  </div>
                ) : null}

                {plannedNutritionData.carbTarget ? (
                  <div>
                    <span
                      style={{
                        color:
                          "rgba(255,255,255,0.38)",
                        fontSize: 10,
                      }}
                    >
                      Carboidratos{" "}
                    </span>

                    <span
                      style={{
                        color: "#ffffff",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {
                        plannedNutritionData.carbTarget
                      }
                    </span>
                  </div>
                ) : null}
              </div>
            </>
          ) : plannedNutrition ? (
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
