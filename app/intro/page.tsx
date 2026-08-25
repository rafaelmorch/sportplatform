"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Montserrat } from "next/font/google";
import { supabaseBrowser } from "@/lib/supabase-browser";
import UserAvatar from "@/components/UserAvatar";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

function IconBox({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        width: 34,
        height: 34,
        flexShrink: 0,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        background: `${color}12`,
      }}
    >
      {children}
    </div>
  );
}

function SmallCard({
  title,
  text,
  color,
  icon,
  onClick,
  children,
}: {
  title: string;
  text: string;
  color: string;
  icon: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <section
      onClick={onClick}
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        minWidth: 0,
        minHeight: 220,
        boxSizing: "border-box",
        borderRadius: 8,
        border: `1px solid ${color}55`,
        background: `
          radial-gradient(circle at 50% 0%, ${color}16, transparent 40%),
          linear-gradient(180deg,#0a0c10,#060709)
        `,
        padding: "13px 8px 10px",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
            background: `${color}12`,
            marginBottom: 9,
          }}
        >
          {icon}
        </div>

        <h2
          style={{
            margin: 0,
            color,
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.18,
            minHeight: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin: "7px 0 0",
            color: "rgba(255,255,255,.68)",
            fontSize: 10.5,
            lineHeight: 1.35,
          }}
        >
          {text}
        </p>

        {children && (
          <div
            style={{
              width: "100%",
              marginTop: "auto",
            }}
          >
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

type IntroCommunity = {
  id: string;
  name: string | null;
  short_description: string | null;
  cover_image_url: string | null;
  banner_image_url: string | null;
};

export default function IntroPage() {
  const router = useRouter();

  const supabase = useMemo(() => supabaseBrowser, []);
  const [communities, setCommunities] = useState<IntroCommunity[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [connectedSource, setConnectedSource] = useState<string | null>(null);
  const [latestActivity, setLatestActivity] = useState<{
    name: string | null;
    sport_type: string | null;
    start_date: string | null;
    distance_m: number | null;
    moving_time_s: number | null;
    provider: string | null;
    device_name: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCommunities() {
      const { data, error } = await supabase
        .from("app_membership_communities")
        .select("id,name,short_description,cover_image_url,banner_image_url")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("Error loading intro communities:", error);
        setCommunities([]);
        return;
      }

      setCommunities((data as IntroCommunity[]) ?? []);
    }

    loadCommunities();

    return () => {
      cancelled = true;
    };
  }, [supabase]);


  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      const user = session?.user ?? null;

      if (cancelled) return;

      if (!user) {
        setUserName(null);
        setConnectedSource(null);
        setLatestActivity(null);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error loading intro profile:", profileError);
      }

      const metadata = user.user_metadata ?? {};

      const fallbackName =
        metadata.full_name ||
        metadata.name ||
        metadata.display_name ||
        user.email?.split("@")[0] ||
        "";

      const displayName = profile?.full_name || fallbackName;
      setUserName(String(displayName).trim() || null);

      const [stravaResult, activitySourceResult, activityResult] =
        await Promise.all([
          supabase
            .from("strava_tokens")
            .select("athlete_id")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("user_activity_source")
            .select("provider")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("imported_activities")
            .select(
              "name,sport_type,start_date,distance_m,moving_time_s,provider,device_name"
            )
            .eq("user_id", user.id)
            .order("start_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      let garminConnected = false;

      if (session?.access_token) {
        try {
          const garminResponse = await fetch("/api/garmin/status", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (garminResponse.ok) {
            const garminData = await garminResponse.json();
            garminConnected = !!garminData?.connected;
          }
        } catch (error) {
          console.error("Error loading Garmin status on Intro:", error);
        }
      }

      let source: string | null = null;

      if (activitySourceResult.data?.provider === "health_connect") {
        source = "Health Connect";
      } else if (garminConnected) {
        source = "Garmin";
      } else if (stravaResult.data?.athlete_id) {
        source = "Strava";
      }

      if (!cancelled) {
        setConnectedSource(source);
        setLatestActivity(activityResult.data ?? null);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const formatActivityAge = (startDate: string | null) => {
    if (!startDate) return null;

    const time = new Date(startDate).getTime();
    if (Number.isNaN(time)) return null;

    const days = Math.max(
      0,
      Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24))
    );

    if (days === 0) return "hoje";
    if (days === 1) return "há 1 dia";
    return `há ${days} dias`;
  };

  const latestActivitySummary = latestActivity
    ? [
        latestActivity.sport_type || latestActivity.name || "Atividade",
        latestActivity.distance_m != null
          ? `${(Number(latestActivity.distance_m) / 1000).toFixed(1).replace(".", ",")} km`
          : null,
        formatActivityAge(latestActivity.start_date),
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  const connectedDevice =
    connectedSource ||
    latestActivity?.device_name ||
    (latestActivity?.provider === "garmin"
      ? "Garmin"
      : latestActivity?.provider === "strava"
        ? "Strava"
        : latestActivity?.provider === "health_connect"
          ? "Health Connect"
          : null);

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
        background: "#030405",
        color: "#fff",
        fontFamily: montserrat.style.fontFamily,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "calc(115px + env(safe-area-inset-bottom))",
        }}
      >
        {/* HERO */}
        <section
          style={{
            position: "relative",
            height: "clamp(265px, 36dvh, 360px)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url("/intro-hero-new.png")`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `
                linear-gradient(
                  to bottom,
                  rgba(0,0,0,.05) 0%,
                  rgba(0,0,0,.08) 45%,
                  rgba(0,0,0,.50) 72%,
                  #030405 100%
                )
              `,
            }}
          />

          <img
            src="/logo-sports-platform.png"
            alt="Sports Platform"
            style={{
              position: "absolute",
              top: "calc(160px + env(safe-area-inset-top))",
              left: "50%",
              transform: "translateX(-50%)",
              width: "clamp(276px,66vw,420px)",
              maxWidth: "calc(100% - 32px)",
              height: "auto",
            }}
          />
        </section>

        <div
          style={{
            width: "100%",
            maxWidth: 520,
            margin: "-40px auto 0",
            marginLeft: "auto",
            marginRight: "auto",
            padding: "0 16px",
            boxSizing: "border-box",
            position: "relative",
            zIndex: 3,
          }}
        >
          {/* INTRO */}
          <h1
            style={{
              margin: 0,
              maxWidth: 300,
              color: "#ffffff",
              fontSize: "clamp(22px, 5.2vw, 27px)",
              lineHeight: 1.05,
              fontWeight: 600,
              letterSpacing: "-0.03em",
            }}
          >
            Transforme sua vida
            <br />
            através do esporte.
          </h1>

          <div
            aria-hidden="true"
            style={{
              width: 48,
              height: 3,
              borderRadius: 999,
              background: "#2f80ff",
              marginTop: 8,
              boxShadow: "0 0 10px rgba(47,128,255,.45)",
            }}
          />

          <p
            style={{
              margin: "10px 0 0",
              color: "rgba(255,255,255,.58)",
              fontSize: 12.5,
              lineHeight: 1.5,
              maxWidth: 450,
            }}
          >
            Comunidade, desafios, performance e inteligência para acompanhar
            cada etapa da sua evolução.
          </p>

          {/* LOGIN / SAUDAÇÃO */}
          {userName ? (
            <div
              style={{
                marginTop: 10,
                minHeight: 48,
                padding: "15px 16px 14px",
                boxSizing: "border-box",
                borderRadius: 8,
                border: "1px solid transparent",
                background: "radial-gradient(circle at 100% 50%, rgba(47,128,255,.10), transparent 38%), linear-gradient(135deg, rgba(10,18,30,.96), rgba(4,8,14,.98)) padding-box, linear-gradient(115deg, #22d3ee 0%, #38bdf8 20%, #2684ff 45%, #3155ff 70%, #0ea5e9 100%) border-box",
                boxShadow: "0 0 10px rgba(34,211,238,.12), 0 0 20px rgba(38,132,255,.16), 0 0 28px rgba(49,85,255,.10), inset 0 0 18px rgba(47,128,255,.035)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 10,
                  color: "#ffffff",
                }}
              >
                <UserAvatar name={userName} size={36} />
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  Olá, {userName}
                </span>
              </div>

              {(connectedDevice || latestActivitySummary) && (
                <div
                  style={{
                    marginTop: 7,
                    marginLeft: 46,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    fontSize: 10.5,
                    lineHeight: 1.4,
                    color: "rgba(255,255,255,.58)",
                  }}
                >
                  {connectedDevice && (
                    <span>
                      Conectado ao <span style={{ color: "#2684ff", fontWeight: 500 }}>{connectedDevice}</span>
                    </span>
                  )}

                  <div
                    style={{
                      height: 1,
                      margin: "8px 0 7px",
                      background: "rgba(255,255,255,.08)",
                    }}
                  />
                  {latestActivitySummary && (
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#ffffff",
                        lineHeight: 1.35,
                      }}
                    >
                      Última atividade: {latestActivitySummary}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{
                width: "100%",
                height: 48,
                marginTop: 10,
                borderRadius: 10,
                border: "1px solid rgba(38,132,255,.95)",
                background: "linear-gradient(135deg, #1688ff 0%, #0568e8 100%)",
                color: "#ffffff",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                style={{ color: "#ffffff" }}
              >
                <path
                  d="M10 17l5-5-5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 12H4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M13 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Entrar
            </button>
          )}

<p
            style={{
              margin: "9px 0 18px",
              textAlign: "center",
              color: "rgba(255,255,255,.30)",
              fontSize: 9.5,
            }}
          >
            Seus dados protegidos. Sua jornada é sua.
          </p>

          <p
            style={{
              margin: "0 0 10px",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: ".02em",
              textTransform: "uppercase",
            }}
          >
            Tudo que você precisa para evoluir
          </p>

          <div style={{ display: "grid", gap: 10 }}>
          <div
            style={{
              width: "calc(100% + 32px)",
              marginLeft: -16,
              marginRight: -16,
              padding: "18px 16px 16px",
              boxSizing: "border-box",
              background: "#1c1f24",
            }}
          >
            <section
              style={{
                width: "100%",
                marginTop: 4,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontSize: 21,
                    lineHeight: 1.15,
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                  }}
                >
                  Comunidades
                </h2>

                <button
                  type="button"
                  onClick={() => navigate("/groups")}
                  style={{
                    border: 0,
                    padding: 0,
                    background: "transparent",
                    color: "#2f80ff",
                    fontFamily: "inherit",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Ver todas
                </button>
              </div>

              <p
                style={{
                  margin: "7px 0 13px",
                  maxWidth: 410,
                  color: "rgba(255,255,255,.54)",
                  fontSize: 11.5,
                  lineHeight: 1.5,
                }}
              >
                Encontre pessoas que compartilham seus objetivos, sua rotina
                e sua paixão pelo esporte.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  width: "calc(100% + 16px)",
                  overflowX: "auto",
                  overflowY: "hidden",
                  marginRight: -16,
                  paddingRight: 16,
                  paddingBottom: 4,
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                }}
              >
                {communities.map((community) => {
                  const image =
                    community.cover_image_url ||
                    community.banner_image_url;

                  return (
                    <button
                      key={community.id}
                      type="button"
                      onClick={() =>
                        navigate(`/groups/${community.id}`)
                      }
                      style={{
                        position: "relative",
                        flex: "0 0 76%",
                        maxWidth: 300,
                        aspectRatio: "16 / 10",
                        overflow: "hidden",
                        padding: 0,
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,.10)",
                        background: "#090b0e",
                        scrollSnapAlign: "start",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "left",
                      }}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={community.name || "Comunidade"}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : null}

                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(to bottom, rgba(0,0,0,.02) 30%, rgba(0,0,0,.22) 58%, rgba(0,0,0,.93) 100%)",
                        }}
                      />

                      <div
                        style={{
                          position: "absolute",
                          left: 13,
                          right: 13,
                          bottom: 12,
                        }}
                      >
                        <div
                          style={{
                            color: "#ffffff",
                            fontSize: 15,
                            fontWeight: 600,
                            lineHeight: 1.2,
                            textShadow:
                              "0 2px 8px rgba(0,0,0,.65)",
                          }}
                        >
                          {community.name || "Comunidade"}
                        </div>

                        {community.short_description && (
                          <div
                            style={{
                              marginTop: 4,
                              color: "rgba(255,255,255,.70)",
                              fontSize: 10,
                              lineHeight: 1.35,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {community.short_description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 11,
                marginBottom: 20,
                overflowX: "auto",
                whiteSpace: "nowrap",
                scrollbarWidth: "none",
                color: "rgba(255,255,255,.65)",
                fontSize: 10.5,
                fontWeight: 500,
              }}
            >
              <span>Desafios & Journey</span>
              <span style={{ color: "#2f80ff" }}>•</span>
              <span>Performance</span>
              <span style={{ color: "#2f80ff" }}>•</span>
              <span>Fórum</span>
              <span style={{ color: "#2f80ff" }}>•</span>
              <span>Conteúdo Especializado</span>
            </div>

          </div>

            {/* ATIVIDADES */}
            <section
              onClick={() => navigate("/activities")}
              style={{
                position: "relative",
                overflow: "hidden",
                width: "100%",
                boxSizing: "border-box",
                borderRadius: 8,
                border: "1px solid rgba(59,130,246,.48)",
                background: `
                  radial-gradient(circle at 100% 50%, rgba(59,130,246,.10), transparent 42%),
                  linear-gradient(135deg,#0a0d12,#060709)
                `,
                padding: "14px 15px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "42px minmax(0,1fr) 38px",
                  gap: 11,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src="/activities-icon.png"
                    alt="Atividades"
                    style={{
                      display: "block",
                      width: "48px",
                      height: "48px",
                      objectFit: "contain",
                    }}
                  />
                </div>

                <div style={{ minWidth: 0, transform: "translateX(5px)" }}>
                  <h2
                    style={{
                      margin: 0,
                      color: "#3b82f6",
                      fontSize: 15,
                      fontWeight: 600,
                    }}
                  >
                    Atividades
                  </h2>

                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: 500,
                      lineHeight: 1.3,
                    }}
                  >
                    Encontre atividades perto de você
                  </p>

                  <p
                    style={{
                      margin: "3px 0 0",
                      color: "rgba(255,255,255,.52)",
                      fontSize: 10,
                      lineHeight: 1.35,
                    }}
                  >
                    Corridas, pedaladas, eventos e muito mais.
                  </p>
                </div>

                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: "1px solid rgba(59,130,246,.32)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#3b82f6",
                    fontSize: 22,
                  }}
                >
                  →
                </div>
              </div>

              <img
                src="/activities-journey.png"
                alt="Jornada de atividades"
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  marginTop: 12,
                  objectFit: "contain",
                }}
              />
            </section>

            {/* COACH IA */}
            <section
              onClick={() => navigate("/performance-ai")}
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 8,
                border: "1px solid rgba(212,175,55,.72)",
                background: `
                  radial-gradient(circle at 85% 15%, rgba(212,175,55,.09), transparent 38%),
                  linear-gradient(145deg,#0b0c0e,#050607)
                `,
                padding: "12px",
                boxShadow: "0 0 24px rgba(212,175,55,.07)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) 86px",
                  gap: 14,
                  alignItems: "center",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color: "#f1c94b",
                      fontSize: 23,
                      lineHeight: 1.1,
                      fontWeight: 600,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    Coach IA
                  </h2>

                  <p
                    style={{
                      margin: "10px 0 0",
                      color: "rgba(255,255,255,.72)",
                      fontSize: 11.5,
                      lineHeight: 1.55,
                    }}
                  >
                    Seu treinador inteligente 24/7. Planos personalizados,
                    insights e recomendações para você evoluir todos os dias.
                  </p>
                </div>

                <div>
                  <p
                    style={{
                      margin: "0 0 7px",
                      textAlign: "center",
                      color: "rgba(255,255,255,.82)",
                      fontSize: 9.5,
                      fontWeight: 500,
                    }}
                  >
                    Seu progresso
                  </p>

                  <div
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: "50%",
                      padding: 6,
                      boxSizing: "border-box",
                      background:
                        "conic-gradient(#ff2d2d 0deg,#ff7a00 55deg,#ffd60a 110deg,#c86bff 185deg,#6f3cff 235deg,#1e7bff 300deg,#12d7ff 360deg)",
                      boxShadow: "0 0 16px rgba(30,123,255,.18)",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        background: "#070809",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          color: "#ffffff",
                          fontSize: 20,
                          lineHeight: 1,
                          fontWeight: 600,
                        }}
                      >
                        78%
                      </span>

                      <span
                        style={{
                          marginTop: 4,
                          color: "rgba(255,255,255,.76)",
                          fontSize: 8.5,
                          fontWeight: 500,
                        }}
                      >
                        Excelente
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/performance-ai");
                }}
                style={{
                  marginTop: 10,
                  height: 42,
                  padding: "0 15px",
                  borderRadius: 11,
                  border: "1px solid rgba(212,175,55,.72)",
                  background: "rgba(212,175,55,.04)",
                  color: "#ffffff",
                  fontFamily: "inherit",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Conhecer o Coach IA
              </button>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px 14px",
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: "1px solid rgba(212,175,55,.16)",
                }}
              >
                {[
                  {
                    label: "Plano personalizado",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
                        <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      </svg>
                    ),
                  },
                  {
                    label: "Treinos inteligentes",
                    icon: (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                        <path d="M4 10v4M7 7v10M17 7v10M20 10v4M7 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    ),
                  },
                  {
                    label: "Análises e insights",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 19v-6M10 19V9M15 19v-4M20 19V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    ),
                  },
                  {
                    label: "Recomendações diárias",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 6h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-8l-4 3v-3H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                      </svg>
                    ),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "20px minmax(0,1fr)",
                      gap: 7,
                      alignItems: "center",
                      color: "#f1c94b",
                    }}
                  >
                    {item.icon}

                    <span
                      style={{
                        color: "rgba(255,255,255,.78)",
                        fontSize: 9.5,
                        lineHeight: 1.3,
                        fontWeight: 500,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div
            style={{
              height: 110,
            }}
          />
        </div>
      </div>
    </main>
  );
}
































