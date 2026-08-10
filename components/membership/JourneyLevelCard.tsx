"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type JourneyChallenge = {
  id: string;
  title: string;
  goal_criteria?: string | null;
  activity_type?: string | null;
  validation_method?: string | null;
};

type JourneyLevelCardProps = {
  communityId?: string;
  title: string;
  label: string;
  locked?: boolean;
  completed?: boolean;
  completedCount?: number;
  completedChallengeIds?: Set<string>;
  challenges: JourneyChallenge[];
};

export default function JourneyLevelCard({
  communityId,
  title,
  label,
  locked = false,
  completed = false,
  completedCount = 0,
  completedChallengeIds,
  challenges,
}: JourneyLevelCardProps) {
  const router = useRouter();

  const total = challenges.length;

  const progress =
    total > 0 ? Math.min(100, (completedCount / total) * 100) : 0;

  const [expandedChallengeId, setExpandedChallengeId] =
    useState<string | null>(null);

  const levelColor = title.includes("Yellow")
    ? "#f5c518"
    : title.includes("Orange")
    ? "#f97316"
    : title.includes("Purple")
    ? "#9333ea"
    : "#1e3a8a";

  const shirtImage = title.includes("Yellow")
    ? "/images/journey/journey-shirt-yellow.png"
    : title.includes("Orange")
    ? "/images/journey/journey-shirt-orange.png"
    : title.includes("Purple")
    ? "/images/journey/journey-shirt-purple.png"
    : "/images/journey/journey-shirt-dark-blue.png";

  const cleanTitle = title
    .replace(/🟨|🟧|🟪|🟦/g, "")
    .trim();

  /*
   * LOCKED LEVEL
   */
  if (locked) {
    return (
      <section
        style={{
          borderRadius: 16,
          padding: "14px 16px",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              minWidth: 0,
              flex: 1,
            }}
          >
            <div
              style={{
                width: 62,
                height: 62,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={shirtImage}
                alt={cleanTitle}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#111827",
                  lineHeight: 1.25,
                }}
              >
                {cleanTitle}
              </div>

              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#9ca3af",
                  marginTop: 4,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                {label}
              </div>
            </div>
          </div>

          <div
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <img src="/images/journey/journey-lock.png" alt="Locked" style={{ width: 28, height: 28, objectFit: "contain" }} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      style={{
        borderRadius: 18,
        padding: "20px 18px",
        background: "#ffffff",
        border: `1px solid ${levelColor}`,
        boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 78,
              height: 78,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={shirtImage}
              alt={cleanTitle}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                color: "#9ca3af",
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              {label}
            </div>

            <div
              style={{
                fontSize: 19,
                fontWeight: 700,
                color: "#111827",
                lineHeight: 1.2,
              }}
            >
              {cleanTitle}
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESS */}
      <div
        style={{
          marginTop: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "#4b5563",
            fontWeight: 600,
          }}
        >
          {completedCount} of {total} challenges complete
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {Math.round(progress)}%
        </div>
      </div>

      <div
        style={{
          marginTop: 8,
          height: 5,
          borderRadius: 999,
          background: "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: levelColor,
            borderRadius: 999,
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* CHALLENGES */}
      <div
        style={{
          marginTop: 18,
          display: "grid",
          gap: 4,
        }}
      >
        {challenges.length === 0 ? (
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              padding: "10px 0",
            }}
          >
            No challenges in this shirt yet.
          </div>
        ) : (
          challenges.map((challenge) => {
            const isDone =
              completedChallengeIds?.has(challenge.id) ?? false;

            const canSubmitProof =
              !isDone &&
              challenge.validation_method === "manual";

            const isExpanded =
              canSubmitProof &&
              expandedChallengeId === challenge.id;

            return (
              <div
                key={challenge.id}
                onClick={() => {
                  if (!canSubmitProof) return;

                  setExpandedChallengeId(
                    isExpanded ? null : challenge.id
                  );
                }}
                style={{
                  padding: "12px 4px",
                  borderBottom: "1px solid #f1f5f9",
                  cursor: canSubmitProof
                    ? "pointer"
                    : "default",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {/* COMPLETED */}
                  {isDone ? (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        background: "#22c55e",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </div>
                  ) : (
                    /* NOT COMPLETED */
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        border: "2px solid #111827",
                        background: "transparent",
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <div
                    style={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#111827",
                        lineHeight: 1.4,
                      }}
                    >
                      {challenge.title}
                    </div>

                    {challenge.goal_criteria && (
                      <div
                        style={{
                          marginTop: 2,
                          fontSize: 11,
                          color: "#9ca3af",
                          lineHeight: 1.45,
                        }}
                      >
                        {challenge.goal_criteria}
                      </div>
                    )}
                  </div>
                </div>

                {/* MANUAL PROOF */}
                {isExpanded && canSubmitProof && (
                  <div
                    style={{
                      marginTop: 12,
                      marginLeft: 32,
                      paddingTop: 10,
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        lineHeight: 1.5,
                      }}
                    >
                      This challenge may require manual proof.
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();

                        if (!communityId) return;

                        router.push(
                          `/groups/${communityId}/inside/challenges/${challenge.id}/proof`
                        );
                      }}
                      style={{
                        marginTop: 8,
                        border: "0",
                        borderRadius: 8,
                        padding: "9px 13px",
                        background: "#111827",
                        color: "#ffffff",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Submit proof
                    </button>
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





