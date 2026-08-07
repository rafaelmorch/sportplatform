// lib/performance-ai/loadMealsForDate.ts

import { supabaseBrowser } from "@/lib/supabase-browser";

export type CoachMealRow = {
  id: string;
  meal_text: string;
  eaten_at: string;
  meal_type: string | null;
  protein_level: string | null;
  quality_level: string | null;
  ai_notes: string | null;
};

function createDateRange(date: Date): {
  startIso: string;
  endIso: string;
} {
  const start = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );

  const end = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
    0,
    0,
    0,
    0
  );

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export async function loadMealsForDate(
  userId: string,
  selectedDate: Date
): Promise<CoachMealRow[]> {
  const { startIso, endIso } = createDateRange(selectedDate);

  const { data, error } = await supabaseBrowser
    .from("performance_ai_meals")
    .select(
      "id, meal_text, eaten_at, meal_type, protein_level, quality_level, ai_notes"
    )
    .eq("user_id", userId)
    .gte("eaten_at", startIso)
    .lt("eaten_at", endIso)
    .order("eaten_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `Não foi possível carregar as refeições do dia: ${error.message}`
    );
  }

  return (data ?? []) as CoachMealRow[];
}

export function formatMealsForCoach(
  meals: CoachMealRow[]
): string | null {
  if (meals.length === 0) {
    return null;
  }

  return meals
    .map((meal) => {
      const time = new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(meal.eaten_at));

      return `${time} — ${meal.meal_text}`;
    })
    .join("\n");
}