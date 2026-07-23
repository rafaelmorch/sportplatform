"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Montserrat } from "next/font/google";
import { supabaseBrowser } from "@/lib/supabase-browser";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600"] });

type HomeCardTone = "yellow" | "green" | "purple" | "blue" | "neutral";

type HomeCardProps = {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
  tone?: HomeCardTone;
  icon?: React.ReactNode;
  visual?: React.ReactNode;
};

const CARD_TONES: Record<
  HomeCardTone,
  {
    accent: string;
    border: string;
    glow: string;
    haze: string;
  }
> = {
  yellow: {
    accent: "#facc15",
    border: "rgba(250,204,21,0.58)",
    glow: "rgba(245,158,11,0.24)",
    haze: "rgba(245,158,11,0.30)",
  },
  green: {
    accent: "#4ade80",
    border: "rgba(74,222,128,0.56)",
    glow: "rgba(34,197,94,0.22)",
    haze: "rgba(34,197,94,0.28)",
  },
  purple: {
    accent: "#c084fc",
    border: "rgba(192,132,252,0.58)",
    glow: "rgba(168,85,247,0.24)",
    haze: "rgba(168,85,247,0.28)",
  },
  blue: {
    accent: "#60a5fa",
    border: "rgba(96,165,250,0.56)",
    glow: "rgba(59,130,246,0.24)",
    haze: "rgba(59,130,246,0.28)",
  },
  neutral: {
    accent: "#ffffff",
    border: "rgba(255,255,255,0.34)",
    glow: "rgba(255,255,255,0.10)",
    haze: "rgba(255,255,255,0.10)",
  },
};

function HomeCard({
  title,
  children,
  onClick,
  tone = "neutral",
  icon,
  visual,
}: HomeCardProps) {
  const colors = CARD_TONES[tone];

  return (
    <section
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
        minHeight: tone === "neutral" ? undefined : 92,
        overflow: "hidden",
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: "14px 10px 14px 8px",
        background: `
          radial-gradient(circle at 12% 18%, ${colors.haze}, transparent 42%),
          linear-gradient(135deg, rgba(5,7,10,0.80), rgba(3,4,6,0.52))
        `,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.07),
          0 14px 34px rgba(0,0,0,0.30),
          0 0 24px ${colors.glow}
        `,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(115deg, rgba(255,255,255,0.08), transparent 28%)",
          opacity: 0.55,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: tone === "neutral" ? "block" : "grid",
          gridTemplateColumns:
            tone === "neutral"
              ? undefined
              : icon
                ? "48px minmax(0,1fr) 64px"
                : "minmax(0,1fr) 64px",
          alignItems: tone === "neutral" ? undefined : "center",
          gap: tone === "neutral" ? undefined : 10,
        }}
      >
        {tone !== "neutral" && icon && (
          <div
            style={{
              color: colors.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </div>
        )}

        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h2
            style={{
              margin: 0,
              marginBottom: 7,
              color: tone === "neutral" ? "#ffffff" : colors.accent,
              fontSize: tone === "neutral" ? 18 : 18,
              lineHeight: 1.15,
              fontWeight: 600,
              letterSpacing: tone === "neutral" ? undefined : "-0.02em",
            }}
          >
            {title}
          </h2>

          {children}
        </div>

        {tone !== "neutral" && icon && (
          <div
            aria-hidden="true"
            style={{
              color: colors.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.88,
            }}
          >
            {visual}
          </div>
        )}
      </div>
    </section>
  );
}

function ActionButton({
  label,
  onClick,
  primary = false,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 46,
        border: primary
          ? "1px solid rgba(255,255,255,0.95)"
          : "1px solid rgba(255,255,255,0.55)",
        borderRadius: 12,
        padding: "10px 16px",
        background: primary ? "#ffffff" : "rgba(255,255,255,0.12)",
        color: primary ? "#111827" : "#ffffff",
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
        touchAction: "manipulation",
      }}
    >
      {label}
    </button>
  );
}

export default function IntroPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabaseBrowser.auth.getSession();

        if (active) {
          setIsLoggedIn(Boolean(session?.user));
        }
      } catch (error) {
        console.error("Could not check the Supabase session:", error);

        if (active) {
          setIsLoggedIn(false);
        }
      } finally {
        if (active) {
          setSessionChecked(true);
        }
      }
    };

    void checkSession();

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      setIsLoggedIn(Boolean(session?.user));
      setSessionChecked(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const navigate = (href: string) => {
    try {
      localStorage.setItem("intro_last_seen", Date.now().toString());
    } catch {}

    router.push(href);
  };

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        background: "#111827",
        fontFamily: montserrat.style.fontFamily,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(
              to bottom,
              rgba(0,0,0,0.05) 0%,
              rgba(0,0,0,0.08) 28%,
              rgba(0,0,0,0.42) 48%,
              rgba(0,0,0,0.88) 66%,
              #000000 82%
            ),
            url("/intro-hero.png")
          `,
          backgroundSize: "100% auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top center",
          backgroundColor: "#000000",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.42) 36%, rgba(0,0,0,0.78) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          paddingTop: "calc(26px + env(safe-area-inset-top))",
          paddingBottom: "calc(170px + env(safe-area-inset-bottom))",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            boxSizing: "border-box",
            margin: "0 auto",
            padding: "0 18px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              height: "28dvh",
              minHeight: 180,
              maxHeight: 300,
            }}
          />

          <img
            src="/logo-sports-platform.png"
            alt="Sports Platform"
            style={{
              position: "absolute",
              top: "calc(20px + env(safe-area-inset-top))",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              display: "block",
              width: "clamp(280px, 60vw, 420px)",
              maxWidth: "calc(100% - 36px)",
              height: "auto",
              objectFit: "contain",
            }}
          />

          {!sessionChecked ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              Loading...
            </div>
          ) : isLoggedIn ? (
            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              <div
                style={{
                  padding: "4px 2px 2px",
                  color: "#ffffff",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 500,
                    opacity: 0.86,
                  }}
                >
                  Welcome back
                </p>

                <h1
                  style={{
                    margin: "4px 0 0",
                    fontSize: 28,
                    lineHeight: 1.1,
                    fontWeight: 600,
                  }}
                >
                  Ready for your next challenge?
                </h1>
              </div>

              <HomeCard
                title="Runner Journey"
                tone="blue"
                onClick={() => navigate("/groups")}
                icon={
                  <img
                    src="/runner-journey.png"
                    alt="Yellow sports shirt"
                    width={56}
                    height={56}
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: "contain",
                    margin: "0 auto 32px",
                      borderRadius: 10,
                    }}
                  />
                }
                visual={
                  <svg width="78" height="62" viewBox="0 0 78 62" fill="none">
                    <circle
                      cx="39"
                      cy="31"
                      r="23"
                      stroke="currentColor"
                      strokeWidth="5"
                      opacity="0.18"
                    />
                    <path
                      d="M39 8a23 23 0 0 1 20 12"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <text
                      x="39"
                      y="36"
                      fill="currentColor"
                      fontSize="12"
                      fontWeight="900"
                      textAnchor="middle"
                    >
                      60%
                    </text>
                  </svg>
                }
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >

                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        color: "#ffffff",
                        fontSize: 17,
                        fontWeight: 600,
                      }}
                    >
                      Yellow Level
                    </p>

                    <p
                      style={{
                        margin: "4px 0 10px",
                        color: "rgba(255,255,255,0.76)",
                        fontSize: 14,
                        fontWeight: 400,
                      }}
                    >
                      3 of 5 challenges completed
                    </p>

                    <div
                      style={{
                        width: "100%",
                        height: 9,
                        borderRadius: 99,
                        overflow: "hidden",
                        background: "rgba(255,255,255,0.18)",
                      }}
                    >
                      <div
                        style={{
                          width: "60%",
                          height: "100%",
                          borderRadius: 99,
                          background: "#facc15",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </HomeCard>

              <HomeCard
                title="Today's Activity"
                tone="blue"
                onClick={() => navigate("/activities")}
                icon={
                  <img
                    src="/todays-activity.png"
                    alt=""
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: "contain",
                    margin: "0 auto 32px",
                      borderRadius: 10,
                    }}
                  />
                }
                visual={
                  <svg width="82" height="58" viewBox="0 0 82 58" fill="none">
                    <path
                      d="M5 44c12-17 18-7 27-19 9-11 15 7 24-3 7-8 12-4 21-14"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="5 6"
                    />
                    <circle cx="5" cy="44" r="4" fill="currentColor" />
                    <circle cx="77" cy="8" r="4" fill="currentColor" />
                  </svg>
                }
              >
                <p
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  Group Run
                </p>

                <p
                  style={{
                    margin: "7px 0 0",
                    color: "rgba(255,255,255,0.78)",
                    fontSize: 15,
                    lineHeight: 1.5,
                    fontWeight: 400,
                  }}
                >
                  6:00 AM
                  <br />
                  The Grove · Windermere
                </p>
              </HomeCard>

              <HomeCard
                title="Performance"
                tone="blue"
                onClick={() => navigate("/performance-ai")}
                icon={
                  <img
                    src="/performance.png"
                    alt=""
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: "contain",
                    margin: "0 auto 32px",
                      borderRadius: 10,
                    }}
                  />
                }
                visual={
                  <svg width="82" height="58" viewBox="0 0 82 58" fill="none">
                    <path
                      d="M4 47 18 38 30 42 44 24 57 30 78 9"
                      stroke="currentColor"
                      strokeWidth="3.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 54h74"
                      stroke="currentColor"
                      strokeWidth="1"
                      opacity="0.24"
                    />
                    <circle cx="78" cy="9" r="4" fill="currentColor" />
                  </svg>
                }
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 10,
                  }}
                >
                  {[
                    { value: "0", label: "km" },
                    { value: "0", label: "activities" },
                    { value: "--", label: "avg pace" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        padding: "10px 4px",
                        borderRadius: 10,
                        textAlign: "center",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          color: "#ffffff",
                          fontSize: 20,
                          fontWeight: 600,
                        }}
                      >
                        {item.value}
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          color: "rgba(255,255,255,0.70)",
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </HomeCard>

              <HomeCard
                title="My Community"
                onClick={() => navigate("/memberships")}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  No active community
                </p>

                <p
                  style={{
                    margin: "7px 0 0",
                    color: "rgba(255,255,255,0.76)",
                    fontSize: 14,
                    lineHeight: 1.5,
                    fontWeight: 400,
                  }}
                >
                  Join a community to access updates, challenges, videos and
                  upcoming events.
                </p>
              </HomeCard>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <ActionButton
                  label="Activities"
                  onClick={() => navigate("/activities")}
                />

                <ActionButton
                  label="Profile"
                  onClick={() => navigate("/profile")}
                />
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              <div
                style={{
                  padding: "6px 2px 8px",
                  color: "#ffffff",
                }}
              >

                <h1
                  style={{
                    margin: "12px 0 0",
                    maxWidth: 520,
                    fontSize: "clamp(27px, 7vw, 38px)",
                    lineHeight: 1.08,
                    fontWeight: 500,
                    letterSpacing: "-0.025em",
                  }}
                >
                  Transform your life through sports and challenges.
                </h1>

                <p
                  style={{
                    margin: "12px 0 0",
                    maxWidth: 500,
                    color: "rgba(255,255,255,0.72)",
                    fontSize: 14,
                    lineHeight: 1.5,
                    fontWeight: 400,
                  }}
                >
                  Join a community, complete challenges and track your progress.
                </p>
              </div>

              <HomeCard title="How it works" tone="blue">
                <div
                  style={{
                    display: "grid",
                    gap: 11,
                  }}
                >
                  {[
                    "Join a sports community",
                    "Complete challenges",
                    "Progress through shirt colors",
                    "Track your performance",
                  ].map((item, index) => (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          flexShrink: 0,
                          borderRadius: 99,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(255,255,255,0.16)",
                          color: "#ffffff",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {index + 1}
                      </div>

                      <p
                        style={{
                          margin: 0,
                          color: "#ffffff",
                          fontSize: 15,
                          fontWeight: 500,
                        }}
                      >
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </HomeCard>

              <HomeCard
                title="Public Activities"
                tone="blue"
                onClick={() => navigate("/activities")}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  Find activities near you
                </p>

                <p
                  style={{
                    margin: "7px 0 0",
                    color: "rgba(255,255,255,0.76)",
                    fontSize: 14,
                    lineHeight: 1.5,
                    fontWeight: 400,
                  }}
                >
                  Explore runs, cycling sessions, sports events and community
                  activities.
                </p>
              </HomeCard>

              <HomeCard
                title="Communities"
                tone="blue"
                onClick={() => navigate("/memberships")}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  Find your community
                </p>

                <p
                  style={{
                    margin: "7px 0 0",
                    color: "rgba(255,255,255,0.76)",
                    fontSize: 14,
                    lineHeight: 1.5,
                    fontWeight: 400,
                  }}
                >
                  Join people with similar goals and start your sports journey.
                </p>
              </HomeCard>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <ActionButton
                  label="Sign In"
                  onClick={() => navigate("/login")}
                />

                <ActionButton
                  label="Create Account"
                  onClick={() => navigate("/signup")}
                  primary
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}