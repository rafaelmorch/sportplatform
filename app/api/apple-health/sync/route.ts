import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processChallengeCompletions } from "@/lib/membership/processChallengeCompletions";

export const runtime = "nodejs";

type AppleWorkout = {
  workoutType?: string;
  duration?: number;
  totalEnergyBurned?: number;
  totalDistance?: number;
  startDate?: string;
  endDate?: string;
  sourceName?: string;
  sourceId?: string;
  platformId?: string;
  metadata?: Record<string, string>;
};

function normalizeSportType(value: string | null | undefined): string {
  const sport = (value ?? "").trim().toLowerCase();

  if (["run", "running", "virtualrun", "trailrun"].includes(sport)) {
    return "running";
  }

  if (["ride", "cycling", "virtualride", "biking"].includes(sport)) {
    return "cycling";
  }

  if (["walk", "walking"].includes(sport)) {
    return "walking";
  }

  if (["swim", "swimming", "swimmingpool", "swimmingopenwater"].includes(sport)) {
    return "swimming";
  }

  return sport;
}
export async function POST(req: Request) {
  try {
    const url = process.env.SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!url || !key) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase configuration." },
        { status: 500 }
      );
    }

    const authorization = req.headers.get("authorization") ?? "";
    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: authData, error: authError } =
      await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return NextResponse.json(
        { ok: false, error: "Invalid session." },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    const { data: source, error: sourceError } = await supabase
      .from("user_activity_source")
      .select("provider")
      .eq("user_id", userId)
      .maybeSingle();

    if (sourceError) {
      return NextResponse.json(
        { ok: false, error: "Failed to verify activity source." },
        { status: 500 }
      );
    }

    if (source?.provider !== "apple_health") {
      return NextResponse.json(
        { ok: false, error: "Apple Health is not the active activity source." },
        { status: 409 }
      );
    }

    const body = await req.json();
    const workouts: AppleWorkout[] = Array.isArray(body?.workouts)
      ? body.workouts
      : [];

    if (workouts.length > 10000) {
      return NextResponse.json(
        { ok: false, error: "Too many workouts." },
        { status: 400 }
      );
    }

    const unique = new Map<string, AppleWorkout>();

    for (const workout of workouts) {
      if (
        !workout ||
        typeof workout.platformId !== "string" ||
        !workout.platformId.trim() ||
        typeof workout.startDate !== "string" ||
        !Number.isFinite(Date.parse(workout.startDate))
      ) {
        continue;
      }

      unique.set(workout.platformId, workout);
    }

    const existing: Array<{
      provider: string | null;
      sport_type: string | null;
      start_date: string | null;
      distance_m: number | null;
    }> = [];

    const pageSize = 1000;
    let offset = 0;

    while (true) {
      const { data, error } = await supabase
        .from("imported_activities")
        .select("provider,sport_type,start_date,distance_m")
        .eq("user_id", userId)
        .not("start_date", "is", null)
        .not("distance_m", "is", null)
        .order("start_date", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        return NextResponse.json(
          { ok: false, error: "Failed to check existing activities." },
          { status: 500 }
        );
      }

      existing.push(...(data ?? []));

      if (!data || data.length < pageSize) {
        break;
      }

      offset += pageSize;
    }

    const workoutsToImport = Array.from(unique.values()).filter((workout) => {
      if (
        typeof workout.totalDistance !== "number" ||
        !Number.isFinite(workout.totalDistance)
      ) {
        return true;
      }

      const workoutStart = Date.parse(workout.startDate ?? "");
      const workoutSport = normalizeSportType(workout.workoutType);

      return !existing.some((activity) => {
        if (normalizeSportType(activity.sport_type) !== workoutSport) {
          return false;
        }

        if (!activity.start_date || activity.distance_m == null) {
          return false;
        }

        const existingStart = Date.parse(activity.start_date);

        return (
          Number.isFinite(existingStart) &&
          Math.abs(workoutStart - existingStart) <= 120000 &&
          Math.abs(workout.totalDistance! - activity.distance_m) <= 100
        );
      });
    });

    const rows = workoutsToImport.map((workout) => ({
      user_id: userId,
      provider: "apple_health",
      external_id: workout.platformId,
      device_name: workout.sourceName ?? null,
      name: workout.workoutType
        ? `Apple Health ${workout.workoutType}`
        : "Apple Health workout",
      sport_type: workout.workoutType ?? null,
      start_date: workout.startDate,
      moving_time_s:
        typeof workout.duration === "number" &&
        Number.isFinite(workout.duration) &&
        workout.duration >= 0
          ? Math.round(workout.duration)
          : null,
      elapsed_time_s:
        typeof workout.duration === "number" &&
        Number.isFinite(workout.duration) &&
        workout.duration >= 0
          ? Math.round(workout.duration)
          : null,
      distance_m:
        typeof workout.totalDistance === "number" &&
        Number.isFinite(workout.totalDistance) &&
        workout.totalDistance >= 0
          ? workout.totalDistance
          : null,
      calories:
        typeof workout.totalEnergyBurned === "number" &&
        Number.isFinite(workout.totalEnergyBurned) &&
        workout.totalEnergyBurned >= 0
          ? workout.totalEnergyBurned
          : null,
      raw_activity: workout,
    }));

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("imported_activities")
        .upsert(rows, {
          onConflict: "provider,external_id",
          ignoreDuplicates: true,
        });

      if (insertError) {
        return NextResponse.json(
          { ok: false, error: insertError.message },
          { status: 500 }
        );
      }

      await processChallengeCompletions({
        supabase,
        userId,
      });
    }

    return NextResponse.json({
      ok: true,
      workoutsReceived: workouts.length,
      workoutsAccepted: rows.length,
      workoutsSkippedAsPossibleDuplicates: unique.size - rows.length,
    });
  } catch (error) {
    console.error("Apple Health sync error:", error);

    return NextResponse.json(
      { ok: false, error: "Apple Health synchronization failed." },
      { status: 500 }
    );
  }
}
