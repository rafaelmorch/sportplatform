// components/performance-ai/CoachCard.tsx

"use client";

import type { ReactNode } from "react";

import styles from "./CoachCard.module.css";

type CoachCardProps = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "card" | "flat";
};

export default function CoachCard({
  title,
  children,
  footer,
  variant = "card",
}: CoachCardProps) {
  const sectionClassName =
    variant === "flat"
      ? `${styles.card} ${styles.flat}`
      : styles.card;

  return (
    <section className={sectionClassName}>
      <h2 className={styles.title}>{title}</h2>

      <div className={styles.content}>{children}</div>

      {footer ? (
        <div className={styles.footer}>{footer}</div>
      ) : null}
    </section>
  );
}
