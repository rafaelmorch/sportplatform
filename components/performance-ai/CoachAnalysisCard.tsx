// components/performance-ai/CoachAnalysisCard.tsx

"use client";

import CoachCard from "./CoachCard";

import styles from "./CoachAnalysisCard.module.css";

type CoachAnalysisCardProps = {
  analysis?: string | null;
};

export default function CoachAnalysisCard({
  analysis,
}: CoachAnalysisCardProps) {
  return (
    <div className={styles.wrapper}>
      <CoachCard variant="flat" title="Orientação do Coach">
        <div className={styles.analysis}>
          {analysis ? (
            <div className={styles.analysisText}>
              {analysis}
            </div>
          ) : (
            <div className={styles.emptyText}>
              A análise personalizada aparecerá aqui após o
              Coach IA comparar o planejamento do dia com seus
              treinos, alimentação, perfil, recuperação e
              demais informações disponíveis.
            </div>
          )}
        </div>
      </CoachCard>
    </div>
  );
}

