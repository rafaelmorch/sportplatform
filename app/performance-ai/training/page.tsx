"use client";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import PerformanceAiBackButton from "@/components/performance-ai/PerformanceAiBackButton";
import TrainingDistanceChart from "@/components/performance-ai/TrainingDistanceChart";
import { supabaseBrowser } from "@/lib/supabase-browser";

type RangeKey = "7d" | "30d" | "6m" | "all";

type TrainingActivityRow = {
  id: string;
  athlete_id: number | null;
  name: string | null;
  type: string | null;
  sport_type: string | null;
  device_name?: string | null;
  start_date: string | null;
  distance: number | null;
  moving_time: number | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
  total_elevation_gain?: number | null;
  calories?: number | null;
  provider: "strava" | "garmin";
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

function estimateActivityCalories(
  activity: TrainingActivityRow,
  weightKg: number | null
): number | null {
  if (!weightKg || weightKg <= 0) {
    return null;
  }

  const distanceKm =
    (activity.distance ?? 0) / 1000;

  const durationSeconds =
    activity.moving_time ?? 0;

  const durationHours =
    durationSeconds / 3600;

  const durationMinutes =
    durationSeconds / 60;

  const activityType = [
    activity.sport_type,
    activity.type,
    activity.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    activityType.includes("run") &&
    distanceKm > 0
  ) {
    return Math.round(
      weightKg * distanceKm
    );
  }

  if (
    (
      activityType.includes("walk") ||
      activityType.includes("hike")
    ) &&
    distanceKm > 0
  ) {
    return Math.round(
      weightKg * distanceKm * 0.55
    );
  }

  if (
    (
      activityType.includes("ride") ||
      activityType.includes("cycling") ||
      activityType.includes("bike")
    ) &&
    durationMinutes > 0
  ) {
    const averageSpeedKmh =
      durationHours > 0
        ? distanceKm / durationHours
        : 0;

    let met = 6;

    if (averageSpeedKmh < 16) {
      met = 4;
    } else if (averageSpeedKmh < 19) {
      met = 6;
    } else if (averageSpeedKmh < 22) {
      met = 8;
    } else if (averageSpeedKmh < 25) {
      met = 10;
    } else if (averageSpeedKmh < 30) {
      met = 12;
    } else {
      met = 14;
    }

    return Math.round(
      (met * 3.5 * weightKg / 200) *
        durationMinutes
    );
  }

  if (
    activityType.includes("swim") &&
    durationMinutes > 0
  ) {
    const met = 8.3;

    return Math.round(
      (met * 3.5 * weightKg / 200) *
        durationMinutes
    );
  }

  if (durationMinutes > 0) {
    const met = 6;

    return Math.round(
      (met * 3.5 * weightKg / 200) *
        durationMinutes
    );
  }

  return null;
}

function formatEstimatedCalories(
  calories: number | null
): string {
  if (calories == null) {
    return "-";
  }

  return `~${calories.toLocaleString(
    "pt-BR"
  )}`;
}

function getActivityName(activity: TrainingActivityRow) {
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
  const [garminConnected, setGarminConnected] =
    useState(false);

  const [weightKg, setWeightKg] =
    useState<number | null>(null);

  const [activities, setActivities] = useState<
    TrainingActivityRow[]
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

        const {
          data: performanceProfile,
          error: profileError,
        } = await supabase
          .from("performance_ai_profiles")
          .select("weight_kg")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.warn(
            "Não foi possível carregar o peso do atleta:",
            profileError
          );
        }

        setWeightKg(
          performanceProfile?.weight_kg != null
            ? Number(performanceProfile.weight_kg)
            : null
        );

        console.log(
          "Training weightKg:",
          performanceProfile?.weight_kg
        );
        const { data: tokenRow, error: tokenError } =
          await supabase
            .from("strava_tokens")
            .select("athlete_id")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (tokenError) {
          console.warn(
            "Não foi possível verificar conexão Strava:",
            tokenError
          );
        }

        const hasStrava = !!tokenRow?.athlete_id;
        setStravaConnected(hasStrava);

        const {
          data: sessionData,
        } = await supabase.auth.getSession();

        let hasGarmin = false;

        if (sessionData.session?.access_token) {
          try {
            const garminStatusResponse = await fetch(
              "/api/garmin/status",
              {
                headers: {
                  Authorization: `Bearer ${sessionData.session.access_token}`,
                },
              }
            );

            if (garminStatusResponse.ok) {
              const garminStatus =
                await garminStatusResponse.json();

              hasGarmin = !!garminStatus?.connected;
            }
          } catch (error) {
            console.warn(
              "Não foi possível verificar conexão Garmin:",
              error
            );
          }
        }

        setGarminConnected(hasGarmin);

        let stravaActivities: TrainingActivityRow[] = [];

        if (hasStrava) {
          const {
            data: activitiesData,
            error: activitiesError,
          } = await supabase
            .from("strava_activities")
            .select(
              "id, athlete_id, name, type, sport_type, start_date, distance, moving_time, average_heartrate, max_heartrate, total_elevation_gain"
            )
            .eq("athlete_id", tokenRow.athlete_id)
            .order("start_date", { ascending: false })
            .limit(200);

          if (activitiesError) {
            console.warn(
              "Não foi possível carregar atividades Strava:",
              activitiesError
            );
          } else {
            stravaActivities = (activitiesData ?? []).map(
              (activity) => ({
                id: `strava-${activity.id}`,
                athlete_id:
                  activity.athlete_id != null
                    ? Number(activity.athlete_id)
                    : null,
                name: activity.name ?? null,
                type: activity.type ?? null,
                sport_type: activity.sport_type ?? null,
                start_date: activity.start_date ?? null,
                distance:
                  activity.distance != null
                    ? Number(activity.distance)
                    : null,
                moving_time:
                  activity.moving_time != null
                    ? Number(activity.moving_time)
                    : null,
                average_heartrate:
                  activity.average_heartrate != null
                    ? Number(activity.average_heartrate)
                    : null,
                max_heartrate:
                  activity.max_heartrate != null
                    ? Number(activity.max_heartrate)
                    : null,
                total_elevation_gain:
                  activity.total_elevation_gain != null
                    ? Number(activity.total_elevation_gain)
                    : null,
                calories: null,
                provider: "strava" as const,
              })
            );
          }
        }

        const {
          data: garminData,
          error: garminError,
        } = await supabase
          .from("imported_activities")
          .select(
            "id,name,sport_type,device_name,start_date,distance_m,moving_time_s,elev_gain_m,avg_heartrate,max_heartrate,calories,provider,external_id"
          )
          .eq("user_id", user.id)
          .eq("provider", "garmin")
          .order("start_date", { ascending: false })
          .limit(200);

        if (garminError) {
          console.warn(
            "Não foi possível carregar atividades Garmin:",
            garminError
          );
        }

        const garminActivities: TrainingActivityRow[] =
          (garminData ?? []).map((activity) => ({
            id: `garmin-${activity.id}`,
            athlete_id: null,
            name: activity.name ?? null,
            type: activity.sport_type ?? null,
            sport_type: activity.sport_type ?? null,
            device_name: activity.device_name ?? null,
            start_date: activity.start_date ?? null,
            distance:
              activity.distance_m != null
                ? Number(activity.distance_m)
                : null,
            moving_time:
              activity.moving_time_s != null
                ? Number(activity.moving_time_s)
                : null,
            average_heartrate:
              activity.avg_heartrate != null
                ? Number(activity.avg_heartrate)
                : null,
            max_heartrate:
              activity.max_heartrate != null
                ? Number(activity.max_heartrate)
                : null,
            total_elevation_gain:
              activity.elev_gain_m != null
                ? Number(activity.elev_gain_m)
                : null,
            calories:
              activity.calories != null
                ? Number(activity.calories)
                : null,
            provider: "garmin" as const,
          }));

        const combinedActivities = [
          ...stravaActivities,
          ...garminActivities,
        ].sort((a, b) => {
          const timeA = a.start_date
            ? new Date(a.start_date).getTime()
            : 0;
          const timeB = b.start_date
            ? new Date(b.start_date).getTime()
            : 0;

          return timeB - timeA;
        });

        const deduplicatedActivities =
          combinedActivities.filter(
            (activity, index, list) =>
              index ===
              list.findIndex((candidate) => {
                if (
                  !activity.start_date ||
                  !candidate.start_date
                ) {
                  return activity.id === candidate.id;
                }

                const startDifference =
                  Math.abs(
                    new Date(activity.start_date).getTime() -
                      new Date(candidate.start_date).getTime()
                  );

                const distanceDifference =
                  Math.abs(
                    (activity.distance ?? 0) -
                      (candidate.distance ?? 0)
                  );

                const durationDifference =
                  Math.abs(
                    (activity.moving_time ?? 0) -
                      (candidate.moving_time ?? 0)
                  );

                return (
                  startDifference <= 120000 &&
                  distanceDifference <= 100 &&
                  durationDifference <= 120
                );
              })
          );

        setActivities(deduplicatedActivities);
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

  const estimatedCalories =
    filteredActivities.reduce(
      (total, activity) =>
        total +
        (estimateActivityCalories(
          activity,
          weightKg
        ) ?? 0),
      0
    );

  const hasEstimatedCalories =
    weightKg != null &&
    filteredActivities.length > 0;

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

  const trainingChartData = chartActivities.map(
    (activity) => ({
      label: formatShortDate(activity.start_date),
      name: getActivityName(activity),
      distanceKm:
        (activity.distance ?? 0) / 1000,
    })
  );

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
          <span style={{ color: "#D4AF37" }}>
            Treinamentos
          </span>
        </h1>

        <p style={subtitleStyle}>
          Acompanhe sua carga, distância,
          frequência cardíaca e evolução com os
          dados sincronizados dos seus apps de treino.
        </p>
      </header>

      {!stravaConnected && !garminConnected ? (
        <section style={connectionCardStyle}>
          <div>
            <div style={cardEyebrowStyle}>
              Integração necessária
            </div>

            <h2 style={connectionTitleStyle}>
              Conecte um app de treino
            </h2>

            <p style={connectionTextStyle}>
              Conecte Strava ou Garmin para visualizar
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

            <article style={metricCardStyle}>
              <div style={metricLabelStyle}>
                Calorias
              </div>

              <div style={metricValueStyle}>
                {hasEstimatedCalories
                  ? formatEstimatedCalories(
                      estimatedCalories
                    )
                  : "-"}
              </div>

              <div style={metricDetailStyle}>
                {hasEstimatedCalories
                  ? "kcal estimadas"
                  : "peso não informado"}
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

        {trainingChartData.length === 0 ? (
          <div style={emptyStateStyle}>
            Nenhuma atividade encontrada neste
            período.
          </div>
        ) : (
          <div style={chartContainerStyle}>
            <TrainingDistanceChart
              data={trainingChartData}
            />
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

                        <div style={activityTypeStyle}>
  {activity.sport_type ??
    activity.type ??
    "Atividade"}
  {" · "}
  <span style={{ fontWeight: 600 }}>
    {activity.provider === "garmin"
      ? activity.device_name?.trim() || "Garmin"
      : "Strava"}
  </span>
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
                        <div>
                          <div
                            style={
                              activityMetricValueStyle
                            }
                          >
                            {formatEstimatedCalories(
                              estimateActivityCalories(
                                activity,
                                weightKg
                              )
                            )}
                          </div>

                          <div
                            style={
                              activityMetricLabelStyle
                            }
                          >
                            kcal estimadas
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
    "max(16px, env(safe-area-inset-top)) 16px max(120px, calc(90px + env(safe-area-inset-bottom)))",
  background:
    "radial-gradient(circle at 50% -8%, rgba(212,175,55,0.08), transparent 30%), #050505",
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
  width: "min(920px, 100%)",
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
};

const syncButtonStyle: React.CSSProperties = {
  minHeight: 40,
  padding: "0 14px",
  border: "1px solid rgba(212,175,55,0.38)",
  borderRadius: 11,
  background: "rgba(212,175,55,0.055)",
  color: "#D4AF37",
  fontFamily: "Montserrat, sans-serif",
  fontSize: 12,
  fontWeight: 600,
};

const heroStyle: React.CSSProperties = {
  width: "min(920px, 100%)",
  margin: "34px auto 0",
  padding: "0 0 30px",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#D4AF37",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.15em",
  lineHeight: 1.4,
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#ffffff",
  fontSize: "clamp(36px, 7vw, 54px)",
  fontWeight: 400,
  lineHeight: 1.04,
  letterSpacing: "-0.045em",
};

const subtitleStyle: React.CSSProperties = {
  maxWidth: 650,
  margin: "14px 0 0",
  color: "rgba(255,255,255,0.5)",
  fontSize: 14,
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
  border: "1px solid rgba(212,175,55,0.2)",
  borderRadius: 12,
  background: "#111113",
};

const cardEyebrowStyle: React.CSSProperties = {
  color: "#D4AF37",
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
  border: "1px solid #D4AF37",
  borderRadius: 8,
  background: "#D4AF37",
  color: "#111111",
  fontFamily: "Montserrat, sans-serif",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const rangeSectionStyle: React.CSSProperties = {
  width: "min(920px, 100%)",
  margin: "0 auto 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap",
  paddingBottom: 18,
  borderBottom:
    "1px solid rgba(255,255,255,0.07)",
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
  border: "1px solid rgba(212,175,55,0.45)",
  background: "rgba(212,175,55,0.12)",
  color: "#D4AF37",
};

const metricsGridStyle: React.CSSProperties = {
  width: "min(920px, 100%)",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(130px, 1fr))",
  borderTop:
    "1px solid rgba(255,255,255,0.075)",
  borderBottom:
    "1px solid rgba(255,255,255,0.075)",
};

const metricCardStyle: React.CSSProperties = {
  minHeight: 122,
  boxSizing: "border-box",
  padding: "20px 16px",
  border: 0,
  borderRight:
    "1px solid rgba(255,255,255,0.065)",
  borderRadius: 0,
  background: "transparent",
};

const metricLabelStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.42)",
  fontSize: 11,
  lineHeight: 1.4,
};

const metricValueStyle: React.CSSProperties = {
  marginTop: 12,
  color: "#ffffff",
  fontSize: "clamp(25px, 5vw, 32px)",
  fontWeight: 400,
  lineHeight: 1,
  letterSpacing: "-0.035em",
};

const metricDetailStyle: React.CSSProperties = {
  marginTop: 9,
  color: "#73737c",
  fontSize: 11,
};

const insightCardStyle: React.CSSProperties = {
  width: "min(920px, 100%)",
  margin: "28px auto 0",
  boxSizing: "border-box",
  padding: "4px 0 4px 18px",
  border: 0,
  borderLeft: "2px solid #D4AF37",
  borderRadius: 0,
  background: "transparent",
};

const insightTextStyle: React.CSSProperties = {
  marginTop: 10,
  color: "#d4d4d8",
  fontSize: 14,
  lineHeight: 1.7,
};

const sectionCardStyle: React.CSSProperties = {
  width: "min(920px, 100%)",
  margin: "38px auto 0",
  boxSizing: "border-box",
  padding: "32px 0 0",
  border: 0,
  borderTop:
    "1px solid rgba(255,255,255,0.08)",
  borderRadius: 0,
  background: "transparent",
};

const sectionHeadingRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "7px 0 0",
  color: "#ffffff",
  fontSize: 27,
  fontWeight: 400,
  letterSpacing: "-0.03em",
};

const averageBadgeStyle: React.CSSProperties = {
  padding: "7px 10px",
  border: "1px solid rgba(212,175,55,0.2)",
  borderRadius: 999,
  background: "rgba(212,175,55,0.04)",
  color: "#D4AF37",
  fontSize: 11,
};

const chartContainerStyle: React.CSSProperties = {
  marginTop: 22,
  overflowX: "auto",
  border: 0,
  borderRadius: 0,
  background:
    "linear-gradient(180deg, rgba(212,175,55,0.025), transparent)",
};

const chartSvgStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 620,
  height: 270,
  display: "block",
};

const summaryNumbersStyle: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: 12,
};

const activitiesListStyle: React.CSSProperties = {
  marginTop: 16,
  display: "grid",
};

const activityCardStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
  gap: 22,
  alignItems: "center",
  padding: "22px 0",
  border: 0,
  borderBottom:
    "1px solid rgba(255,255,255,0.16)",
  borderRadius: 0,
  background: "transparent",
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
  fontSize: 18,
  fontWeight: 400,
  lineHeight: 1.35,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const activityTypeStyle: React.CSSProperties = {
  marginTop: 6,
  color: "#D4AF37",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const activityMetricsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(5, minmax(0, 1fr))",
  gap: 14,
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
  border: "1px solid rgba(212,175,55,0.25)",
  borderRadius: 8,
  background: "rgba(17,17,19,0.96)",
  color: "#d4d4d8",
  fontSize: 12,
  lineHeight: 1.5,
  boxShadow: "0 12px 36px rgba(0,0,0,0.42)",
};















