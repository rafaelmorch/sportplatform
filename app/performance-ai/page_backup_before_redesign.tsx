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

  let proteinHigh = 0;
  let qualityLow = 0;
  let qualityGood = 0;

  for (const meal of meals) {
    if (meal.protein_level === "alta") proteinHigh += 1;
    if (meal.quality_level === "baixa") qualityLow += 1;
    if (meal.quality_level === "boa") qualityGood += 1;
  }

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

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return "0h 0min";
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}min`;
}

export default function PerformanceAIPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingMeal, setAddingMeal] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);

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

      if (!error && data?.id) {
        setProfileId(data.id);
      }

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

  const weeklyActivitiesCount = stravaActivities.length;
  const weeklyDistanceKm = stravaActivities.reduce((sum, item) => sum + ((item.distance ?? 0) / 1000), 0);
  const weeklyMovingTime = stravaActivities.reduce((sum, item) => sum + (item.moving_time ?? 0), 0);

  const activitiesWithHr = stravaActivities.filter(
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

  const lastActivity = stravaActivities.length > 0 ? stravaActivities[0] : null;

  const coachInsight = getCoachInsight({
    meals,
    weeklyActivitiesCount,
    weeklyDistanceKm,
    weeklyMovingTime,
    avgHeartRate,
    weightLogs,
  });

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          color: "#0f172a",
          padding: 16,
          fontFamily: "Montserrat, Arial, sans-serif",
        }}
      >
        Carregando...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        padding: 16,
        paddingBottom: 100,
        fontFamily: "Montserrat, Arial, sans-serif",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <BackButton />
      </div>

      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Performance AI
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            margin: "6px 0 0 0",
          }}
        >
          Perfil do atleta
        </h1>
      </div>

      <section
        style={{
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          padding: 16,
          background: "#ffffff",
          display: "grid",
          gap: 12,
        }}
      >
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
          placeholder="Observações importantes de saúde (ex.: dor no joelho, pressão alta, lesão anterior, orientação médica, uso de medicação)"
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
        />

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            height: 44,
            borderRadius: 6,
            border: "none",
            background: "#2563eb",
            color: "#ffffff",
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "Montserrat, Arial, sans-serif",
          }}
        >
          {saving ? "Salvando..." : "Salvar perfil"}
        </button>

        {message ? <div style={{ fontSize: 13, color: "#475569" }}>{message}</div> : null}
      </section>

      <section
        style={{
          marginTop: 20,
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          padding: 16,
          background: "#ffffff",
          display: "grid",
          gap: 12,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Peso</h2>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
  <input
    value={weightKg}
    onChange={(e) => setWeightKg(e.target.value)}
    placeholder="Peso (kg)"
    style={{ ...inputStyle, maxWidth: 140 }}
  />

  <button
    onClick={handleAddWeight}
    disabled={savingWeight}
    style={{
      height: 44,
      padding: "0 16px",
      borderRadius: 6,
      border: "none",
      background: "#0f172a",
      color: "#ffffff",
      fontWeight: 700,
      cursor: savingWeight ? "not-allowed" : "pointer",
    }}
  >
    {savingWeight ? "Salvando..." : "Atualizar Peso"}
  </button>
</div>

        {weightLogs.length === 0 ? (
          <div style={{ fontSize: 14, color: "#64748b" }}>
            Nenhum peso registrado ainda.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {weightLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: 12,
                  background: "#f8fafc",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                  {Number(log.weight_kg).toFixed(1)} kg
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
  <div style={{ fontSize: 12, color: "#64748b" }}>
    {new Date(log.created_at).toLocaleString()}
  </div>

  <button
    onClick={() => handleDeleteWeight(log.id)}
    style={{
      border: "none",
      background: "transparent",
      color: "#dc2626",
      fontSize: 12,
      cursor: "pointer",
    }}
  >
    Excluir
  </button>
</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          marginTop: 20,
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          padding: 16,
          background: "#ffffff",
          display: "grid",
          gap: 12,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Resumo do treino (Strava)</h2>

        {!stravaConnected ? (
          <div style={{ fontSize: 14, color: "#64748b" }}>
            Strava não conectado para este usuário.
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10 }}>
              <div style={summaryCardStyle}>
                <div style={summaryLabelStyle}>Atividades</div>
                <div style={summaryValueStyle}>{weeklyActivitiesCount}</div>
              </div>

              <div style={summaryCardStyle}>
                <div style={summaryLabelStyle}>Distância</div>
                <div style={summaryValueStyle}>{weeklyDistanceKm.toFixed(1)} km</div>
              </div>

              <div style={summaryCardStyle}>
                <div style={summaryLabelStyle}>Tempo total</div>
                <div style={summaryValueStyle}>{formatDuration(weeklyMovingTime)}</div>
              </div>

              <div style={summaryCardStyle}>
                <div style={summaryLabelStyle}>FC média</div>
                <div style={summaryValueStyle}>{avgHeartRate ? `${avgHeartRate} bpm` : "-"}</div>
              </div>

              <div style={summaryCardStyle}>
                <div style={summaryLabelStyle}>FC máx</div>
                <div style={summaryValueStyle}>{maxHeartRate ? `${maxHeartRate} bpm` : "-"}</div>
              </div>
            </div>

            <div style={{ fontSize: 14, color: "#334155" }}>
              {lastActivity
                ? `Última atividade: ${lastActivity.name ?? lastActivity.type ?? lastActivity.sport_type ?? "Atividade"}`
                : "Nenhuma atividade encontrada."}
            </div>
          </>
        )}
      </section>

      <section
        style={{
          marginTop: 20,
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          padding: 16,
          background: "#ffffff",
          display: "grid",
          gap: 12,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Coach IA</h2>

        <div
          style={{
            fontSize: 14,
            color: "#334155",
            lineHeight: 1.6,
          }}
        >
          {coachInsight}
        </div>
      </section>

      <section
        style={{
          marginTop: 20,
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          padding: 16,
          background: "#ffffff",
          display: "grid",
          gap: 12,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Resumo do dia</h2>
        <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.5 }}>
          {getDailyInsight(meals)}
        </div>
      </section>

      <section
        style={{
          marginTop: 20,
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          padding: 16,
          background: "#ffffff",
          display: "grid",
          gap: 12,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Adicionar refeição</h2>

        <input
          value={mealText}
          onChange={(e) => setMealText(e.target.value)}
          placeholder="O que você comeu? (ex.: frango com arroz e salada)"
          style={inputStyle}
        />

        <button
          onClick={handleAddMeal}
          disabled={addingMeal}
          style={{
            height: 44,
            borderRadius: 6,
            border: "none",
            background: "#16a34a",
            color: "#ffffff",
            fontWeight: 700,
            cursor: addingMeal ? "not-allowed" : "pointer",
            fontFamily: "Montserrat, Arial, sans-serif",
          }}
        >
          {addingMeal ? "Adicionando..." : "+ Adicionar refeição"}
        </button>
      </section>

      <section
        style={{
          marginTop: 20,
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          padding: 16,
          background: "#ffffff",
          display: "grid",
          gap: 12,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Últimas refeições</h2>

        {meals.length === 0 ? (
          <div style={{ fontSize: 14, color: "#64748b" }}>
            Nenhuma refeição adicionada ainda.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {meals.map((meal) => (
              <div
                key={meal.id}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: 12,
                  background: "#f1f5f9",
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                  {meal.meal_text}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span style={tagStyle}>{meal.meal_type ?? "refeição"}</span>
                  <span style={tagStyle}>proteína: {meal.protein_level ?? "-"}</span>
                  <span style={tagStyle}>qualidade: {meal.quality_level ?? "-"}</span>
                </div>

                <div style={{ fontSize: 13, color: "#1d4ed8" }}>
                  {meal.ai_notes ?? ""}
                </div>

                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {new Date(meal.eaten_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  background: "#f1f5f9",
  color: "#0f172a",
  padding: "10px 12px",
  boxSizing: "border-box",
  fontFamily: "Montserrat, Arial, sans-serif",
};

const tagStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#475569",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  padding: "4px 8px",
  background: "#f8fafc",
  fontFamily: "Montserrat, Arial, sans-serif",
};

const summaryCardStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  padding: 12,
  background: "#f8fafc",
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  marginBottom: 6,
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: "#0f172a",
};









