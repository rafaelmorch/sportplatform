// components/performance/PerformanceOverviewHero.tsx

"use client";

import Link from "next/link";

import styles from "./PerformanceOverviewHero.module.css";

type PerformanceOverviewHeroProps = {
  performanceScore: number;
  performanceStatus: string;
  statusDescription: string;
  insight: string;
};

export default function PerformanceOverviewHero({
  performanceScore,
  performanceStatus,
  statusDescription,
  insight,
}: PerformanceOverviewHeroProps) {
  const scoreDegrees = Math.max(
    0,
    Math.min(100, performanceScore)
  ) * 3.6;

  return (
    <section className={styles.hero}>
      <div className={styles.glowTop} />
      <div className={styles.glowBottom} />

      <div className={styles.intro}>
        <div className={styles.brand}>
          <span className={styles.brandLine} />
          <span>Sports Platform</span>
        </div>

        <h1 className={styles.title}>
          Coach <span>IA</span>
        </h1>

        <p className={styles.subtitle}>
          Sua performance hoje, suas orientações e seu plano em
          um único lugar.
        </p>
      </div>

      <div className={styles.dashboard}>
        <div className={styles.scoreColumn}>
          <div className={styles.scoreLabel}>
            Score de performance
          </div>

          <div
            className={styles.scoreRing}
            style={{
              background: `conic-gradient(
                #ff2d2d 0deg,
                #ff7a00 72deg,
                #ffd400 144deg,
                #00d26a 216deg,
                #1e7bff ${scoreDegrees}deg,
                rgba(255,255,255,0.08) ${scoreDegrees}deg,
                rgba(255,255,255,0.08) 360deg
              )`,
            }}
          >
            <div className={styles.scoreInside}>
              <div className={styles.scoreValue}>
                {performanceScore}
              </div>

              <div className={styles.scoreTotal}>/100</div>
            </div>
          </div>

          <div className={styles.status}>
            {performanceStatus}
          </div>

          <p className={styles.statusDescription}>
            {statusDescription}
          </p>
        </div>

        <div className={styles.coachColumn}>
          <div className={styles.coachEyebrow}>
            Orientação do Coach
          </div>

          <p className={styles.insight}>{insight}</p>

          <p className={styles.disclaimer}>
            Orientação baseada nos dados disponíveis na Sports
            Platform.
          </p>

          <div className={styles.actions}>
            <Link
              href="/performance-ai/coach/plan"
              className={styles.primaryButton}
            >
              Abrir meu plano
            </Link>

            <Link
              href="/performance-ai/chat"
              className={styles.secondaryButton}
            >
              Falar com o Coach
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

