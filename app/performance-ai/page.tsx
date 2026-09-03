"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import BottomNavbar from "@/components/BottomNavbar";
import PerformanceOverviewHero from "@/components/performance/PerformanceOverviewHero";
import PerformanceAreasGrid from "@/components/performance/PerformanceAreasGrid";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { formatDuration } from "@/lib/performance/formatters";
import { isInRange } from "@/lib/performance/ranges";

type ProfileRow = {
  id: string;
  user_id: string;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  gender: string | null;
  goal: string | null;
  health_notes: string | null;
  goal_date: string | null;
  goal_type: string | null;
  goal_priority: string | null;
};

type MealRow = {
  id: string;
  meal_text: string;
  eaten_at: string;
  meal_type: string | null;
  protein_level: string | null;
  quality_level: string | null;
  ai_notes: string | null;
};

type BloodTestRow = {
  id: string;
  exam_date: string | null;
  hemoglobin: number | null;
  ferritin: number | null;
  vitamin_d: number | null;
  glucose: number | null;
  total_cholesterol: number | null;
  hdl: number | null;
  ldl: number | null;
  triglycerides: number | null;
  tsh: number | null;
  creatinine: number | null;
  notes: string | null;
  created_at: string;
};

type BioimpedanceRow = {
  id: string;
  assessment_date: string | null;
  weight_kg: number | null;
  body_fat_percent: number | null;
  muscle_mass_kg: number | null;
  visceral_fat: number | null;
  body_water_percent: number | null;
  bmr: number | null;
  notes: string | null;
  created_at: string;
};

type WeightLogRow = {
  id: string;
  weight_kg: number;
  created_at: string;
};

type StravaActivityRow = {
  id: string;
  athlete_id: number | null;
  name: string | null;
  type: string | null;
  sport_type: string | null;
  start_date: string | null;
  distance: number | null;
  moving_time: number | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
};

type RangeKey = "7d" | "30d" | "6m" | "all";

type PerformanceArea = {
  title: string;
  score: number;
  status: string;
  description: string;
  detail: string;
  href: string;
  action: string;
  available: boolean;
};

function getCoachInsight(params: {
  meals: MealRow[];
  weeklyActivitiesCount: number;
  weeklyDistanceKm: number;
  weeklyMovingTime: number;
  avgHeartRate: number | null;
  weightLogs: WeightLogRow[];
}) {
  const {
    meals,
    weeklyActivitiesCount,
    weeklyDistanceKm,
    weeklyMovingTime,
    avgHeartRate,
    weightLogs,
  } = params;

  const lowQualityMeals = meals.filter(
    (meal) => meal.quality_level === "baixa"
  ).length;
  const highProteinMeals = meals.filter(
    (meal) => meal.protein_level === "alta"
  ).length;
  const totalTrainingHours = weeklyMovingTime / 3600;
  const currentWeight = weightLogs[0]?.weight_kg ?? null;
  const previousWeight = weightLogs[1]?.weight_kg ?? null;
  const weightDiff =
    currentWeight != null && previousWeight != null
      ? Number((currentWeight - previousWeight).toFixed(1))
      : null;

  if (weightDiff != null && weightDiff <= -1 && totalTrainingHours >= 3) {
    return "Seu peso caiu junto com um volume razoável de treino. Vale reforçar recuperação, hidratação e ingestão de proteína para evitar queda excessiva.";
  }

  if (weightDiff != null && weightDiff >= 1 && lowQualityMeals >= 2) {
    return "Seu peso subiu e sua alimentação recente teve baixa qualidade. Tente reduzir ultraprocessados e voltar para refeições mais equilibradas.";
  }

  if (weightLogs.length === 0) {
    return "Você ainda não registrou seu peso. Isso limita a precisão das orientações. Tente atualizar o peso algumas vezes por semana.";
  }

  if (weeklyActivitiesCount >= 4 && highProteinMeals <= 1) {
    return "Você treinou bem nos últimos dias, mas sua ingestão de proteína parece baixa. Priorize proteína nas próximas refeições para ajudar na recuperação.";
  }

  if (weeklyDistanceKm >= 25 && meals.length <= 2) {
    return "Seu volume de treino está alto para poucas refeições registradas. Vale reforçar alimentação e hidratação ao longo do dia.";
  }

  if (avgHeartRate && avgHeartRate >= 155 && lowQualityMeals >= 1) {
    return "Seu treino mostra esforço elevado e sua alimentação pode melhorar. Hoje vale focar em comida de verdade, hidratação e recuperação.";
  }

  if (lowQualityMeals >= 2) {
    return "Hoje sua alimentação teve qualidade baixa. Tente reduzir ultraprocessados e incluir uma refeição mais completa com proteína e carboidrato de melhor qualidade.";
  }

  if (weeklyActivitiesCount === 0 && meals.length > 0) {
    return "Você registrou alimentação, mas não há treinos recentes sincronizados. Se hoje for dia de descanso, foque em recuperação e consistência.";
  }

  if (totalTrainingHours >= 3 && highProteinMeals >= 2) {
    return "Bom equilíbrio entre treino e alimentação. Você está sustentando bem a recuperação nesta fase.";
  }

  if (
    weightDiff != null &&
    Math.abs(weightDiff) < 0.3 &&
    weeklyActivitiesCount >= 3
  ) {
    return "Seu peso está estável e sua rotina de treino segue ativa. Isso sugere boa consistência nesta fase.";
  }

  return "Seu quadro está relativamente equilibrado. Continue registrando refeições, peso e treinos para receber orientações mais precisas.";
}

function scoreLabel(score: number) {
  if (score >= 85) return "Excelente";
  if (score >= 70) return "Muito bom";
  if (score >= 55) return "Em evolução";
  return "Precisa de atenção";
}

function PerformanceCenter({
  areas,
  dataQuality,
}: {
  areas: PerformanceArea[];
  dataQuality: number;
}) {
  const dataQualityLabel =
    dataQuality >= 85
      ? "Excelente"
      : dataQuality >= 65
        ? "Muito boa"
        : dataQuality >= 40
          ? "Em desenvolvimento"
          : "Precisa de mais dados";

  return (
    <section
      style={{
        width: "100%",
        background: "#101010",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "clamp(52px, 8vw, 88px) 16px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: "clamp(32px, 7vw, 80px)",
            alignItems: "end",
          }}
        >
          <div style={{ maxWidth: 700 }}>
            <div style={eyebrowStyle}>Centro de performance</div>

            <h2 style={sectionTitleStyle}>Suas áreas de performance</h2>

            <p style={sectionTextStyle}>
              Notas, dados e atalhos reunidos em um único lugar para você
              entender rapidamente onde está bem e onde precisa evoluir.
            </p>
          </div>

          <div
            style={{
              padding: "22px 0 4px",
              borderTop: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 20,
              }}
            >
              <div>
                <div style={smallLabelStyle}>Qualidade dos dados</div>
                <div
                  style={{
                    marginTop: 8,
                    color: "#ffffff",
                    fontSize: "clamp(22px, 4vw, 32px)",
                    fontWeight: 780,
                    letterSpacing: "-0.035em",
                  }}
                >
                  {dataQualityLabel}
                </div>
              </div>

              <div
                style={{
                  color: "#F1D36B",
                  fontSize: "clamp(32px, 6vw, 54px)",
                  fontWeight: 760,
                  lineHeight: 0.95,
                  letterSpacing: "-0.055em",
                }}
              >
                {dataQuality}%
              </div>
            </div>

            <div
              style={{
                marginTop: 18,
                height: 4,
                overflow: "hidden",
                background: "rgba(255,255,255,0.1)",
              }}
            >
              <div
                style={{
                  width: `${dataQuality}%`,
                  height: "100%",
                  background: "#16a34a",
                  transition: "width 300ms ease",
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "clamp(38px, 6vw, 58px)",
            borderTop: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {areas.map((area, index) => (
            <article
              key={area.title}
              style={{
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
                margin: 0,
                padding: "16px",
                border: 0,
                borderBottom:
                  index === areas.length - 1
                    ? "none"
                    : "1px solid rgba(255,255,255,0.13)",
                borderRadius: 0,
                background: "transparent",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) 52px",
                  gap: 10,
                  alignItems: "center",
                  width: "100%",
                  minWidth: 0,
                }}
              >
                <div style={{ minWidth: 0, maxWidth: "100%", overflowWrap: "anywhere" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: area.available ? "#F1D36B" : "#5f5f67",
                        boxShadow: area.available
                          ? "0 0 14px rgba(255,241,168,0.35)"
                          : "none",
                      }}
                    />

                    <h3
                      style={{
                        margin: 0,
                        color: "#ffffff",
                        fontSize: "clamp(18px, 2.5vw, 22px)",
                        fontWeight: 760,
                        lineHeight: 1.3,
                      }}
                    >
                      {area.title}
                    </h3>

                </div>

                <p
                  style={{
                    margin: "5px 0 0",
                    maxWidth: "100%",
                    color: "#d4d4d8",
                    fontSize: 13,
                    lineHeight: 1.4,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {area.description}
                </p>

                <div
                  style={{
                    marginTop: 5,
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      color: area.available ? "#F1D36B" : "#8f8f98",
                      fontSize: 10,
                      fontWeight: 800,
                      lineHeight: 1.3,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {area.status}
                  </span>

                  <Link
                    href={area.href}
                    style={{
                      color: "#F1D36B",
                      fontSize: 12,
                      fontWeight: 780,
                      lineHeight: 1.3,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {area.action} →
                  </Link>
                </div>
              </div>

              <div
                style={{
                  textAlign: "right",
                  alignSelf: "center",
                }}
              >
                  <div
                    style={{
                      color: "#ffffff",
                      fontSize: "clamp(24px, 5vw, 34px)",
                      fontWeight: 780,
                      lineHeight: 1,
                      letterSpacing: "-0.05em",
                    }}
                  >
                    {area.score}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      color: "#696970",
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                    }}
                  >
                    / 100
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      color: "#8f8f98",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {scoreLabel(area.score)}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoachAccess() {
  return (
    <section
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "0 16px 48px",
        background: "#000000",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1120,
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "clamp(22px, 5vw, 34px)",
          borderRadius: 24,
          border: "2px solid #D4AF37",
          background: "#f8f3e8",
          boxShadow:
            "0 0 0 2px rgba(255,255,255,0.18), 0 18px 40px rgba(0,0,0,0.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: "#D4AF37",
              color: "#ffffff",
              fontSize: 17,
              boxShadow: "0 8px 18px rgba(168,117,23,0.28)",
            }}
          >
            📈
          </div>

          <div
            style={{
              paddingTop: 6,
              color: "#312b22",
              fontSize: 12,
              fontWeight: 850,
              letterSpacing: "0.15em",
              lineHeight: 1.4,
              textTransform: "uppercase",
            }}
          >
            Coach IA
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: "1 1 520px",
              minWidth: 0,
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#111111",
                fontSize: "clamp(28px, 5vw, 40px)",
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-0.04em",
              }}
            >
              Seu plano de evolução
            </h2>

            <p
              style={{
                margin: "14px 0 0",
                maxWidth: 680,
                color: "#57534e",
                fontSize: "clamp(15px, 2vw, 17px)",
                lineHeight: 1.7,
              }}
            >
              Gere seu plano personalizado e converse com o Coach sobre treinos,
              recuperação, alimentação e objetivos.
            </p>

            <div
              style={{
                width: 112,
                height: 3,
                marginTop: 24,
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, #B8862B 0%, #F1D36B 58%, rgba(226,187,97,0) 100%)",
              }}
            />
          </div>

          <Link
            href="/performance-ai/coach"
            style={{
              minHeight: 50,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              flexShrink: 0,
              border: "1px solid #17130b",
              borderRadius: 12,
              background: "#17130b",
              color: "#ffffff",
              padding: "0 22px",
              fontSize: 14,
              fontWeight: 850,
              textDecoration: "none",
              boxShadow: "0 12px 24px rgba(0,0,0,0.15)",
            }}
          >
            Abrir Coach IA <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
function PerformanceAIPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser, []);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [goal, setGoal] = useState("");
  const [healthNotes, setHealthNotes] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [goalType, setGoalType] = useState("");
  const [goalPriority, setGoalPriority] = useState("");
  const [meals, setMeals] = useState<MealRow[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLogRow[]>([]);
  const [bioimpedanceLogs, setBioimpedanceLogs] = useState<BioimpedanceRow[]>([]);
  const [bloodTestLogs, setBloodTestLogs] = useState<BloodTestRow[]>([]);
  const [stravaActivities, setStravaActivities] = useState<StravaActivityRow[]>([]);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [range] = useState<RangeKey>("7d");

  useEffect(() => {
    const loadPage = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user ?? null;

        if (!user) {
          router.replace("/login");
          return;
        }

        const [
          profileResult,
          mealsResult,
          weightResult,
          bioResult,
          bloodResult,
          importedResult,
        ] = await Promise.all([
          supabase
            .from("performance_ai_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle<ProfileRow>(),
          supabase
            .from("performance_ai_meals")
            .select(
              "id, meal_text, eaten_at, meal_type, protein_level, quality_level, ai_notes"
            )
            .eq("user_id", user.id)
            .order("eaten_at", { ascending: false })
            .limit(10),
          supabase
            .from("performance_ai_weight_logs")
            .select("id, weight_kg, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("performance_ai_bioimpedance")
            .select(
              "id, assessment_date, weight_kg, body_fat_percent, muscle_mass_kg, visceral_fat, body_water_percent, bmr, notes, created_at"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("performance_ai_blood_tests")
            .select(
              "id, exam_date, hemoglobin, ferritin, vitamin_d, glucose, total_cholesterol, hdl, ldl, triglycerides, tsh, creatinine, notes, created_at"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
              .from("imported_activities")
              .select(
                "id,name,sport_type,device_name,start_date,distance_m,moving_time_s,elev_gain_m,avg_heartrate,max_heartrate,calories,provider,external_id"
              )
              .eq("user_id", user.id)
              .order("start_date", { ascending: false })
              .limit(500),
        ]);

        const profile = profileResult.data;

        if (profile) {
          setProfileId(profile.id);
          setWeightKg(profile.weight_kg?.toString() ?? "");
          setHeightCm(profile.height_cm?.toString() ?? "");
          setAge(profile.age?.toString() ?? "");
          setGender(profile.gender ?? "");
          setGoal(
            profile.goal &&
              [
                "performance",
                "weight_loss",
                "conditioning",
                "maintenance",
              ].includes(profile.goal)
              ? ""
              : profile.goal ?? ""
          );
          setHealthNotes(profile.health_notes ?? "");
          setGoalDate(profile.goal_date ?? "");
          setGoalType(profile.goal_type ?? "");
          setGoalPriority(profile.goal_priority ?? "");
        }

        setMeals((mealsResult.data ?? []) as MealRow[]);
        setWeightLogs((weightResult.data ?? []) as WeightLogRow[]);
        setBioimpedanceLogs((bioResult.data ?? []) as BioimpedanceRow[]);
        setBloodTestLogs((bloodResult.data ?? []) as BloodTestRow[]);
        const importedActivities: StravaActivityRow[] =
          (importedResult.data ?? []).map((activity) => ({
            id: `${activity.provider ?? "imported"}-${activity.id}`,
            athlete_id: null,
            name: activity.name ?? null,
            type: activity.sport_type ?? null,
            sport_type: activity.sport_type ?? null,
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
          }));

        setStravaActivities(importedActivities);
        setStravaConnected(importedActivities.length > 0);
      } catch (error) {
        console.error("Erro ao carregar Performance AI:", error);
        setMessage("Não foi possível carregar todos os dados do Performance AI.");
      } finally {
        setLoading(false);
      }
    };

    void loadPage();
  }, [router, supabase]);

  const now = new Date();
  const filteredActivities = stravaActivities.filter((item) =>
    isInRange(item.start_date, range, now)
  );

  const weeklyActivitiesCount = filteredActivities.length;
  const weeklyDistanceKm = filteredActivities.reduce(
    (sum, item) => sum + (item.distance ?? 0) / 1000,
    0
  );
  const weeklyMovingTime = filteredActivities.reduce(
    (sum, item) => sum + (item.moving_time ?? 0),
    0
  );

  const activitiesWithHr = filteredActivities.filter(
    (item) =>
      item.average_heartrate != null || item.max_heartrate != null
  );

  const avgHeartRate =
    activitiesWithHr.length > 0
      ? Math.round(
          activitiesWithHr.reduce(
            (sum, item) => sum + (item.average_heartrate ?? 0),
            0
          ) / activitiesWithHr.length
        )
      : null;

  const currentCoachWeight = weightLogs[0]?.weight_kg ?? null;
  const previousCoachWeight = weightLogs[1]?.weight_kg ?? null;
  const coachWeightDifference =
    currentCoachWeight != null && previousCoachWeight != null
      ? Number((currentCoachWeight - previousCoachWeight).toFixed(1))
      : null;

  const trainingScore = Math.max(
    0,
    Math.min(
      100,
      (stravaConnected ? 40 : 20) +
        Math.min(weeklyActivitiesCount * 10, 30) +
        Math.min(weeklyDistanceKm, 25) +
        (avgHeartRate && avgHeartRate >= 165 ? -5 : 5)
    )
  );

  const lowQualityMealCount = meals.filter(
    (meal) => meal.quality_level === "baixa"
  ).length;
  const highProteinMealCount = meals.filter(
    (meal) => meal.protein_level === "alta"
  ).length;

  const nutritionScore = Math.max(
    0,
    Math.min(
      100,
      35 +
        Math.min(meals.length * 7, 35) +
        Math.min(highProteinMealCount * 8, 24) -
        lowQualityMealCount * 10
    )
  );

  const weightScore =
    currentCoachWeight == null
      ? 45
      : coachWeightDifference == null
        ? 70
        : Math.abs(coachWeightDifference) < 0.3
          ? 90
          : Math.abs(coachWeightDifference) <= 0.7
            ? 80
            : Math.abs(coachWeightDifference) <= 1
              ? 65
              : 50;

  const healthScore = Math.min(
    100,
    40 +
      (bloodTestLogs.length > 0 ? 20 : 0) +
      (bioimpedanceLogs.length > 0 ? 20 : 0) +
      (healthNotes.trim() ? 10 : 0) +
      (age.trim() && heightCm.trim() ? 10 : 0)
  );

  const goalScore = Math.min(
    100,
    40 +
      (goal.trim() ? 20 : 0) +
      (goalType.trim() ? 15 : 0) +
      (goalDate.trim() ? 15 : 0) +
      (goalPriority.trim() ? 10 : 0)
  );

  const performanceScore = Math.round(
    trainingScore * 0.32 +
      nutritionScore * 0.23 +
      weightScore * 0.15 +
      healthScore * 0.15 +
      goalScore * 0.15
  );

  const performanceStatus = scoreLabel(performanceScore);

  const statusDescription =
    performanceScore >= 85
      ? "Seus registros mostram uma rotina muito consistente."
      : performanceScore >= 70
        ? "Você está construindo uma boa base de desempenho."
        : performanceScore >= 55
          ? "Existem bons sinais, mas ainda há espaço para maior consistência."
          : "Complete seus dados e retome a regularidade para receber orientações melhores.";

  const coachInsight = getCoachInsight({
    meals,
    weeklyActivitiesCount,
    weeklyDistanceKm,
    weeklyMovingTime,
    avgHeartRate,
    weightLogs,
  });

  const profileFields = [weightKg, heightCm, age, gender, goal];
  const completedProfileFields = profileFields.filter(
    (value) => value.trim().length > 0
  ).length;

  const profileDataScore = profileId
    ? Math.round((completedProfileFields / profileFields.length) * 20)
    : 0;
  const trainingDataScore = stravaActivities.length > 0 ? 30 : 0;
  const bodyDataScore =
    (currentCoachWeight != null || weightKg.trim() ? 10 : 0) +
    (bioimpedanceLogs.length > 0 ? 5 : 0);
  const healthDataScore =
    (bloodTestLogs.length > 0 ? 12 : 0) +
    (bioimpedanceLogs.length > 0 ? 8 : 0);
  const nutritionDataScore =
    meals.length >= 7 ? 15 : meals.length > 0 ? 8 : 0;
  const dataQuality = Math.min(
    100,
    profileDataScore +
      trainingDataScore +
      bodyDataScore +
      healthDataScore +
      nutritionDataScore
  );

  const latestActivity = stravaActivities[0] ?? null;
  const latestActivityTitle =
    latestActivity?.name?.trim() ||
    latestActivity?.sport_type?.trim() ||
    latestActivity?.type?.trim() ||
    "Nenhum treino recente";
  const latestActivityDetail = latestActivity
    ? [
        latestActivity.distance
          ? `${(latestActivity.distance / 1000).toFixed(1)} km`
          : null,
        latestActivity.moving_time
          ? `${Math.round(latestActivity.moving_time / 60)} min`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Conecte ou sincronize seus aplicativos esportivos.";

  const latestWeight =
    currentCoachWeight != null
      ? `${currentCoachWeight.toFixed(1)} kg`
      : weightKg.trim()
        ? `${weightKg.trim()} kg`
        : "Peso ainda não registrado";

  const performanceAreas: PerformanceArea[] = [
    {
      title: "Perfil do atleta",
      score: Math.round(goalScore),
      status:
        completedProfileFields >= 4
          ? "Completo"
          : `${completedProfileFields} de ${profileFields.length}`,
      description:
        goal.trim() || goalType.trim()
          ? goal.trim() || goalType.trim()
          : "Defina seus objetivos e informações físicas para personalizar as análises.",
      detail: goalDate
        ? `Meta para ${new Date(`${goalDate}T12:00:00`).toLocaleDateString("pt-BR")}`
        : `${latestWeight} · ${heightCm.trim() ? `${heightCm} cm` : "altura não informada"}`,
      href: "/performance-ai/profile",
      action: profileId ? "Abrir perfil" : "Completar perfil",
      available: completedProfileFields >= 4,
    },
    {
      title: "Treinos",
      score: Math.round(trainingScore),
      status:
        stravaActivities.length > 0
          ? `${stravaActivities.length} atividades`
          : "Não sincronizado",
      description: latestActivityTitle,
      detail: `${latestActivityDetail} · ${formatDuration(weeklyMovingTime)} no período`,
      href: "/performance-ai/training",
      action:
        stravaActivities.length > 0
          ? "Ver treinamentos"
          : "Conectar ou sincronizar",
      available: stravaActivities.length > 0,
    },
    {
      title: "Corpo",
      score: Math.round(weightScore),
      status:
        currentCoachWeight != null || weightKg.trim()
          ? "Dados disponíveis"
          : "Sem peso",
      description: latestWeight,
      detail:
        bioimpedanceLogs.length > 0
          ? `${bioimpedanceLogs.length} avaliação${bioimpedanceLogs.length === 1 ? "" : "ões"} corporal${bioimpedanceLogs.length === 1 ? "" : "es"}`
          : "Nenhuma bioimpedância registrada.",
      href: "/performance-ai/body",
      action:
        currentCoachWeight != null || weightKg.trim()
          ? "Ver evolução corporal"
          : "Registrar peso",
      available: currentCoachWeight != null || Boolean(weightKg.trim()),
    },
    {
      title: "Saúde",
      score: Math.round(healthScore),
      status:
        bloodTestLogs.length + bioimpedanceLogs.length > 0
          ? `${bloodTestLogs.length + bioimpedanceLogs.length} registros`
          : "Sem registros",
      description:
        bloodTestLogs.length > 0 || bioimpedanceLogs.length > 0
          ? "Seus dados de saúde estão disponíveis para contextualizar as recomendações."
          : "Adicione exames e avaliações corporais para ampliar a análise.",
      detail: `${bloodTestLogs.length} exames de sangue · ${bioimpedanceLogs.length} avaliações corporais`,
      href: "/performance-ai/blood",
      action:
        bloodTestLogs.length > 0
          ? "Ver exames"
          : "Adicionar dados de saúde",
      available:
        bloodTestLogs.length > 0 || bioimpedanceLogs.length > 0,
    },
    {
      title: "Nutrição",
      score: Math.round(nutritionScore),
      status:
        meals.length > 0
          ? `${meals.length} registros`
          : "Sem registros",
      description:
        meals.length > 0
          ? highProteinMealCount >= 2
            ? "Boa ingestão de proteína nas refeições recentes."
            : "Sua alimentação já está sendo considerada nas análises."
          : "Registre refeições para relacionar alimentação, energia, treino e recuperação.",
      detail: `${meals.length} refeições · ${highProteinMealCount} com proteína alta · ${lowQualityMealCount} de baixa qualidade`,
      href: "/performance-ai/nutrition",
      action: meals.length > 0 ? "Abrir nutrição" : "Registrar refeição",
      available: meals.length > 0,
    },
  ];

  if (loading) {
    return (
      <>
        <main style={pageStyle}>Carregando...</main>
        <BottomNavbar />
      </>
    );
  }

  return (
    <>
      <main style={pageStyle}>

        {message ? <div style={globalMessageStyle}>{message}</div> : null}

        <section
          style={{
            width: "100%",
            boxSizing: "border-box",
            display: "grid",
            gap: 0,
          }}
        >
          <PerformanceOverviewHero
            performanceScore={performanceScore}
            performanceStatus={performanceStatus}
            statusDescription={statusDescription}
            insight={coachInsight}
          />

          <PerformanceAreasGrid
            areas={performanceAreas}
            dataQuality={dataQuality}
          />
        </section>
      </main>

      <BottomNavbar />
    </>
  );
}

const eyebrowStyle: React.CSSProperties = {
  color: "#F1D36B",
  fontSize: 11,
  fontWeight: 850,
  letterSpacing: "0.14em",
  lineHeight: 1.4,
  textTransform: "uppercase",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "12px 0 0",
  color: "#ffffff",
  fontSize: "clamp(30px, 5vw, 48px)",
  fontWeight: 780,
  lineHeight: 1.05,
  letterSpacing: "-0.035em",
};

const sectionTextStyle: React.CSSProperties = {
  margin: "18px 0 0",
  maxWidth: 680,
  color: "#a1a1aa",
  fontSize: "clamp(15px, 2vw, 17px)",
  lineHeight: 1.75,
};

const smallLabelStyle: React.CSSProperties = {
  color: "#8f8f98",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.12em",
  lineHeight: 1.4,
  textTransform: "uppercase",
};

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  boxSizing: "border-box",
  padding: "20px 0 110px",
  background:
    "radial-gradient(circle at 50% -120px, rgba(212,175,55,0.13) 0%, rgba(212,175,55,0.035) 24%, rgba(9,9,11,0) 48%), linear-gradient(180deg, #09090b 0%, #050506 55%, #000000 100%)",
  color: "#ffffff",
  fontFamily: "Montserrat, sans-serif",
};

const globalMessageStyle: React.CSSProperties = {
  width: "calc(100% - 32px)",
  boxSizing: "border-box",
  margin: "0 16px 16px",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(212,175,55,0.42)",
  background:
    "linear-gradient(145deg, rgba(39,39,42,0.96) 0%, rgba(15,15,17,0.98) 100%)",
  boxShadow:
    "0 14px 30px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.06)",
  color: "#F1D36B",
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 700,
};



export default PerformanceAIPage;




const backLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 9,
  color: "#d4d4d8",
  fontSize: 13,
  fontWeight: 650,
  textDecoration: "none",
};




















