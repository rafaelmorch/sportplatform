// components/performance-ai/CoachMonthlyCalendar.tsx

"use client";

import { useMemo, useState } from "react";

import styles from "./CoachMonthlyCalendar.module.css";

type CoachMonthlyCalendarProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function isSameDay(firstDate: Date, secondDate: Date): boolean {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function createCalendarDays(displayedMonth: Date): Date[] {
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);

  const calendarStart = new Date(
    year,
    month,
    1 - firstDayOfMonth.getDay()
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);

    date.setDate(calendarStart.getDate() + index);

    return date;
  });
}

export default function CoachMonthlyCalendar({
  selectedDate,
  onSelectDate,
}: CoachMonthlyCalendarProps) {
  const today = useMemo(() => new Date(), []);

  const [displayedMonth, setDisplayedMonth] = useState(
    () =>
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1
      )
  );

  const calendarDays = useMemo(
    () => createCalendarDays(displayedMonth),
    [displayedMonth]
  );

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric",
      }).format(displayedMonth),
    [displayedMonth]
  );

  function changeMonth(monthOffset: number): void {
    setDisplayedMonth(
      (currentMonth) =>
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + monthOffset,
          1
        )
    );
  }

  function selectDate(date: Date): void {
    onSelectDate(new Date(date));
  }

  return (
    <section className={styles.calendar}>
      <div className={styles.monthHeader}>
        <button
          type="button"
          className={styles.monthButton}
          onClick={() => changeMonth(-1)}
          aria-label="Mês anterior"
        >
          ‹
        </button>

        <h2 className={styles.monthTitle}>{monthLabel}</h2>

        <button
          type="button"
          className={styles.monthButton}
          onClick={() => changeMonth(1)}
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className={styles.weekday}>
            {weekday}
          </div>
        ))}
      </div>

      <div className={styles.daysGrid}>
        {calendarDays.map((date) => {
          const belongsToDisplayedMonth =
            date.getMonth() === displayedMonth.getMonth();

          const selected = isSameDay(date, selectedDate);
          const currentDay = isSameDay(date, today);

          const classNames = [
            styles.dayButton,
            !belongsToDisplayedMonth ? styles.outsideMonth : "",
            currentDay ? styles.today : "",
            selected ? styles.selected : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={date.toISOString()}
              type="button"
              className={classNames}
              onClick={() => selectDate(date)}
              aria-label={new Intl.DateTimeFormat("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(date)}
              aria-pressed={selected}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </section>
  );
}