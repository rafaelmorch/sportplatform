"use client";

import React, { useState } from "react";

type JourneyChallenge = {
  id: string;
  title: string;
  goal_criteria?: string | null;
  activity_type?: string | null;
};

type JourneyLevelCardProps = {
  title: string;
  label: string;
  locked?: boolean;
  completed?: boolean;
  completedCount?: number;
  completedChallengeIds?: Set<string>;
  challenges: JourneyChallenge[];
};

export default function JourneyLevelCard({
  title,
  label,
  locked = false,
  completed = false,
  completedCount = 0,
  completedChallengeIds,
  challenges,
}: JourneyLevelCardProps) {
  const total = challenges.length;

  const [expandedChallengeId, setExpandedChallengeId] = useState<string | null>(null);

  return (
    <section
      style={{
        borderRadius: 24,
        padding: 18,
        background: locked ? "#f8fafc" : "#ffffff",
        border: locked ? "1px solid #e2e8f0" : "2px solid #facc15",
        opacity: locked ? 0.65 : 1,
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#64748b", marginBottom: 4 }}>
            {label}
          </div>

          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
            {title}
          </div>
        </div>

        <div style={{ fontSize: 22 }}>
          {completed ? "✅" : locked ? "🔒" : "👕"}
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800, color: "#475569" }}>
        Progress: {completedCount} / {total} challenges completed
      </div>

      <div
        style={{
          marginTop: 10,
          height: 8,
          borderRadius: 999,
          background: "#e2e8f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: total > 0 ? `${Math.min(100, (completedCount / total) * 100)}%` : "0%",
            background: locked ? "#94a3b8" : "#facc15",
          }}
        />
      </div>

      <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
        {challenges.length === 0 ? (
          <div style={{ fontSize: 13, color: "#64748b" }}>No challenges in this shirt yet.</div>
        ) : (
          challenges.map((challenge) => {
  const isDone = completedChallengeIds?.has(challenge.id) ?? false;

  return (
            <div
              key={challenge.id}
              style={{
                borderRadius: 14,
                padding: 12,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                {isDone ? "✅" : "⬜"} {challenge.title}
              </div>

              {challenge.goal_criteria && (
                <div style={{ marginTop: 4, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                  {challenge.goal_criteria}
                </div>
              )}
            </div>
            );
})
        )}
      </div>
    </section>
  );
}


