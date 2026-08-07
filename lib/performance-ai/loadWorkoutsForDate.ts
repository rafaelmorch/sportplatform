// lib/performance-ai/loadWorkoutsForDate.ts

import { supabaseBrowser } from "@/lib/supabase-browser";

export type CoachWorkoutRow = {
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

export type CoachWorkoutSummary = {
  title: string | null;
  summary: string | null;
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

function formatDistance(distanceMeters: number | null): string | null {
  if (!distanceMeters || distanceMeters <= 0) {
    return null;
  }

  const kilometers = distanceMeters / 1000;

  return `${kilometers.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} km`;
}

function formatDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) {
    return null;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}min`;
  }

  return `${minutes} min`;
}

function formatHeartRate(
  value: number | null,
  label: string
): string | null {
  if (!value || value <= 0) {
    return null;
  }

  return `${label} ${Math.round(value)} bpm`;
}

export async function loadWorkoutsForDate(
  userId: string,
  selectedDate: Date
): Promise<CoachWorkoutRow[]> {
  const { data: tokenRow, error: tokenError } =
    await supabaseBrowser
      .from("strava_tokens")
      .select("athlete_id")
      .eq("user_id", userId)
      .order("updated_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  if (tokenError) {
    throw new Error(
      `Não foi possível identificar sua conexão com o Strava: ${tokenError.message}`
    );
  }

  let athleteId =
    tokenRow?.athlete_id ?? null;

  if (!athleteId) {
    const {
      data: membershipAthlete,
      error: membershipError,
    } = await supabaseBrowser
      .from("membership_strava_athletes")
      .select("athlete_id")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      throw new Error(
        `Não foi possível identificar seu atleta do Strava: ${membershipError.message}`
      );
    }

    athleteId =
      membershipAthlete?.athlete_id ?? null;
  }

  if (!athleteId) {
    return [];
  }

  const { startIso, endIso } =
    createDateRange(selectedDate);

  const { data, error } = await supabaseBrowser
    .from("strava_activities")
    .select(
      "id, athlete_id, name, type, sport_type, start_date, distance, moving_time, average_heartrate, max_heartrate"
    )
    .eq("athlete_id", athleteId)
    .gte("start_date", startIso)
    .lt("start_date", endIso)
    .order("start_date", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `Não foi possível carregar os treinos do dia: ${error.message}`
    );
  }

  return (data ?? []) as CoachWorkoutRow[];
}

export function formatWorkoutsForCoach(
  workouts: CoachWorkoutRow[]
): CoachWorkoutSummary {
  if (workouts.length === 0) {
    return {
      title: null,
      summary: null,
    };
  }

  if (workouts.length === 1) {
    const workout = workouts[0];

    const details = [
      formatDistance(workout.distance),
      formatDuration(workout.moving_time),
      formatHeartRate(
        workout.average_heartrate,
        "FC média"
      ),
      formatHeartRate(
        workout.max_heartrate,
        "FC máxima"
      ),
    ].filter((value): value is string => Boolean(value));

    return {
      title:
        workout.name ??
        workout.sport_type ??
        workout.type ??
        "Treino realizado",
      summary:
        details.length > 0
          ? details.join(" · ")
          : null,
    };
  }

  const totalDistance = workouts.reduce(
    (total, workout) =>
      total + (workout.distance ?? 0),
    0
  );

  const totalDuration = workouts.reduce(
    (total, workout) =>
      total + (workout.moving_time ?? 0),
    0
  );

  const heartRates = workouts
    .map((workout) => workout.average_heartrate)
    .filter(
      (value): value is number =>
        typeof value === "number" && value > 0
    );

  const maximumHeartRates = workouts
    .map((workout) => workout.max_heartrate)
    .filter(
      (value): value is number =>
        typeof value === "number" && value > 0
    );

  const averageHeartRate =
    heartRates.length > 0
      ? heartRates.reduce(
          (total, value) => total + value,
          0
        ) / heartRates.length
      : null;

  const maximumHeartRate =
    maximumHeartRates.length > 0
      ? Math.max(...maximumHeartRates)
      : null;

  const details = [
    formatDistance(totalDistance),
    formatDuration(totalDuration),
    formatHeartRate(
      averageHeartRate,
      "FC média"
    ),
    formatHeartRate(
      maximumHeartRate,
      "FC máxima"
    ),
  ].filter((value): value is string => Boolean(value));

  return {
    title: `${workouts.length} atividades realizadas`,
    summary:
      details.length > 0
        ? details.join(" · ")
        : null,
  };
}

