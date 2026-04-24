"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import { supabaseBrowser } from "@/lib/supabase-browser";

type ProfileRow = {
  id: string;
  user_id: string;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  gender: string | null;
  goal: string | null;
  health_notes: string | null;
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

type WeightLogRow = {
  id: string;
  weight_kg: number;
  created_at: string;
};

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
};

function classifyMeal(mealText: string) {
  const text = mealText.toLowerCase();

  let mealType = "refeição";
  if (
    text.includes("breakfast") ||
    text.includes("café") ||
    text.includes("cafe") ||
    text.includes("coffee") ||
    text.includes("bread") ||
    text.includes("pão") ||
    text.includes("ovo") ||
    text.includes("egg")
  ) {
    mealType = "café da manhã";
  } else if (
    text.includes("lunch") ||
    text.includes("almoço") ||
    text.includes("almoco") ||
    text.includes("rice") ||
    text.includes("arroz") ||
    text.includes("beans") ||
    text.includes("feijão") ||
    text.includes("feijao")
  ) {
    mealType = "almoço";
  } else if (
    text.includes("dinner") ||
    text.includes("jantar") ||
    text.includes("soup") ||
    text.includes("sopa")
  ) {
    mealType = "jantar";
  } else if (
    text.includes("snack") ||
    text.includes("lanche") ||
    text.includes("bar") ||
    text.includes("banana") ||
    text.includes("fruit") ||
    text.includes("fruta")
  ) {
    mealType = "lanche";
  }

  let proteinLevel = "baixa";
  if (
    text.includes("chicken") ||
    text.includes("frango") ||
    text.includes("egg") ||
    text.includes("ovo") ||
    text.includes("beef") ||
    text.includes("carne") ||
    text.includes("fish") ||
    text.includes("peixe") ||
    text.includes("turkey") ||
    text.includes("whey") ||
    text.includes("yogurt") ||
    text.includes("iogurte")
  ) {
    proteinLevel = "alta";
  } else if (
    text.includes("cheese") ||
    text.includes("queijo") ||
    text.includes("milk") ||
    text.includes("leite") ||
    text.includes("beans") ||
    text.includes("feijão") ||
    text.includes("feijao")
  ) {
    proteinLevel = "média";
  }

  let qualityLevel = "ok";
  if (
    text.includes("pizza") ||
    text.includes("burger") ||
    text.includes("hamburger") ||
    text.includes("refrigerante") ||
    text.includes("soda") ||
    text.includes("fries") ||
    text.includes("frita") ||
    text.includes("cake") ||
    text.includes("bolo") ||
    text.includes("cookie") ||
    text.includes("doce")
  ) {
    qualityLevel = "baixa";
  } else if (
    text.includes("salad") ||
    text.includes("salada") ||
    text.includes("fruit") ||
    text.includes("fruta") ||
    text.includes("rice") ||
    text.includes("arroz") ||
    text.includes("beans") ||
    text.includes("feijão") ||
    text.includes("feijao") ||
    text.includes("vegetable") ||
    text.includes("legume")
  ) {
    qualityLevel = "boa";
  }

  let aiNotes = "Refeição equilibrada.";
  if (qualityLevel === "baixa") {
    aiNotes = "Qualidade nutricional baixa. Tente adicionar proteína e reduzir ultraprocessados.";
  } else if (qualityLevel === "boa" && proteinLevel === "alta") {
    aiNotes = "Boa escolha. Essa refeição tem bom suporte de proteína para recuperação.";
  } else if (proteinLevel === "baixa") {
    aiNotes = "Considere adicionar uma fonte de proteína mais forte para apoiar performance e recuperação.";
  }

  return {
    meal_type: mealType,
    protein_level: proteinLevel,
    quality_level: qualityLevel,
    ai_notes: aiNotes,
  };
}

function getDailyInsight(meals: MealRow[]) {
  if (!meals || meals.length === 0) {
    return "Nenhuma refeição registrada hoje.";
  }

  const proteinHigh = meals.filter((meal) => meal.protein_level === "alta").length;
  const qualityLow = meals.filter((meal) => meal.quality_level === "baixa").length;
  const qualityGood = meals.filter((meal) => meal.quality_level === "boa").length;

  if (qualityLow >= 2) {
    return "Sua alimentação hoje teve baixa qualidade. Tente reduzir ultraprocessados e incluir comida de verdade.";
  }

  if (proteinHigh >= 2) {
    return "Boa ingestão de proteína hoje. Isso ajuda na recuperação muscular.";
  }

  if (qualityGood >= 2) {
    return "Boa qualidade alimentar hoje. Continue mantendo consistência nas escolhas.";
  }

  if (meals.length <= 2) {
    return "Poucas refeições registradas. Tente manter mais consistência ao longo do dia.";
  }

  return "Seu dia está relativamente equilibrado até agora.";
}

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

  const lowQualityMeals = meals.filter((meal) => meal.quality_level === "baixa").length;
  const highProteinMeals = meals.filter((meal) => meal.protein_level === "alta").length;
  const totalTrainingHours = weeklyMovingTime / 3600;

  const currentWeight = weightLogs.length > 0 ? Number(weightLogs[0].weight_kg) : null;
  const previousWeight = weightLogs.length > 1 ? Number(weightLogs[1].weight_kg) : null;
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
    return "Você registrou alimentação, mas não há treinos recentes no Strava. Se hoje for dia de descanso, foque em recuperação e consistência.";
  }

  if (totalTrainingHours >= 3 && highProteinMeals >= 2) {
    return "Bom equilíbrio entre treino e alimentação. Você está sustentando bem a recuperação nesta fase.";
  }

  if (weightDiff != null && Math.abs(weightDiff) < 0.3 && weeklyActivitiesCount >= 3) {
    return "Seu peso está estável e sua rotina de treino segue ativa. Isso sugere boa consistência nesta fase.";
  }

  return "Seu quadro está relativamente equilibrado. Continue registrando refeições, peso e treinos para receber orientações mais precisas.";
}

function highLevelFoodTip(meals: MealRow[]) {
  if (!meals || meals.length === 0) {
    return "Registre suas refeições para receber orientação.";
  }

  const lowQualityMeals = meals.filter((m) => m.quality_level === "baixa").length;
  const highProteinMeals = meals.filter((m) => m.protein_level === "alta").length;

  if (lowQualityMeals >= 2) {
    return "Hoje vale focar em comida de verdade e reduzir ultraprocessados.";
  }

  if (highProteinMeals >= 2) {
    return "Boa ingestão de proteína hoje. Continue assim.";
  }

  return "Tente incluir proteína e manter refeições mais equilibradas.";
}

function highLevelTrainingTip(count: number, distance: number, time: number) {
  if (count === 0) return "Sem treinos recentes. Comece leve.";
  if (distance >= 20) return "Volume alto. Priorize recuperação.";
  if (count >= 4) return "Boa frequência. Mantenha consistência.";
  if (time / 3600 >= 3) return "Carga relevante. Evite aumentar tudo de uma vez.";
  return "Continue treinando e aumente gradualmente.";
}

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return "0h 0min";
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}min`;
}

function formatShortDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}


function startOfDayLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isInRange(dateStr: string | null, range: RangeKey, now: Date) {
  if (range === "all") return true;
  if (!dateStr) return false;

  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;

  const today = startOfDayLocal(now);
  const day = startOfDayLocal(d);
  const diffDays = Math.floor((today.getTime() - day.getTime()) / 86400000);

  if (range === "7d") return diffDays >= 0 && diffDays <= 6;
  if (range === "30d") return diffDays >= 0 && diffDays <= 29;
  if (range === "6m") return diffDays >= 0 && diffDays <= 179;

  return true;
}

function getTrainingCoachInsight(params: {
  weeklyActivitiesCount: number;
  weeklyDistanceKm: number;
  weeklyMovingTime: number;
  avgHeartRate: number | null;
  weightLogs: WeightLogRow[];
}) {
  const {
    weeklyActivitiesCount,
    weeklyDistanceKm,
    weeklyMovingTime,
    avgHeartRate,
    weightLogs,
  } = params;

  const totalTrainingHours = weeklyMovingTime / 3600;
  const currentWeight = weightLogs.length > 0 ? Number(weightLogs[0].weight_kg) : null;
  const previousWeight = weightLogs.length > 1 ? Number(weightLogs[1].weight_kg) : null;
  const weightDiff =
    currentWeight != null && previousWeight != null
      ? Number((currentWeight - previousWeight).toFixed(1))
      : null;

  if (weeklyActivitiesCount === 0) {
    return "Você está sem treinos recentes no Strava. Vale voltar com uma sessão leve para retomar consistência.";
  }

  if (weeklyDistanceKm >= 30 || totalTrainingHours >= 4) {
    return "Seu volume recente está alto. Hoje a prioridade deve ser recuperação ou um treino leve.";
  }

  if (avgHeartRate && avgHeartRate >= 155) {
    return "Seu esforço médio está alto. Evite aumentar carga em sequência e preste atenção na recuperação.";
  }

  if (weightDiff != null && weightDiff <= -1 && totalTrainingHours >= 3) {
    return "Seu peso caiu junto com uma boa carga de treino. Monitore energia e recuperação para não entrar em déficit excessivo.";
  }

  if (weeklyActivitiesCount >= 4) {
    return "Boa frequência de treino. O foco agora é manter constância e não subir a carga rápido demais.";
  }

  return "Sua rotina de treino está em andamento. Tente manter regularidade e evolução gradual.";
}

function getNutritionCoachInsight(params: {
  meals: MealRow[];
  weeklyActivitiesCount: number;
  weeklyDistanceKm: number;
  weeklyMovingTime: number;
}) {
  const { meals, weeklyActivitiesCount, weeklyDistanceKm, weeklyMovingTime } = params;

  const lowQualityMeals = meals.filter((meal) => meal.quality_level === "baixa").length;
  const highProteinMeals = meals.filter((meal) => meal.protein_level === "alta").length;
  const totalTrainingHours = weeklyMovingTime / 3600;

  if (meals.length === 0) {
    return "Você ainda não registrou alimentação. Sem isso, a recomendação nutricional fica limitada.";
  }

  if ((weeklyDistanceKm >= 25 || totalTrainingHours >= 3) && highProteinMeals <= 1) {
    return "Seu treino pede mais recuperação nutricional. Vale reforçar proteína nas próximas refeições.";
  }

  if (lowQualityMeals >= 2) {
    return "Sua alimentação recente teve qualidade baixa. Tente reduzir ultraprocessados e voltar para comida de verdade.";
  }

  if (weeklyActivitiesCount >= 4 && meals.length <= 2) {
    return "Você treinou bem, mas registrou poucas refeições. Pode estar faltando consistência na alimentação.";
  }

  if (highProteinMeals >= 2) {
    return "Boa ingestão de proteína. Isso favorece recuperação e manutenção de performance.";
  }

  return "Sua alimentação está razoável, mas ainda pode ficar mais estratégica para acompanhar a carga de treino.";
}


export default function PerformanceAIPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingMeal, setAddingMeal] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [goal, setGoal] = useState("");
  const [healthNotes, setHealthNotes] = useState("");
  const [mealText, setMealText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [meals, setMeals] = useState<MealRow[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLogRow[]>([]);
  const [stravaActivities, setStravaActivities] = useState<StravaActivityRow[]>([]);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [range, setRange] = useState<RangeKey>("7d");

  useEffect(() => {
    const loadPage = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user ?? null;

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("performance_ai_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle<ProfileRow>();

      if (profile) {
        setProfileId(profile.id);
        setWeightKg(profile.weight_kg?.toString() ?? "");
        setHeightCm(profile.height_cm?.toString() ?? "");
        setAge(profile.age?.toString() ?? "");
        setGender(profile.gender ?? "");
        setGoal(profile.goal ?? "");
        setHealthNotes(profile.health_notes ?? "");
      }

      const { data: mealsData } = await supabase
        .from("performance_ai_meals")
        .select("id, meal_text, eaten_at, meal_type, protein_level, quality_level, ai_notes")
        .eq("user_id", user.id)
        .order("eaten_at", { ascending: false })
        .limit(10);

      setMeals((mealsData ?? []) as MealRow[]);

      const { data: weightData } = await supabase
        .from("performance_ai_weight_logs")
        .select("id, weight_kg, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setWeightLogs((weightData ?? []) as WeightLogRow[]);

      const { data: tokenRow } = await supabase
        .from("strava_tokens")
        .select("athlete_id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tokenRow?.athlete_id) {
        setStravaConnected(true);

        const { data: activitiesData } = await supabase
          .from("strava_activities")
          .select("id, athlete_id, name, type, sport_type, start_date, distance, moving_time, average_heartrate, max_heartrate")
          .eq("athlete_id", tokenRow.athlete_id)
          .order("start_date", { ascending: false })
          .limit(20);

        setStravaActivities((activitiesData ?? []) as StravaActivityRow[]);
      }

      setLoading(false);
    };

    loadPage();
  }, [router, supabase]);

  const handleSync = async () => {
    try {
      setMessage(null);
      setSyncing(true);

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        console.error("Erro ao pegar sessão (sync):", sessionErr);
        setMessage("Erro ao autenticar para sincronizar. Faça login novamente.");
        setSyncing(false);
        return;
      }

      const accessToken = sessionData.session?.access_token ?? null;
      if (!accessToken) {
        setMessage("Você precisa estar logado para sincronizar.");
        setSyncing(false);
        return;
      }

      const res = await fetch("/api/strava/sync", {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Sync falhou:", { status: res.status, statusText: res.statusText, json });
        setMessage(
          (json?.message as string) ?? "Falha ao sincronizar com o Strava. Tente novamente."
        );
        setSyncing(false);
        return;
      }

      setMessage(
        typeof json?.fetched === "number"
          ? `Sincronizado: ${json.fetched} atividades verificadas. Recarregando...`
          : "Sincronizado. Recarregando..."
      );

      window.location.reload();
    } catch (e) {
      console.error("Erro inesperado no sync:", e);
      setMessage("Erro inesperado ao sincronizar. Tente novamente.");
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    setMessage(null);

    const payload = {
      user_id: userId,
      weight_kg: weightKg ? Number(weightKg) : null,
      height_cm: heightCm ? Number(heightCm) : null,
      age: age ? Number(age) : null,
      gender: gender || null,
      goal: goal || null,
      health_notes: healthNotes || null,
      updated_at: new Date().toISOString(),
    };

    if (profileId) {
      const { error } = await supabase
        .from("performance_ai_profiles")
        .update(payload)
        .eq("id", profileId);

      setMessage(error ? error.message : "Perfil salvo com sucesso.");
    } else {
      const { data, error } = await supabase
        .from("performance_ai_profiles")
        .insert(payload)
        .select("id")
        .single();

      if (!error && data?.id) setProfileId(data.id);
      setMessage(error ? error.message : "Perfil criado com sucesso.");
    }

    setSaving(false);
  };

  const handleAddWeight = async () => {
    if (!userId || !weightKg.trim()) return;

    setSavingWeight(true);
    setMessage(null);

    const weightNumber = Number(weightKg);

    if (Number.isNaN(weightNumber) || weightNumber <= 0) {
      setMessage("Digite um peso válido.");
      setSavingWeight(false);
      return;
    }

    const { data, error } = await supabase
      .from("performance_ai_weight_logs")
      .insert({
        user_id: userId,
        weight_kg: weightNumber,
      })
      .select("id, weight_kg, created_at")
      .single();

    if (!error && data) {
      setWeightLogs((prev) => [data as WeightLogRow, ...prev].slice(0, 10));
      setMessage("Peso registrado com sucesso.");
    } else {
      setMessage(error?.message ?? "Erro ao registrar peso.");
    }

    setSavingWeight(false);
  };

  const handleDeleteWeight = async (id: string) => {
    const { error } = await supabase
      .from("performance_ai_weight_logs")
      .delete()
      .eq("id", id);

    if (!error) {
      setWeightLogs((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleAddMeal = async () => {
    if (!userId || !mealText.trim()) return;

    setAddingMeal(true);
    setMessage(null);

    const mealAnalysis = classifyMeal(mealText.trim());

    const { data, error } = await supabase
      .from("performance_ai_meals")
      .insert({
        user_id: userId,
        profile_id: profileId,
        meal_text: mealText.trim(),
        ...mealAnalysis,
      })
      .select("id, meal_text, eaten_at, meal_type, protein_level, quality_level, ai_notes")
      .single();

    if (!error && data) {
      setMeals((prev) => [data as MealRow, ...prev].slice(0, 10));
      setMealText("");
      setMessage("Refeição adicionada.");
    } else {
      setMessage(error?.message ?? "Erro ao adicionar refeição.");
    }

    setAddingMeal(false);
  };

  const now = new Date();

  const filteredActivities = stravaActivities.filter((item) =>
    isInRange(item.start_date, range, now)
  );

  const weeklyActivitiesCount = filteredActivities.length;
  const weeklyDistanceKm = filteredActivities.reduce((sum, item) => sum + ((item.distance ?? 0) / 1000), 0);
  const weeklyMovingTime = filteredActivities.reduce((sum, item) => sum + (item.moving_time ?? 0), 0);

  const activitiesWithHr = filteredActivities.filter(
    (item) => item.average_heartrate != null || item.max_heartrate != null
  );

  const avgHeartRate =
    activitiesWithHr.length > 0
      ? Math.round(
          activitiesWithHr.reduce((sum, item) => sum + (item.average_heartrate ?? 0), 0) /
            activitiesWithHr.length
        )
      : null;

  const maxHeartRate =
    activitiesWithHr.length > 0
      ? Math.round(Math.max(...activitiesWithHr.map((item) => item.max_heartrate ?? 0)))
      : null;

  const lastActivity = filteredActivities.length > 0 ? filteredActivities[0] : null;

      const coachInsight = getCoachInsight({
    meals,
    weeklyActivitiesCount,
    weeklyDistanceKm,
    weeklyMovingTime,
    avgHeartRate,
    weightLogs,
  });

  const trainingCoachInsight = getTrainingCoachInsight({
    weeklyActivitiesCount,
    weeklyDistanceKm,
    weeklyMovingTime,
    avgHeartRate,
    weightLogs,
  });

  const nutritionCoachInsight = getNutritionCoachInsight({
    meals,
    weeklyActivitiesCount,
    weeklyDistanceKm,
    weeklyMovingTime,

  });


  const chartActivities = [...filteredActivities]
    .slice(0, 12)
    .reverse();

  const chartMaxKm = Math.max(
    1,
    ...chartActivities.map((item) => (item.distance ?? 0) / 1000)
  );

  const chartWidth = 900;
  const chartHeight = 260;
  const chartPaddingX = 24;
  const chartPaddingTop = 20;
  const chartPaddingBottom = 34;

  const linePoints = chartActivities.map((activity, index) => {
    const km = (activity.distance ?? 0) / 1000;
    const usableWidth = chartWidth - chartPaddingX * 2;
    const usableHeight = chartHeight - chartPaddingTop - chartPaddingBottom;

    const x =
      chartActivities.length <= 1
        ? chartWidth / 2
        : chartPaddingX + (index * usableWidth) / (chartActivities.length - 1);

    const y =
      chartHeight - chartPaddingBottom - (km / chartMaxKm) * usableHeight;

    return {
      x,
      y,
      km,
      label: formatShortDate(activity.start_date),
      title: activity.name ?? activity.type ?? activity.sport_type ?? "Atividade",
    };
  });

  const linePath =
    linePoints.length > 0
      ? linePoints
          .map((point, index) =>
            `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
          )
          .join(" ")
      : "";

  if (loading) {
    return (
      <main style={pageStyle}>
        Carregando...
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={{ marginBottom: 16 }}>
        <BackButton />
      </div>

      {/* ===== PAGINA 1 ===== */}
      <section
        style={{
          marginTop: 20,
          marginBottom: 28,
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            padding: 22,
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#64748b",
              fontWeight: 700,
            }}
          >
            Performance AI
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.05,
            }}
          >
            Seu plano em um só lugar
          </h1>

          <div
            style={{
              fontSize: 15,
              color: "#334155",
              lineHeight: 1.65,
            }}
          >
            Aqui você acompanha treino, alimentação e evolução em um único lugar.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div
              style={{
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#64748b",
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Orientação de alimentação
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: "#334155",
                  lineHeight: 1.6,
                }}
              >
                {highLevelFoodTip(meals)}
              </div>
            </div>

            <div
              style={{
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#64748b",
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Orientação de treino
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: "#334155",
                  lineHeight: 1.6,
                }}
              >
                {stravaConnected
                  ? highLevelTrainingTip(weeklyActivitiesCount, weeklyDistanceKm, weeklyMovingTime)
                  : "Conecte o Strava para receber orientação de treino aqui."}
              </div>
            </div>
          </div>
        </div>

        <a
          href="#perfil"
          style={{
            display: "grid",
            gap: 8,
            textDecoration: "none",
            background: "#0f172a",
            border: "1px solid #0f172a",
            borderRadius: 6,
            padding: 22,
            color: "#ffffff",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#cbd5e1",
              fontWeight: 700,
            }}
          >
            Seção 01
          </div>

          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            Meu Perfil
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "#cbd5e1",
            }}
          >
            Dados principais, saúde, objetivo e histórico de peso.
          </div>
        </a>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <a
            href="#treino"
            style={{
              display: "grid",
              gap: 8,
              textDecoration: "none",
              background: "#cbd5e1",
              border: "1px solid #94a3b8",
              borderRadius: 6,
              padding: 20,
              color: "#0f172a",
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#475569",
                fontWeight: 700,
              }}
            >
              Seção 02
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              Treino
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "#334155",
              }}
            >
              Strava, métricas, histórico e orientação de treino.
            </div>
          </a>

          <a
            href="#alimentacao"
            style={{
              display: "grid",
              gap: 8,
              textDecoration: "none",
              background: "#cbd5e1",
              border: "1px solid #94a3b8",
              borderRadius: 6,
              padding: 20,
              color: "#0f172a",
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#475569",
                fontWeight: 700,
              }}
            >
              Seção 03
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              Alimentação
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "#334155",
              }}
            >
              Registro de refeições, análise nutricional e sugestões.
            </div>
          </a>
        </div>
      </section>

      <section id="perfil" style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>Meu perfil</h2>

        <div style={gridTwoStyle}>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Dados do atleta</h3>
            <input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="Peso (kg)" style={inputStyle} />
            <input value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="Altura (cm)" style={inputStyle} />
            <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Idade" style={inputStyle} />
            <select value={gender} onChange={(e) => setGender(e.target.value)} style={inputStyle}>
              <option value="">Gênero</option>
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
              <option value="other">Outro</option>
            </select>
            <select value={goal} onChange={(e) => setGoal(e.target.value)} style={inputStyle}>
              <option value="">Objetivo</option>
              <option value="performance">Performance</option>
              <option value="weight_loss">Perda de peso</option>
              <option value="conditioning">Condicionamento</option>
              <option value="maintenance">Manutenção</option>
            </select>
            <textarea
              value={healthNotes}
              onChange={(e) => setHealthNotes(e.target.value)}
              placeholder="Observações importantes de saúde"
              rows={4}
              style={{ ...inputStyle, resize: "vertical", minHeight: 90 }}
            />
            <button onClick={handleSave} disabled={saving} style={primaryButtonStyle}>
              {saving ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Histórico de peso</h3>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <input
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="Peso (kg)"
                style={{ ...inputStyle, maxWidth: 150 }}
              />
              <button onClick={handleAddWeight} disabled={savingWeight} style={darkButtonStyle}>
                {savingWeight ? "Salvando..." : "Atualizar Peso"}
              </button>
            </div>

            {weightLogs.length === 0 ? (
              <div style={emptyTextStyle}>Nenhum peso registrado ainda.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {weightLogs.map((log) => (
                  <div key={log.id} style={rowCardStyle}>
                    <div>
                      <div style={rowPrimaryStyle}>{Number(log.weight_kg).toFixed(1)} kg</div>
                      <div style={rowSecondaryStyle}>{new Date(log.created_at).toLocaleString()}</div>
                    </div>
                    <button onClick={() => handleDeleteWeight(log.id)} style={deleteButtonStyle}>
                      Excluir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="treino" style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>Treino</h2>

        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <h3 style={cardTitleStyle}>Resumo do Strava</h3>
            <button type="button" onClick={handleSync} disabled={syncing} style={darkButtonStyle}>
              {syncing ? "Sincronizando..." : "Sincronizar agora"}
            </button>
          </div>

          {!stravaConnected ? (
            <div style={emptyTextStyle}>Strava não conectado para este usuário.</div>
          ) : (
            <>
              <div style={statsGridStyle}>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Atividades</div>
                  <div style={statValueStyle}>{weeklyActivitiesCount}</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Distância</div>
                  <div style={statValueStyle}>{weeklyDistanceKm.toFixed(1)} km</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Tempo</div>
                  <div style={statValueStyle}>{formatDuration(weeklyMovingTime)}</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>FC média</div>
                  <div style={statValueStyle}>{avgHeartRate ? `${avgHeartRate} bpm` : "-"}</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>FC máx</div>
                  <div style={statValueStyle}>{maxHeartRate ? `${maxHeartRate} bpm` : "-"}</div>
                </div>
              </div>

              <div style={hintTextStyle}>
                {lastActivity
                  ? `Última atividade: ${lastActivity.name ?? lastActivity.type ?? lastActivity.sport_type ?? "Atividade"}`
                  : "Nenhuma atividade encontrada."}
              </div>
            </>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <h3 style={cardTitleStyle}>Evolução do treino</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={() => setRange("7d")} style={range === "7d" ? filterButtonActiveStyle : filterButtonStyle}>7 dias</button>
              <button type="button" onClick={() => setRange("30d")} style={range === "30d" ? filterButtonActiveStyle : filterButtonStyle}>30 dias</button>
              <button type="button" onClick={() => setRange("6m")} style={range === "6m" ? filterButtonActiveStyle : filterButtonStyle}>6 meses</button>
              <button type="button" onClick={() => setRange("all")} style={range === "all" ? filterButtonActiveStyle : filterButtonStyle}>Tudo</button>
            </div>
          </div>

          {!stravaConnected || linePoints.length === 0 ? (
            <div style={emptyTextStyle}>Nenhuma atividade para exibir no gráfico.</div>
          ) : (
            <div style={modernChartWrapStyle}>
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                style={{ width: "100%", height: 280, display: "block" }}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="lineFillGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(30,58,138,0.20)" />
                    <stop offset="100%" stopColor="rgba(30,58,138,0.02)" />
                  </linearGradient>
                  <linearGradient id="lineStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>

                {[0, 1, 2, 3].map((step) => {
                  const y =
                    chartPaddingTop +
                    ((chartHeight - chartPaddingTop - chartPaddingBottom) / 3) * step;

                  return (
                    <line
                      key={step}
                      x1={chartPaddingX}
                      x2={chartWidth - chartPaddingX}
                      y1={y}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                  );
                })}

                {linePoints.length > 1 ? (
                  <path
                    d={`${linePath} L ${linePoints[linePoints.length - 1].x} ${chartHeight - chartPaddingBottom} L ${linePoints[0].x} ${chartHeight - chartPaddingBottom} Z`}
                    fill="url(#lineFillGradient)"
                  />
                ) : null}

                {linePoints.length > 1 ? (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="url(#lineStrokeGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}

                {linePoints.map((point, index) => (
                  <g key={index}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="5"
                      fill="#ffffff"
                      stroke="#1d4ed8"
                      strokeWidth="3"
                    />
                    <text
                      x={point.x}
                      y={point.y - 12}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#475569"
                      fontWeight="700"
                    >
                      {point.km.toFixed(1)}
                    </text>
                    <text
                      x={point.x}
                      y={chartHeight - 10}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#64748b"
                    >
                      {point.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Histórico recente do Strava</h3>

          {!stravaConnected || filteredActivities.length === 0 ? (
            <div style={emptyTextStyle}>Nenhuma atividade encontrada.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {filteredActivities.slice(0, 8).map((activity) => (
                <div key={activity.id} style={rowCardStyle}>
                  <div>
                    <div style={rowPrimaryStyle}>
                      {activity.name ?? activity.type ?? activity.sport_type ?? "Atividade"}
                    </div>
                    <div style={rowSecondaryStyle}>
                      {activity.start_date ? new Date(activity.start_date).toLocaleString() : "-"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={rowPrimaryStyle}>
                      {((activity.distance ?? 0) / 1000).toFixed(1)} km
                    </div>
                    <div style={rowSecondaryStyle}>
                      {formatDuration(activity.moving_time ?? 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={gridTwoStyle}>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Coach de treino</h3>
            <div style={summaryTextStyle}>{trainingCoachInsight}</div>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Coach de alimentação</h3>
            <div style={summaryTextStyle}>{nutritionCoachInsight}</div>
          </div>
        </div>
      </section>

      <section id="alimentacao" style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>Alimentação</h2>

        <div style={gridTwoStyle}>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Adicionar alimentação</h3>
            <input
              value={mealText}
              onChange={(e) => setMealText(e.target.value)}
              placeholder="O que você comeu? (ex.: frango com arroz e salada)"
              style={inputStyle}
            />
            <button onClick={handleAddMeal} disabled={addingMeal} style={greenButtonStyle}>
              {addingMeal ? "Adicionando..." : "+ Adicionar refeição"}
            </button>
            <div style={hintTextStyle}>{getDailyInsight(meals)}</div>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Sugestão alimentar</h3>
            <div style={summaryTextStyle}>{highLevelFoodTip(meals)}</div>
            <div style={hintTextStyle}>
              Isso ainda é uma lógica inicial. Depois a gente pode transformar em IA real.
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Refeições registradas</h3>
          {meals.length === 0 ? (
            <div style={emptyTextStyle}>Nenhuma refeição adicionada ainda.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {meals.map((meal) => (
                <div key={meal.id} style={mealCardStyle}>
                  <div>
                    <div style={rowPrimaryStyle}>{meal.meal_text}</div>
                    <div style={rowSecondaryStyle}>{new Date(meal.eaten_at).toLocaleString()}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <span style={tagStyle}>{meal.meal_type ?? "refeição"}</span>
                    <span style={tagStyle}>proteína: {meal.protein_level ?? "-"}</span>
                    <span style={tagStyle}>qualidade: {meal.quality_level ?? "-"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {message ? <div style={globalMessageStyle}>{message}</div> : null}
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#ffffff",
  color: "#0f172a",
  padding: 16,
  paddingBottom: 100,
  fontFamily: "Montserrat, sans-serif",
};

const sectionStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  marginBottom: 28,
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  margin: 0,
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  margin: 0,
};

const gridTwoStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14,
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  padding: 16,
  display: "grid",
  gap: 12,
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: 10,
};

const statCardStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  padding: 12,
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  marginBottom: 6,
};

const statValueStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "#0f172a",
};

const rowCardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  padding: 12,
  background: "#f8fafc",
};

const mealCardStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  padding: 12,
  background: "#f8fafc",
};

const rowPrimaryStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#0f172a",
};

const rowSecondaryStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 4,
};

const summaryTextStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#334155",
  lineHeight: 1.6,
};

const hintTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#64748b",
  lineHeight: 1.5,
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#64748b",
};

const globalMessageStyle: React.CSSProperties = {
  position: "sticky",
  bottom: 16,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  padding: 12,
  fontSize: 13,
  color: "#475569",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  background: "#f1f5f9",
  color: "#0f172a",
  padding: "10px 12px",
  boxSizing: "border-box",
  fontFamily: "Montserrat, sans-serif",
};

const tagStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#475569",
  border: "1px solid #cbd5e1",
  borderRadius: 999,
  padding: "4px 8px",
  background: "#ffffff",
  fontFamily: "Montserrat, sans-serif",
};

const primaryButtonStyle: React.CSSProperties = {
  height: 44,
  background: "#2563eb",
  color: "#ffffff",
  border: "none",
  borderRadius: 6,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "Montserrat, sans-serif",
};

const darkButtonStyle: React.CSSProperties = {
  height: 44,
  padding: "0 16px",
  background: "#0f172a",
  color: "#ffffff",
  border: "none",
  borderRadius: 6,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "Montserrat, sans-serif",
};

const greenButtonStyle: React.CSSProperties = {
  height: 44,
  background: "#16a34a",
  color: "#ffffff",
  border: "none",
  borderRadius: 6,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "Montserrat, sans-serif",
};

const deleteButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#dc2626",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "Montserrat, sans-serif",
};

const chartWrapStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: 10,
  alignItems: "end",
  minHeight: 220,
  paddingTop: 12,
};

const chartColumnStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  alignItems: "end",
  justifyItems: "center",
};

const chartValueStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#475569",
  fontWeight: 700,
};

const chartBarStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 42,
  background: "linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)",
  borderRadius: 6,
  minHeight: 14,
};

const chartLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#64748b",
  textAlign: "center",
};



const modernChartWrapStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  padding: 14,
};

const filterButtonStyle: React.CSSProperties = {
  height: 34,
  padding: "0 12px",
  background: "#ffffff",
  color: "#334155",
  border: "1px solid #cbd5e1",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "Montserrat, sans-serif",
};

const filterButtonActiveStyle: React.CSSProperties = {
  height: 34,
  padding: "0 12px",
  background: "#0f172a",
  color: "#ffffff",
  border: "1px solid #0f172a",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "Montserrat, sans-serif",
};


