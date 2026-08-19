"use client";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import PerformanceAiBackButton from "@/components/performance-ai/PerformanceAiBackButton";
import { supabaseBrowser } from "@/lib/supabase-browser";

type DailyRow = {
  id: string;
  day: string;
  steps: number | null;
  steps_goal: number | null;
  distance_m: number | null;
  active_calories: number | null;
  bmr_calories: number | null;
  resting_heart_rate: number | null;
  average_heart_rate: number | null;
  min_heart_rate: number | null;
  max_heart_rate: number | null;
  average_stress: number | null;
  max_stress: number | null;
  body_battery_charged: number | null;
  body_battery_drained: number | null;
  active_time_s: number | null;
  moderate_intensity_s: number | null;
  vigorous_intensity_s: number | null;
  floors_climbed: number | null;
  provider: string;
};

type SleepRow = {
  id: string;
  day: string;
  sleep_start: string | null;
  sleep_duration_s: number | null;
  deep_sleep_s: number | null;
  light_sleep_s: number | null;
  rem_sleep_s: number | null;
  awake_s: number | null;
  nap_duration_s: number | null;
  sleep_score: number | null;
  sleep_score_qualifier: string | null;
  provider: string;
};

type HrvRow = {
  id: string;
  day: string;
  last_night_avg: number | null;
  last_night_5min_high: number | null;
  duration_s: number | null;
  provider: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) {
    return "-";
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

function formatNumber(value: number | null) {
  if (value == null) {
    return "-";
  }

  return value.toLocaleString("pt-BR");
}

function formatDistance(value: number | null) {
  if (value == null) {
    return "-";
  }

  return `${(value / 1000).toFixed(2)} km`;
}

export default function HealthDataPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser, []);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [daily, setDaily] = useState<DailyRow | null>(null);
  const [sleep, setSleep] = useState<SleepRow | null>(null);
  const [hrv, setHrv] = useState<HrvRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPage = async () => {
      try {
        setLoading(true);
        setMessage(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        const [
          dailyResult,
          sleepResult,
          hrvResult,
        ] = await Promise.all([
          supabase
            .from("health_daily_summaries")
            .select(
              "id,day,steps,steps_goal,distance_m,active_calories,bmr_calories,resting_heart_rate,average_heart_rate,min_heart_rate,max_heart_rate,average_stress,max_stress,body_battery_charged,body_battery_drained,active_time_s,moderate_intensity_s,vigorous_intensity_s,floors_climbed,provider"
            )
            .eq("user_id", user.id)
            .eq("provider", "garmin")
            .order("day", { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from("health_sleep_summaries")
            .select(
              "id,day,sleep_start,sleep_duration_s,deep_sleep_s,light_sleep_s,rem_sleep_s,awake_s,nap_duration_s,sleep_score,sleep_score_qualifier,provider"
            )
            .eq("user_id", user.id)
            .eq("provider", "garmin")
            .order("day", { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from("health_hrv_summaries")
            .select(
              "id,day,last_night_avg,last_night_5min_high,duration_s,provider"
            )
            .eq("user_id", user.id)
            .eq("provider", "garmin")
            .order("day", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (dailyResult.error) {
          throw dailyResult.error;
        }

        if (sleepResult.error) {
          throw sleepResult.error;
        }

        if (hrvResult.error) {
          throw hrvResult.error;
        }

        if (!cancelled) {
          setDaily(
            (dailyResult.data as DailyRow | null) ?? null
          );
          setSleep(
            (sleepResult.data as SleepRow | null) ?? null
          );
          setHrv(
            (hrvResult.data as HrvRow | null) ?? null
          );
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Não foi possível carregar seus dados de saúde.";

        if (!cancelled) {
          setMessage(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingStyle}>
          Carregando seus dados de saúde...
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={topBarStyle}>
        <PerformanceAiBackButton />
      </div>

      <header style={headerStyle}>
        <div style={eyebrowStyle}>
          PERFORMANCE AI
        </div>

        <h1 style={titleStyle}>
          Saúde <span style={titleAccentStyle}>Garmin</span>
        </h1>

        <p style={subtitleStyle}>
          Acompanhe seus principais dados de saúde,
          recuperação, sono e variabilidade da
          frequência cardíaca sincronizados pelo Garmin.
        </p>
      </header>

      {message ? (
        <section style={messageStyle}>
          {message}
        </section>
      ) : null}

      {!daily && !sleep && !hrv ? (
        <section style={emptyStyle}>
          Nenhum dado de saúde Garmin encontrado.
        </section>
      ) : (
        <>
          <section style={sectionCardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <div style={sectionEyebrowStyle}>
                  RESUMO DIÁRIO
                </div>

                <h2 style={sectionTitleStyle}>
                  Dados do dia
                </h2>
              </div>

              <div style={providerBadgeStyle}>
                Garmin
              </div>
            </div>

            <div style={dateStyle}>
              {formatDate(daily?.day)}
            </div>

            <div style={metricGridStyle}>
              <Metric
                label="Passos"
                value={formatNumber(daily?.steps ?? null)}
              />

              <Metric
                label="Meta de passos"
                value={formatNumber(
                  daily?.steps_goal ?? null
                )}
              />

              <Metric
                label="Distância"
                value={formatDistance(
                  daily?.distance_m ?? null
                )}
              />

              <Metric
                label="Calorias ativas"
                value={
                  daily?.active_calories != null
                    ? `${formatNumber(
                        daily.active_calories
                      )} kcal`
                    : "-"
                }
              />

              <Metric
                label="FC repouso"
                value={
                  daily?.resting_heart_rate != null
                    ? `${daily.resting_heart_rate} bpm`
                    : "-"
                }
              />

              <Metric
                label="FC média"
                value={
                  daily?.average_heart_rate != null
                    ? `${daily.average_heart_rate} bpm`
                    : "-"
                }
              />

              <Metric
                label="Stress médio"
                value={formatNumber(
                  daily?.average_stress ?? null
                )}
              />

              <Metric
                label="Stress máximo"
                value={formatNumber(
                  daily?.max_stress ?? null
                )}
              />

              <Metric
                label="Body Battery +"
                value={formatNumber(
                  daily?.body_battery_charged ?? null
                )}
              />

              <Metric
                label="Body Battery -"
                value={formatNumber(
                  daily?.body_battery_drained ?? null
                )}
              />

              <Metric
                label="Tempo ativo"
                value={formatDuration(
                  daily?.active_time_s ?? null
                )}
              />

              <Metric
                label="Andares"
                value={formatNumber(
                  daily?.floors_climbed ?? null
                )}
              />
            </div>
          </section>

          <section style={sectionCardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <div style={sectionEyebrowStyle}>
                  RECUPERAÇÃO
                </div>

                <h2 style={sectionTitleStyle}>
                  Sono
                </h2>
              </div>

              <div style={providerBadgeStyle}>
                Garmin
              </div>
            </div>

            <div style={dateStyle}>
              {formatDate(sleep?.day)}
            </div>

            <div style={metricGridStyle}>
              <Metric
                label="Sono total"
                value={formatDuration(
                  sleep?.sleep_duration_s ?? null
                )}
              />

              <Metric
                label="Sono profundo"
                value={formatDuration(
                  sleep?.deep_sleep_s ?? null
                )}
              />

              <Metric
                label="Sono leve"
                value={formatDuration(
                  sleep?.light_sleep_s ?? null
                )}
              />

              <Metric
                label="REM"
                value={formatDuration(
                  sleep?.rem_sleep_s ?? null
                )}
              />

              <Metric
                label="Acordado"
                value={formatDuration(
                  sleep?.awake_s ?? null
                )}
              />

              <Metric
                label="Cochilos"
                value={formatDuration(
                  sleep?.nap_duration_s ?? null
                )}
              />

              <Metric
                label="Sleep Score"
                value={
                  sleep?.sleep_score != null
                    ? `${sleep.sleep_score}`
                    : "-"
                }
              />

              <Metric
                label="Classificação"
                value={
                  sleep?.sleep_score_qualifier ?? "-"
                }
              />
            </div>
          </section>

          <section style={sectionCardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <div style={sectionEyebrowStyle}>
                  VARIABILIDADE CARDÍACA
                </div>

                <h2 style={sectionTitleStyle}>
                  HRV
                </h2>
              </div>

              <div style={providerBadgeStyle}>
                Garmin
              </div>
            </div>

            <div style={dateStyle}>
              {formatDate(hrv?.day)}
            </div>

            <div style={metricGridStyle}>
              <Metric
                label="Média da noite"
                value={
                  hrv?.last_night_avg != null
                    ? `${hrv.last_night_avg} ms`
                    : "-"
                }
              />

              <Metric
                label="Maior média 5 min"
                value={
                  hrv?.last_night_5min_high != null
                    ? `${hrv.last_night_5min_high} ms`
                    : "-"
                }
              />

              <Metric
                label="Período analisado"
                value={formatDuration(
                  hrv?.duration_s ?? null
                )}
              />
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={metricCardStyle}>
      <div style={metricLabelStyle}>
        {label}
      </div>

      <div style={metricValueStyle}>
        {value}
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg, #090906 0%, #050505 100%)",
  color: "#ffffff",
  fontFamily: "Montserrat, sans-serif",
  padding: "18px clamp(18px, 4vw, 40px) 72px",
  boxSizing: "border-box",
};

const topBarStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto 28px",
};

const headerStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto 30px",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#d4af37",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.14em",
  marginBottom: 8,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 6vw, 58px)",
  lineHeight: 1.05,
  fontWeight: 500,
};

const titleAccentStyle: React.CSSProperties = {
  color: "#d4af37",
};

const subtitleStyle: React.CSSProperties = {
  maxWidth: 760,
  margin: "14px 0 0",
  color: "#94a3b8",
  fontSize: 15,
  lineHeight: 1.7,
};

const sectionCardStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto 22px",
  border: "1px solid #27272a",
  background:
    "linear-gradient(180deg, rgba(24,24,27,0.95), rgba(10,10,10,0.95))",
  padding: "24px",
  borderRadius: 16,
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
};

const sectionEyebrowStyle: React.CSSProperties = {
  color: "#d4af37",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.14em",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: 26,
  fontWeight: 500,
};

const providerBadgeStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(212,175,55,0.5)",
  color: "#d4af37",
  fontSize: 11,
  fontWeight: 700,
};

const dateStyle: React.CSSProperties = {
  color: "#71717a",
  fontSize: 12,
  marginTop: 8,
};

const metricGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 12,
  marginTop: 20,
};

const metricCardStyle: React.CSSProperties = {
  minHeight: 92,
  padding: "16px",
  border: "1px solid #27272a",
  background: "#09090b",
  borderRadius: 12,
  boxSizing: "border-box",
};

const metricLabelStyle: React.CSSProperties = {
  color: "#71717a",
  fontSize: 11,
  lineHeight: 1.4,
  marginBottom: 8,
};

const metricValueStyle: React.CSSProperties = {
  color: "#f8fafc",
  fontSize: 23,
  fontWeight: 500,
};

const loadingStyle: React.CSSProperties = {
  minHeight: "60vh",
  display: "grid",
  placeItems: "center",
  color: "#94a3b8",
};

const messageStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto 22px",
  padding: 16,
  borderRadius: 12,
  border: "1px solid #7f1d1d",
  background: "#450a0a",
  color: "#fecaca",
};

const emptyStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: 24,
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  color: "#71717a",
  background: "#ffffff",
};


