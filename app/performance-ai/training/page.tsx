"use client";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import PerformanceAiBackButton from "@/components/performance-ai/PerformanceAiBackButton";
import { supabaseBrowser } from "@/lib/supabase-browser";

type RangeKey = "7d" | "30d" | "6m" | "all";

type StravaActivityRow = {
  id: string;
  athlete_id: number;
  name: string | null;
  type: string | null;
  sport_type: string | null;
  start_date: string | null;
  distance: number | null;
  moving_time: number | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
  total_elevation_gain?: number | null;
};

function startOfDayLocal(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function isInRange(
  dateString: string | null,
  range: RangeKey,
  now: Date
) {
  if (range === "all") {
    return true;
  }

  if (!dateString) {
    return false;
  }

  const activityDate = new Date(dateString);

  if (Number.isNaN(activityDate.getTime())) {
    return false;
  }

  const today = startOfDayLocal(now);
  const day = startOfDayLocal(activityDate);

  const differenceInDays = Math.floor(
    (today.getTime() - day.getTime()) / 86400000
  );

  if (range === "7d") {
    return differenceInDays >= 0 && differenceInDays <= 6;
  }

  if (range === "30d") {
    return differenceInDays >= 0 && differenceInDays <= 29;
  }

  if (range === "6m") {
    return differenceInDays >= 0 && differenceInDays <= 179;
  }

  return true;
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) {
    return "0 min";
  }

  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}min`;
}

function formatActivityDate(dateString: string | null) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(dateString: string | null) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function calculatePace(
  distanceMeters: number | null,
  movingTimeSeconds: number | null
) {
  if (
    !distanceMeters ||
    distanceMeters <= 0 ||
    !movingTimeSeconds ||
    movingTimeSeconds <= 0
  ) {
    return "-";
  }

  const distanceKm = distanceMeters / 1000;
  const secondsPerKm = movingTimeSeconds / distanceKm;

  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
}

function getActivityName(activity: StravaActivityRow) {
  return (
    activity.name ??
    activity.sport_type ??
    activity.type ??
    "Atividade"
  );
}

function getTrainingInsight(params: {
  activityCount: number;
  distanceKm: number;
  movingTimeSeconds: number;
  averageHeartRate: number | null;
}) {
  const {
    activityCount,
    distanceKm,
    movingTimeSeconds,
    averageHeartRate,
  } = params;

  const trainingHours = movingTimeSeconds / 3600;

  if (activityCount === 0) {
    return "Nenhuma atividade encontrada neste período. Comece com uma sessão leve para retomar a consistência.";
  }

  if (distanceKm >= 35 || trainingHours >= 5) {
    return "Seu volume está elevado neste período. Priorize recuperação, sono e sessões leves antes de aumentar novamente a carga.";
  }

  if (averageHeartRate && averageHeartRate >= 155) {
    return "A frequência cardíaca média indica esforço elevado. Evite acumular vários treinos intensos em sequência.";
  }

  if (activityCount >= 4) {
    return "Boa frequência de treinamento. O principal agora é manter consistência sem aumentar volume e intensidade ao mesmo tempo.";
  }

  if (activityCount >= 2) {
    return "Sua rotina está ativa. Mantenha regularidade e faça aumentos graduais de volume.";
  }

  return "Você iniciou o período com uma atividade. Tente distribuir os próximos treinos com espaço suficiente para recuperação.";
}

export default function TrainingPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser, []);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stravaConnected, setStravaConnected] =
    useState(false);

  const [activities, setActivities] = useState<
    StravaActivityRow[]
  >([]);

  const [range, setRange] = useState<RangeKey>("7d");
  const [message, setMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        setMessage(null);

        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        const user = authData.user;

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: tokenRow, error: tokenError } =
          await supabase
            .from("strava_tokens")
            .select("athlete_id")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (tokenError) {
          throw tokenError;
        }

        if (!tokenRow?.athlete_id) {
          setStravaConnected(false);
          setActivities([]);
          return;
        }

        setStravaConnected(true);

        const { data: activitiesData, error: activitiesError } =
          await supabase
            .from("strava_activities")
            .select(
              "id, athlete_id, name, type, sport_type, start_date, distance, moving_time, average_heartrate, max_heartrate, total_elevation_gain"
            )
            .eq("athlete_id", tokenRow.athlete_id)
            .order("start_date", { ascending: false })
            .limit(200);

        if (activitiesError) {
          throw activitiesError;
        }

        setActivities(
          (activitiesData ?? []) as StravaActivityRow[]
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Não foi possível carregar seus treinamentos.";

        setMessage(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [router, supabase]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setMessage(null);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const accessToken =
        sessionData.session?.access_token ?? null;

      if (!accessToken) {
        setMessage(
          "Você precisa estar logado para sincronizar."
        );
        return;
      }

      const response = await fetch("/api/strava/sync", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          json?.message ??
            "Não foi possível sincronizar com o Strava."
        );
      }

      setMessage(
        typeof json?.fetched === "number"
          ? `${json.fetched} atividades verificadas. Atualizando dados...`
          : "Sincronização concluída. Atualizando dados..."
      );

      window.location.reload();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro inesperado ao sincronizar.";

      setMessage(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  const filteredActivities = useMemo(() => {
    const now = new Date();

    return activities.filter((activity) =>
      isInRange(activity.start_date, range, now)
    );
  }, [activities, range]);

  const activityCount = filteredActivities.length;

  const totalDistanceKm = filteredActivities.reduce(
    (total, activity) =>
      total + (activity.distance ?? 0) / 1000,
    0
  );

  const totalMovingTime = filteredActivities.reduce(
    (total, activity) =>
      total + (activity.moving_time ?? 0),
    0
  );

  const totalElevation = filteredActivities.reduce(
    (total, activity) =>
      total + (activity.total_elevation_gain ?? 0),
    0
  );

  const activitiesWithHeartRate = filteredActivities.filter(
    (activity) =>
      activity.average_heartrate != null &&
      activity.average_heartrate > 0
  );

  const averageHeartRate =
    activitiesWithHeartRate.length > 0
      ? Math.round(
          activitiesWithHeartRate.reduce(
            (total, activity) =>
              total +
              (activity.average_heartrate ?? 0),
            0
          ) / activitiesWithHeartRate.length
        )
      : null;

  const maxHeartRate =
    filteredActivities.length > 0
      ? Math.max(
          0,
          ...filteredActivities.map(
            (activity) =>
              activity.max_heartrate ?? 0
          )
        )
      : null;

  const averageDistance =
    activityCount > 0
      ? totalDistanceKm / activityCount
      : 0;

  const insight = getTrainingInsight({
    activityCount,
    distanceKm: totalDistanceKm,
    movingTimeSeconds: totalMovingTime,
    averageHeartRate,
  });

  const chartActivities = [...filteredActivities]
    .slice(0, 12)
    .reverse();

  const chartWidth = 900;
  const chartHeight = 250;
  const chartPaddingX = 38;
  const chartPaddingTop = 28;
  const chartPaddingBottom = 42;

  const maxChartDistance = Math.max(
    1,
    ...chartActivities.map(
      (activity) => (activity.distance ?? 0) / 1000
    )
  );

  const chartPoints = chartActivities.map(
    (activity, index) => {
      const distanceKm =
        (activity.distance ?? 0) / 1000;

      const usableWidth =
        chartWidth - chartPaddingX * 2;

      const usableHeight =
        chartHeight -
        chartPaddingTop -
        chartPaddingBottom;

      const x =
        chartActivities.length <= 1
          ? chartWidth / 2
          : chartPaddingX +
            (index * usableWidth) /
              (chartActivities.length - 1);

      const y =
        chartHeight -
        chartPaddingBottom -
        (distanceKm / maxChartDistance) *
          usableHeight;

      return {
        x,
        y,
        distanceKm,
        label: formatShortDate(
          activity.start_date
        ),
      };
    }
  );

  const linePath =
    chartPoints.length > 0
      ? chartPoints
          .map(
            (point, index) =>
              `${index === 0 ? "M" : "L"} ${point.x.toFixed(
                1
              )} ${point.y.toFixed(1)}`
          )
          .join(" ")
      : "";

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingStyle}>
          Carregando seus treinamentos...
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={topBarStyle}>
        <PerformanceAiBackButton />

        {stravaConnected ? (
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            style={{
              ...syncButtonStyle,
              opacity: syncing ? 0.65 : 1,
              cursor: syncing
                ? "not-allowed"
                : "pointer",
            }}
          >
            {syncing
              ? "Sincronizando..."
              : "Sincronizar Strava"}
          </button>
        ) : null}
      </div>

      <header style={heroStyle}>
        <div style={eyebrowStyle}>
          Performance AI
        </div>

        <h1 style={titleStyle}>
          Meus{" "}
          <span style={{ color: "#fff1a8" }}>
            Treinamentos
          </span>
        </h1>

        <p style={subtitleStyle}>
          Acompanhe sua carga, distância,
          frequência cardíaca e evolução com os
          dados sincronizados do Strava.
        </p>
      </header>

      {!stravaConnected ? (
        <section style={connectionCardStyle}>
          <div>
            <div style={cardEyebrowStyle}>
              Integração necessária
            </div>

            <h2 style={connectionTitleStyle}>
              Conecte seu Strava
            </h2>

            <p style={connectionTextStyle}>
              Conecte sua conta para visualizar
              atividades, duração, distância,
              frequência cardíaca e evolução.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/integrations")
            }
            style={goldButtonStyle}
          >
            Ir para integrações
          </button>
        </section>
      ) : (
        <>
          <section style={rangeSectionStyle}>
            <div style={rangeLabelStyle}>
              Período
            </div>

            <div style={rangeButtonsStyle}>
              {[
                {
                  key: "7d" as RangeKey,
                  label: "7 dias",
                },
                {
                  key: "30d" as RangeKey,
                  label: "30 dias",
                },
                {
                  key: "6m" as RangeKey,
                  label: "6 meses",
                },
                {
                  key: "all" as RangeKey,
                  label: "Tudo",
                },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    setRange(item.key)
                  }
                  style={
                    range === item.key
                      ? rangeButtonActiveStyle
                      : rangeButtonStyle
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section style={metricsGridStyle}>
            <article style={metricCardStyle}>
              <div style={metricLabelStyle}>
                Atividades
              </div>
              <div style={metricValueStyle}>
                {activityCount}
              </div>
              <div style={metricDetailStyle}>
                no período selecionado
              </div>
            </article>

            <article style={metricCardStyle}>
              <div style={metricLabelStyle}>
                Distância
              </div>
              <div style={metricValueStyle}>
                {totalDistanceKm.toFixed(1)}
              </div>
              <div style={metricDetailStyle}>
                quilômetros
              </div>
            </article>

            <article style={metricCardStyle}>
              <div style={metricLabelStyle}>
                Tempo
              </div>
              <div style={metricValueStyle}>
                {formatDuration(
                  totalMovingTime
                )}
              </div>
              <div style={metricDetailStyle}>
                em movimento
              </div>
            </article>

            <article style={metricCardStyle}>
              <div style={metricLabelStyle}>
                FC média
              </div>
              <div style={metricValueStyle}>
                {averageHeartRate
                  ? `${averageHeartRate}`
                  : "-"}
              </div>
              <div style={metricDetailStyle}>
                {averageHeartRate
                  ? "batimentos por minuto"
                  : "sem dados"}
              </div>
            </article>
          </section>

          <section style={insightCardStyle}>
            <div style={cardEyebrowStyle}>
              Leitura do período
            </div>

            <div style={insightTextStyle}>
              {insight}
            </div>
          </section>

          <section style={sectionCardStyle}>
            <div style={sectionHeadingRowStyle}>
              <div>
                <div style={cardEyebrowStyle}>
                  Evolução
                </div>

                <h2 style={sectionTitleStyle}>
                  Distância por atividade
                </h2>
              </div>

              <div style={averageBadgeStyle}>
                Média:{" "}
                {averageDistance.toFixed(1)} km
              </div>
            </div>

            {chartPoints.length === 0 ? (
              <div style={emptyStateStyle}>
                Nenhuma atividade encontrada neste
                período.
              </div>
            ) : (
              <div style={chartContainerStyle}>
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  preserveAspectRatio="none"
                  style={chartSvgStyle}
                  aria-label="Gráfico de distância por atividade"
                >
                  <defs>
                    <linearGradient
                      id="trainingAreaGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="rgba(255,241,168,0.22)"
                      />
                      <stop
                        offset="100%"
                        stopColor="rgba(255,241,168,0.01)"
                      />
                    </linearGradient>
                  </defs>

                  {[0, 1, 2, 3].map(
                    (step) => {
                      const y =
                        chartPaddingTop +
                        ((chartHeight -
                          chartPaddingTop -
                          chartPaddingBottom) /
                          3) *
                          step;

                      return (
                        <line
                          key={step}
                          x1={chartPaddingX}
                          x2={
                            chartWidth -
                            chartPaddingX
                          }
                          y1={y}
                          y2={y}
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="1"
                        />
                      );
                    }
                  )}

                  {chartPoints.length > 1 ? (
                    <path
                      d={`${linePath} L ${
                        chartPoints[
                          chartPoints.length - 1
                        ].x
                      } ${
                        chartHeight -
                        chartPaddingBottom
                      } L ${chartPoints[0].x} ${
                        chartHeight -
                        chartPaddingBottom
                      } Z`}
                      fill="url(#trainingAreaGradient)"
                    />
                  ) : null}

                  {chartPoints.length > 1 ? (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#fff1a8"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : null}

                  {chartPoints.map(
                    (point, index) => (
                      <g key={index}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="6"
                          fill="#050505"
                          stroke="#fff1a8"
                          strokeWidth="3"
                        />

                        <text
                          x={point.x}
                          y={point.y - 15}
                          textAnchor="middle"
                          fontSize="12"
                          fill="#ffffff"
                        >
                          {point.distanceKm.toFixed(
                            1
                          )}
                        </text>

                        <text
                          x={point.x}
                          y={chartHeight - 13}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#9f9fa8"
                        >
                          {point.label}
                        </text>
                      </g>
                    )
                  )}
                </svg>
              </div>
            )}
          </section>

          <section style={sectionCardStyle}>
            <div style={sectionHeadingRowStyle}>
              <div>
                <div style={cardEyebrowStyle}>
                  Histórico
                </div>

                <h2 style={sectionTitleStyle}>
                  Atividades recentes
                </h2>
              </div>

              <div style={summaryNumbersStyle}>
                {totalElevation > 0
                  ? `${Math.round(
                      totalElevation
                    )} m de elevação`
                  : maxHeartRate &&
                      maxHeartRate > 0
                    ? `FC máxima: ${Math.round(
                        maxHeartRate
                      )} bpm`
                    : null}
              </div>
            </div>

            {filteredActivities.length === 0 ? (
              <div style={emptyStateStyle}>
                Nenhuma atividade encontrada neste
                período.
              </div>
            ) : (
              <div style={activitiesListStyle}>
                {filteredActivities
                  .slice(0, 20)
                  .map((activity) => (
                    <article
                      key={activity.id}
                      style={activityCardStyle}
                    >
                      <div style={activityMainStyle}>
                        <div
                          style={activityDateStyle}
                        >
                          {formatActivityDate(
                            activity.start_date
                          )}
                        </div>

                        <div
                          style={activityNameStyle}
                        >
                          {getActivityName(
                            activity
                          )}
                        </div>

                        <div
                          style={activityTypeStyle}
                        >
                          {activity.sport_type ??
                            activity.type ??
                            "Atividade"}
                        </div>
                      </div>

                      <div
                        style={activityMetricsStyle}
                      >
                        <div>
                          <div
                            style={
                              activityMetricValueStyle
                            }
                          >
                            {(
                              (activity.distance ??
                                0) / 1000
                            ).toFixed(1)}{" "}
                            km
                          </div>
                          <div
                            style={
                              activityMetricLabelStyle
                            }
                          >
                            distância
                          </div>
                        </div>

                        <div>
                          <div
                            style={
                              activityMetricValueStyle
                            }
                          >
                            {formatDuration(
                              activity.moving_time
                            )}
                          </div>
                          <div
                            style={
                              activityMetricLabelStyle
                            }
                          >
                            duração
                          </div>
                        </div>

                        <div>
                          <div
                            style={
                              activityMetricValueStyle
                            }
                          >
                            {calculatePace(
                              activity.distance,
                              activity.moving_time
                            )}
                          </div>
                          <div
                            style={
                              activityMetricLabelStyle
                            }
                          >
                            pace
                          </div>
                        </div>

                        <div>
                          <div
                            style={
                              activityMetricValueStyle
                            }
                          >
                            {activity.average_heartrate
                              ? `${Math.round(
                                  activity.average_heartrate
                                )} bpm`
                              : "-"}
                          </div>
                          <div
                            style={
                              activityMetricLabelStyle
                            }
                          >
                            FC média
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            )}
          </section>
        </>
      )}

      {message ? (
        <div style={messageStyle}>
          {message}
        </div>
      ) : null}
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  boxSizing: "border-box",
  padding:
    "max(18px, env(safe-area-inset-top)) 16px max(110px, calc(90px + env(safe-area-inset-bottom)))",
  background:
    "radial-gradient(circle at top right, rgba(255,241,168,0.08), transparent 34%), #050505",
  color: "#ffffff",
  fontFamily: "Montserrat, sans-serif",
};

const loadingStyle: React.CSSProperties = {
  minHeight: "70vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#d4d4d8",
  fontSize: 15,
};

const topBarStyle: React.CSSProperties = {
  width: "min(1100px, 100%)",
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
};

const syncButtonStyle: React.CSSProperties = {
  minHeight: 42,
  padding: "0 16px",
  border: "1px solid rgba(255,241,168,0.35)",
  borderRadius: 8,
  background: "rgba(255,241,168,0.08)",
  color: "#fff1a8",
  fontFamily: "Montserrat, sans-serif",
  fontSize: 13,
  fontWeight: 600,
};

const heroStyle: React.CSSProperties = {
  width: "min(1100px, 100%)",
  margin: "44px auto 0",
  padding: "0 0 34px",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#fff1a8",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.15em",
  lineHeight: 1.4,
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  margin: "13px 0 0",
  color: "#ffffff",
  fontSize: "clamp(38px, 7vw, 64px)",
  fontWeight: 700,
  lineHeight: 1,
  letterSpacing: "-0.045em",
};

const subtitleStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: "18px 0 0",
  color: "#b4b4bc",
  fontSize: "clamp(14px, 2vw, 17px)",
  lineHeight: 1.7,
};

const connectionCardStyle: React.CSSProperties = {
  width: "min(1100px, 100%)",
  margin: "0 auto",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 24,
  flexWrap: "wrap",
  padding: 24,
  border: "1px solid rgba(255,241,168,0.2)",
  borderRadius: 12,
  background: "#111113",
};

const cardEyebrowStyle: React.CSSProperties = {
  color: "#fff1a8",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

const connectionTitleStyle: React.CSSProperties = {
  margin: "9px 0 0",
  color: "#ffffff",
  fontSize: 26,
  fontWeight: 600,
};

const connectionTextStyle: React.CSSProperties = {
  maxWidth: 620,
  margin: "10px 0 0",
  color: "#a1a1aa",
  fontSize: 14,
  lineHeight: 1.65,
};

const goldButtonStyle: React.CSSProperties = {
  minHeight: 44,
  padding: "0 18px",
  border: "1px solid #fff1a8",
  borderRadius: 8,
  background: "#fff1a8",
  color: "#111111",
  fontFamily: "Montserrat, sans-serif",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const rangeSectionStyle: React.CSSProperties = {
  width: "min(1100px, 100%)",
  margin: "0 auto 18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap",
};

const rangeLabelStyle: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: 13,
};

const rangeButtonsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const rangeButtonStyle: React.CSSProperties = {
  minHeight: 38,
  padding: "0 14px",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  background: "#111113",
  color: "#a1a1aa",
  fontFamily: "Montserrat, sans-serif",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
};

const rangeButtonActiveStyle: React.CSSProperties = {
  ...rangeButtonStyle,
  border: "1px solid rgba(255,241,168,0.45)",
  background: "rgba(255,241,168,0.12)",
  color: "#fff1a8",
};

const metricsGridStyle: React.CSSProperties = {
  width: "min(1100px, 100%)",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 12,
};

const metricCardStyle: React.CSSProperties = {
  minHeight: 132,
  boxSizing: "border-box",
  padding: 18,
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 10,
  background: "#111113",
};

const metricLabelStyle: React.CSSProperties = {
  color: "#9f9fa8",
  fontSize: 12,
  lineHeight: 1.4,
};

const metricValueStyle: React.CSSProperties = {
  marginTop: 14,
  color: "#ffffff",
  fontSize: 30,
  fontWeight: 600,
  lineHeight: 1,
};

const metricDetailStyle: React.CSSProperties = {
  marginTop: 9,
  color: "#73737c",
  fontSize: 11,
};

const insightCardStyle: React.CSSProperties = {
  width: "min(1100px, 100%)",
  margin: "14px auto 0",
  boxSizing: "border-box",
  padding: 20,
  borderLeft: "3px solid #fff1a8",
  borderRadius: 8,
  background: "#111113",
};

const insightTextStyle: React.CSSProperties = {
  marginTop: 10,
  color: "#d4d4d8",
  fontSize: 14,
  lineHeight: 1.7,
};

const sectionCardStyle: React.CSSProperties = {
  width: "min(1100px, 100%)",
  margin: "16px auto 0",
  boxSizing: "border-box",
  padding: 20,
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 12,
  background: "#0d0d0f",
};

const sectionHeadingRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#ffffff",
  fontSize: 24,
  fontWeight: 600,
};

const averageBadgeStyle: React.CSSProperties = {
  padding: "7px 10px",
  border: "1px solid rgba(255,241,168,0.2)",
  borderRadius: 7,
  background: "rgba(255,241,168,0.07)",
  color: "#fff1a8",
  fontSize: 12,
};

const chartContainerStyle: React.CSSProperties = {
  marginTop: 22,
  overflowX: "auto",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 10,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.025), transparent)",
};

const chartSvgStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 720,
  height: 280,
  display: "block",
};

const summaryNumbersStyle: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: 12,
};

const activitiesListStyle: React.CSSProperties = {
  marginTop: 20,
  display: "grid",
  gap: 10,
};

const activityCardStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(160px, 1.2fr) minmax(320px, 2fr)",
  gap: 18,
  alignItems: "center",
  padding: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 9,
  background: "#131315",
};

const activityMainStyle: React.CSSProperties = {
  minWidth: 0,
};

const activityDateStyle: React.CSSProperties = {
  color: "#7f7f88",
  fontSize: 11,
  lineHeight: 1.4,
};

const activityNameStyle: React.CSSProperties = {
  marginTop: 6,
  overflow: "hidden",
  color: "#ffffff",
  fontSize: 15,
  fontWeight: 500,
  lineHeight: 1.35,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const activityTypeStyle: React.CSSProperties = {
  marginTop: 5,
  color: "#fff1a8",
  fontSize: 11,
};

const activityMetricsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(70px, 1fr))",
  gap: 12,
};

const activityMetricValueStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.3,
};

const activityMetricLabelStyle: React.CSSProperties = {
  marginTop: 4,
  color: "#73737c",
  fontSize: 10,
};

const emptyStateStyle: React.CSSProperties = {
  marginTop: 20,
  padding: "28px 16px",
  border: "1px dashed rgba(255,255,255,0.12)",
  borderRadius: 9,
  color: "#8f8f98",
  fontSize: 13,
  lineHeight: 1.6,
  textAlign: "center",
};

const messageStyle: React.CSSProperties = {
  position: "sticky",
  bottom: 18,
  width: "min(700px, calc(100% - 24px))",
  boxSizing: "border-box",
  margin: "18px auto 0",
  padding: "12px 14px",
  border: "1px solid rgba(255,241,168,0.25)",
  borderRadius: 8,
  background: "rgba(17,17,19,0.96)",
  color: "#d4d4d8",
  fontSize: 12,
  lineHeight: 1.5,
  boxShadow: "0 12px 36px rgba(0,0,0,0.42)",
};
