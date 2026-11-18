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
          <span>Your Personal Trainer</span>
        </div>

        <h1 className={styles.title}>
          ASHLAI <span>Coach</span>
        </h1>

        <p className={styles.subtitle}>
          Your performance, guidance and plan in one place.
        </p>
      </div>

      <div className={styles.dashboard}>
        <div className={styles.scoreColumn}>
          <div className={styles.scoreLabel}>
            Performance Score
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
            Coach Guidance
          </div>

          <p className={styles.insight}>{insight}</p>

          <p className={styles.disclaimer}>
            Guidance based on the data available in ASHLAI Coach.
          </p>

          <div className={styles.actions}>
            <Link
              href="/performance-ai/coach/plan"
              className={styles.primaryButton}
            >
              Open My Plan
            </Link>

            <Link
              href="/performance-ai/chat"
              className={styles.secondaryButton}
            >
              Chat with My Coach
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

