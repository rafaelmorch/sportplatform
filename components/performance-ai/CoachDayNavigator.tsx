// components/performance-ai/CoachDayNavigator.tsx

"use client";

import styles from "./CoachDayNavigator.module.css";

type CoachDayNavigatorProps = {
  selectedDate: Date;
  onPrevious: () => void;
  onNext: () => void;
};

export default function CoachDayNavigator({
  selectedDate,
  onPrevious,
  onNext,
}: CoachDayNavigatorProps) {
  const weekday = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
  }).format(selectedDate);

  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(selectedDate);

  return (
    <section className={styles.navigator}>
      <button
        type="button"
        className={styles.navigationButton}
        onClick={onPrevious}
        aria-label="Dia anterior"
      >
        ‹
      </button>

      <div className={styles.dateContent}>
        <div className={styles.weekday}>{weekday}</div>
        <div className={styles.dateLabel}>{dateLabel}</div>
      </div>

      <button
        type="button"
        className={styles.navigationButton}
        onClick={onNext}
        aria-label="Próximo dia"
      >
        ›
      </button>
    </section>
  );
}