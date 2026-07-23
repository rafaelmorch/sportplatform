import type { SupabaseClient } from "@supabase/supabase-js";

export type PerformanceProfile = {
  id: string;
  user_id: string;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  gender: string | null;
};

export type PerformanceWeightLog = {
  id: string;
  weight_kg: number;
  created_at: string;
};

export type PerformanceBioimpedanceLog = {
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

export type PerformanceBodyData = {
  profile: PerformanceProfile | null;
  weightLogs: PerformanceWeightLog[];
  bioimpedanceLogs: PerformanceBioimpedanceLog[];
};

export async function loadPerformanceBodyData(
  supabase: SupabaseClient,
  userId: string
): Promise<PerformanceBodyData> {
  const [
    profileResult,
    weightResult,
    bioimpedanceResult,
  ] = await Promise.all([
    supabase
      .from("performance_ai_profiles")
      .select(
        "id, user_id, weight_kg, height_cm, age, gender"
      )
      .eq("user_id", userId)
      .maybeSingle(),

    supabase
      .from("performance_ai_weight_logs")
      .select("id, weight_kg, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),

    supabase
      .from("performance_ai_bioimpedance")
      .select(
        "id, assessment_date, weight_kg, body_fat_percent, muscle_mass_kg, visceral_fat, body_water_percent, bmr, notes, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (profileResult.error) {
    throw new Error(
      `Erro ao carregar o perfil: ${profileResult.error.message}`
    );
  }

  if (weightResult.error) {
    throw new Error(
      `Erro ao carregar o histórico de peso: ${weightResult.error.message}`
    );
  }

  if (bioimpedanceResult.error) {
    throw new Error(
      `Erro ao carregar as bioimpedâncias: ${bioimpedanceResult.error.message}`
    );
  }

  return {
    profile:
      (profileResult.data as PerformanceProfile | null) ?? null,
    weightLogs:
      (weightResult.data as PerformanceWeightLog[] | null) ?? [],
    bioimpedanceLogs:
      (bioimpedanceResult.data as
        | PerformanceBioimpedanceLog[]
        | null) ?? [],
  };
}
