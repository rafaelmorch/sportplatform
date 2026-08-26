"use client";

import React from "react";

type TriathlonChallengesProps = {
  communityId: string;
  userId?: string | null;
};

type ChallengeItem = {
  sport: "swim" | "bike" | "run" | "finish";
  title: string;
  target: string;
};

type ChallengeLevel = {
  level: number;
  name: string;
  strongColor: string;
  softColor: string;
  description: string;
  challenges: ChallengeItem[];
};

const levels: ChallengeLevel[] = [
  {
    level: 1,
    name: "Foundation",
    strongColor: "#2563eb",
    softColor: "#dbeafe",
    description: "Build your base and start your triathlon journey.",
    challenges: [
      { sport: "swim", title: "Swim", target: "750 m" },
      { sport: "bike", title: "Bike", target: "30 km" },
      { sport: "run", title: "Run", target: "5 km" },
      {
        sport: "finish",
        title: "Level Finisher",
        target: "750 m + 30 km + 5 km · same day",
      },
    ],
  },
  {
    level: 2,
    name: "Olympic",
    strongColor: "#16a34a",
    softColor: "#dcfce7",
    description: "Take on the Olympic distance and level up.",
    challenges: [
      { sport: "swim", title: "Swim", target: "1.5 km" },
      { sport: "bike", title: "Bike", target: "60 km" },
      { sport: "run", title: "Run", target: "10 km" },
      {
        sport: "finish",
        title: "Level Finisher",
        target: "1.5 km + 60 km + 10 km · same day",
      },
    ],
  },
  {
    level: 3,
    name: "70.3",
    strongColor: "#f59e0b",
    softColor: "#fef3c7",
    description: "Half the distance. Double the determination.",
    challenges: [
      { sport: "swim", title: "Swim", target: "1.9 km" },
      { sport: "bike", title: "Bike", target: "90 km" },
      { sport: "run", title: "Run", target: "21.1 km" },
      {
        sport: "finish",
        title: "70.3 Finisher",
        target: "1.9 km + 90 km + 21.1 km · same day",
      },
    ],
  },
  {
    level: 4,
    name: "Iron Builder",
    strongColor: "#ea580c",
    softColor: "#ffedd5",
    description: "Stronger. Longer. Built for endurance.",
    challenges: [
      { sport: "swim", title: "Swim", target: "3 km" },
      { sport: "bike", title: "Bike", target: "140 km" },
      { sport: "run", title: "Run", target: "30 km" },
      {
        sport: "finish",
        title: "Iron Builder Finisher",
        target: "3 km + 140 km + 30 km · same day",
      },
    ],
  },
  {
    level: 5,
    name: "Iron",
    strongColor: "#7e22ce",
    softColor: "#f3e8ff",
    description: "The ultimate test of endurance.",
    challenges: [
      { sport: "swim", title: "Swim", target: "3.8 km" },
      { sport: "bike", title: "Bike", target: "180 km" },
      { sport: "run", title: "Run", target: "42.2 km" },
      {
        sport: "finish",
        title: "Ironman Finisher",
        target: "3.8 km + 180 km + 42.2 km · same day",
      },
    ],
  },
];

export default function TriathlonChallenges({
  communityId,
}: TriathlonChallengesProps) {
  return (
    <section data-community-id={communityId} style={{ marginBottom: 28 }}>
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            margin: "0 0 4px",
            color: "#0f172a",
            fontSize: 19,
            fontWeight: 800,
          }}
        >
          Triathlon Journey
        </h2>

        <div
          style={{
            color: "#475569",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          Complete each distance and finish all three disciplines on the same
          day to complete the level.
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {levels.map((level) => (
          <div
            key={level.level}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 8,
              border: "1px solid rgba(148, 163, 184, 0.42)",
              background: `linear-gradient(
                90deg,
                ${level.strongColor} 0%,
                ${level.softColor} 25%,
                #ffffff 58%,
                #ffffff 100%
              )`,
              boxShadow: "0 6px 14px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255,255,255,0.72)",
            }}
          >
            <div
              className="tri-mobile-level"
              style={{
                display: "grid",
                gridTemplateColumns: "145px minmax(0, 1fr)",
                minHeight: 205,
              }}
            >
              <div
                className="tri-mobile-identity"
                style={{
                  padding: "20px 18px",
                  color: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "4px 9px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.16)",
                      fontSize: 10,
                      lineHeight: 1,
                      fontWeight: 800,
                      letterSpacing: 0.6,
                      marginBottom: 8,
                    }}
                  >
                    LEVEL {level.level}
                  </div>

                  <div
                    className="tri-mobile-title"
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                      fontSize: 26,
                      lineHeight: 1,
                      fontWeight: 800,
                      letterSpacing: 0.5,
                      minHeight: 112,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {level.name}
                  </div>

                  <div
                    style={{
                      width: 26,
                      height: 2,
                      background: "rgba(255,255,255,0.55)",
                      marginTop: 14,
                      marginBottom: 14,
                    }}
                  />

                  <div
                    className="tri-mobile-description"
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                      fontSize: 11,
                      lineHeight: 1.35,
                      color: "rgba(255,255,255,0.88)",
                      letterSpacing: 0.2,
                      maxHeight: 150,
                    }}
                  >
                    {level.description}
                  </div>
                </div>
              </div>

              <div
                className="tri-mobile-list"
                style={{
                  padding: "8px 18px 8px 12px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    height: 28,
                    color: level.strongColor,
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  0 / 4
                </div>

                {level.challenges.map((challenge, index) => {
                  const isFinal = challenge.sport === "finish";

                  return (
                    <div
                      key={`${level.level}-${challenge.sport}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0,1fr) auto",
                        alignItems: "center",
                        gap: 12,
                        minHeight: 42,
                        padding: "7px 0",
                        borderTop:
                          index === 0
                            ? "1px solid rgba(148,163,184,0.22)"
                            : "1px solid rgba(148,163,184,0.22)",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            color: isFinal
                              ? level.strongColor
                              : "#0f172a",
                            fontSize: 13,
                            fontWeight: isFinal ? 800 : 700,
                            lineHeight: 1.2,
                          }}
                        >
                          {challenge.title}
                        </div>

                        <div
                          style={{
                            marginTop: 2,
                            color: "#64748b",
                            fontSize: 11,
                            lineHeight: 1.35,
                          }}
                        >
                          {challenge.target}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          flexShrink: 0,
                        }}
                      >


                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            border: `2px solid ${
                              isFinal
                                ? "#cbd5e1"
                                : level.strongColor
                            }`,
                            background: "#ffffff",
                            flexShrink: 0,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        @media (max-width: 640px) {
          .tri-mobile-level {
            grid-template-columns: 92px minmax(0, 1fr) !important;
          }

          .tri-mobile-identity {
            padding: 14px 10px !important;
          }

          .tri-mobile-title {
            font-size: 22px !important;
            min-height: 105px !important;
          }

          .tri-mobile-description {
            display: none !important;
          }

          .tri-mobile-list {
            padding-left: 8px !important;
            padding-right: 10px !important;
          }
        }
      `}</style>
    </section>
  );
}







