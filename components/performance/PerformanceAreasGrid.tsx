
// components/performance/PerformanceAreasGrid.tsx

"use client";

import Link from "next/link";

import styles from "./PerformanceAreasGrid.module.css";

export type PerformanceAreaItem = {
  title: string;
  score: number;
  status: string;
  description: string;
  detail: string;
  href: string;
  action: string;
  available: boolean;
};

type PerformanceAreasGridProps = {
  areas: PerformanceAreaItem[];
  dataQuality: number;
};

function scoreLabel(score: number): string {
  if (score >= 85) return "Excelente";
  if (score >= 70) return "Muito bom";
  if (score >= 55) return "Em evolução";
  return "Precisa de atenção";
}

function dataQualityLabel(value: number): string {
  if (value >= 85) return "Excelente";
  if (value >= 65) return "Muito boa";
  if (value >= 40) return "Em desenvolvimento";
  return "Precisa de mais dados";
}

export default function PerformanceAreasGrid({
  areas,
  dataQuality,
}: PerformanceAreasGridProps) {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              Minha performance
            </p>

            <h2 className={styles.title}>
              Suas áreas de performance
            </h2>

            <p className={styles.description}>
              Acesse rapidamente cada área e acompanhe os dados
              que ajudam o Coach a entender sua evolução.
            </p>
          </div>
        </header>

        <div className={styles.grid}>
          {areas.map((area) => (
            <Link
              key={area.title}
              href={area.href}
              className={[
                styles.card,
                !area.available ? styles.unavailable : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.areaStatus}>
                    <span
                      className={[
                        styles.statusDot,
                        area.available
                          ? styles.statusDotAvailable
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    />

                    {area.status}
                  </div>

                  <h3 className={styles.areaTitle}>
                    {area.title}
                  </h3>
                </div>

                <div className={styles.score}>
                  <span className={styles.scoreValue}>
                    {area.score}
                  </span>

                  <span className={styles.scoreTotal}>
                    /100
                  </span>
                </div>
              </div>

              <p className={styles.areaDescription}>
                {area.description}
              </p>

              <div className={styles.cardFooter}>
                <span className={styles.scoreStatus}>
                  {scoreLabel(area.score)}
                </span>

                <span className={styles.action}>
                  {area.action} →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <section className={styles.qualityCard}>
          <div className={styles.qualityHeader}>
            <div>
              <p className={styles.qualityLabel}>
                Qualidade dos dados
              </p>

              <h3 className={styles.qualityStatus}>
                {dataQualityLabel(dataQuality)}
              </h3>
            </div>

            <div className={styles.qualityValue}>
              {dataQuality}%
            </div>
          </div>

          <div className={styles.progressTrack}>
            <div
              className={styles.progressValue}
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, dataQuality)
                )}%`,
              }}
            />
          </div>

          <p className={styles.qualityDescription}>
            Quanto mais completas estiverem suas informações,
            mais precisas serão as orientações do Coach.
          </p>
        </section>
      </div>
    </section>
  );
}