// components/performance-ai/CoachMonthlyCalendar.tsx

"use client";

import { useEffect, useMemo, useState } from "react";

import styles from "./CoachMonthlyCalendar.module.css";

export type CalendarDayStatus = {
  hasPlannedWorkout: boolean;
  hasRegisteredNutrition: boolean;
};

type CoachMonthlyCalendarProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  statuses?: Record<string, CalendarDayStatus>;
  onDisplayedMonthChange?: (month: Date) => void;
};

const WEEKDAYS = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
];

function isSameDay(
  firstDate: Date,
  secondDate: Date
): boolean {
  return (
    firstDate.getFullYear() ===
      secondDate.getFullYear() &&
    firstDate.getMonth() ===
      secondDate.getMonth() &&
    firstDate.getDate() ===
      secondDate.getDate()
  );
}

function formatDateKey(
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

function createCalendarDays(
  displayedMonth: Date
): Date[] {
  const year =
    displayedMonth.getFullYear();
  const month =
    displayedMonth.getMonth();

  const firstDayOfMonth =
    new Date(year, month, 1);

  const calendarStart =
    new Date(
      year,
      month,
      1 - firstDayOfMonth.getDay()
    );

  return Array.from(
    { length: 42 },
    (_, index) => {
      const date =
        new Date(calendarStart);

      date.setDate(
        calendarStart.getDate() +
          index
      );

      return date;
    }
  );
}

export default function CoachMonthlyCalendar({
  selectedDate,
  onSelectDate,
  statuses = {},
  onDisplayedMonthChange,
}: CoachMonthlyCalendarProps) {
  const today =
    useMemo(() => new Date(), []);

  const [
    displayedMonth,
    setDisplayedMonth,
  ] = useState(
    () =>
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1
      )
  );

  useEffect(() => {
    onDisplayedMonthChange?.(
      displayedMonth
    );
  }, [
    displayedMonth,
    onDisplayedMonthChange,
  ]);

  const calendarDays =
    useMemo(
      () =>
        createCalendarDays(
          displayedMonth
        ),
      [displayedMonth]
    );

  const monthLabel =
    useMemo(
      () =>
        new Intl.DateTimeFormat(
          "pt-BR",
          {
            month: "long",
            year: "numeric",
          }
        ).format(displayedMonth),
      [displayedMonth]
    );

  function changeMonth(
    monthOffset: number
  ): void {
    setDisplayedMonth(
      (currentMonth) =>
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() +
            monthOffset,
          1
        )
    );
  }

  function selectDate(
    date: Date
  ): void {
    onSelectDate(
      new Date(date)
    );
  }

  return (
    <section>
      <div
        className={
          styles.monthHeader
        }
      >
        <button
          type="button"
          className={
            styles.monthButton
          }
          onClick={() =>
            changeMonth(-1)
          }
          aria-label="Mês anterior"
        >
          ‹
        </button>

        <h2
          className={
            styles.monthTitle
          }
        >
          {monthLabel}
        </h2>

        <button
          type="button"
          className={
            styles.monthButton
          }
          onClick={() =>
            changeMonth(1)
          }
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>

      <div
        className={
          styles.weekdays
        }
      >
        {WEEKDAYS.map(
          (weekday) => (
            <div
              key={weekday}
              className={
                styles.weekday
              }
            >
              {weekday}
            </div>
          )
        )}
      </div>

      <div
        className={
          styles.daysGrid
        }
      >
        {calendarDays.map(
          (date) => {
            const belongsToDisplayedMonth =
              date.getMonth() ===
              displayedMonth.getMonth();

            const selected =
              isSameDay(
                date,
                selectedDate
              );

            const currentDay =
              isSameDay(
                date,
                today
              );

            const status =
              statuses[
                formatDateKey(date)
              ];

            const classNames = [
              styles.dayButton,
              !belongsToDisplayedMonth
                ? styles.outsideMonth
                : "",
              currentDay
                ? styles.today
                : "",
              selected
                ? styles.selected
                : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={
                  date.toISOString()
                }
                type="button"
                className={
                  classNames
                }
                onClick={() =>
                  selectDate(date)
                }
                aria-label={
                  new Intl.DateTimeFormat(
                    "pt-BR",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  ).format(date)
                }
                aria-pressed={
                  selected
                }
              >
                <span>
                  {date.getDate()}
                </span>

                <span
                  aria-hidden="true"
                  style={{
                    minHeight: 8,
                    marginTop: 3,
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    gap: 4,
                  }}
                >
                  {status?.hasPlannedWorkout ? (
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius:
                          "50%",
                        background:
                          "#D4AF37",
                        boxShadow:
                          "0 0 6px rgba(212,175,55,0.42)",
                      }}
                    />
                  ) : null}

                  {status?.hasRegisteredNutrition ? (
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius:
                          "50%",
                        background:
                          "#4ade80",
                        boxShadow:
                          "0 0 6px rgba(74,222,128,0.32)",
                      }}
                    />
                  ) : null}
                </span>
              </button>
            );
          }
        )}
      </div>

      <div
        style={{
          marginTop: 18,
          display: "flex",
          flexWrap: "wrap",
          gap: "10px 18px",
          color:
            "rgba(255,255,255,0.42)",
          fontSize: 10,
          lineHeight: 1.4,
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#D4AF37",
            }}
          />
          Treino planejado
        </span>

        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#4ade80",
            }}
          />
          Alimentação registrada
        </span>
      </div>
    </section>
  );
}

