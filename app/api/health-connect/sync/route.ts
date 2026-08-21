/**
 * PLATFORM SPORTS
 * Arquivo: app/api/health-connect/sync/route.ts
 * Criado em: 2026-08-21 15:23 ET
 * Última alteração: 2026-08-21 15:25 ET
 *
 * Função:
 * Receber e sincronizar atividades e métricas do Android Health Connect
 * com o Supabase.
 *
 * Backup anterior:
 * N/A - arquivo criado nesta data.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type WorkoutPayload = {
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

type HealthSamplePayload = {
  dataType?: string;
  value?: number;
  unit?: string;
  startDate?: string;
  endDate?: string;
  sourceName?: string;
  sourceId?: string;
  platformId?: string;
  sleepState?: string;
  stages?: unknown[];
  hasStageData?: boolean;
  measurementMethod?: number;
};

type SyncBody = {
  workouts?: WorkoutPayload[];
  samples?: HealthSamplePayload[];
};

export async function POST(req: Request) {
  try {
    const supabaseUrl =
      process.env.SUPABASE_URL?.trim();

    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase server configuration." },
        { status: 500 }
      );
    }

    const authorization =
      req.headers.get("authorization") ?? "";

    const accessToken =
      authorization.startsWith("Bearer ")
        ? authorization.slice(7).trim()
        : "";

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    const body = (await req.json()) as SyncBody;

    const workouts = Array.isArray(body.workouts)
      ? body.workouts
      : [];

    const samples = Array.isArray(body.samples)
      ? body.samples
      : [];

    let workoutCount = 0;
    let metricCount = 0;

    if (workouts.length > 0) {
      const rows = workouts
        .filter(
          (workout) =>
            workout.platformId &&
            workout.startDate
        )
        .map((workout) => ({
          user_id: userId,
          provider: "health_connect",
          external_id: workout.platformId,
          device_name:
            workout.sourceName ?? null,
          name:
            workout.workoutType
              ? `Health Connect ${workout.workoutType}`
              : "Health Connect workout",
          sport_type:
            workout.workoutType ?? null,
          start_date:
            workout.startDate ?? null,
          moving_time_s:
            workout.duration != null
              ? Math.round(workout.duration)
              : null,
          elapsed_time_s:
            workout.duration != null
              ? Math.round(workout.duration)
              : null,
          distance_m:
            workout.totalDistance ?? null,
          calories:
            workout.totalEnergyBurned ?? null,
          raw_activity: workout,
        }));

      if (rows.length > 0) {
        const { error } = await supabase
          .from("imported_activities")
          .upsert(rows, {
            onConflict: "provider,external_id",
            ignoreDuplicates: true,
          });

        if (error) {
          return NextResponse.json(
            {
              ok: false,
              stage: "workouts",
              error: error.message,
            },
            { status: 500 }
          );
        }

        workoutCount = rows.length;
      }
    }

    if (samples.length > 0) {
      const rows = samples
        .filter(
          (sample) =>
            sample.dataType &&
            sample.startDate
        )
        .map((sample) => ({
          user_id: userId,
          provider: "health_connect",
          metric_type: sample.dataType,
          external_id:
            sample.platformId ?? null,
          source_id:
            sample.sourceId ?? null,
          source_name:
            sample.sourceName ?? null,
          value:
            typeof sample.value === "number"
              ? sample.value
              : null,
          unit:
            sample.unit ?? null,
          start_date:
            sample.startDate,
          end_date:
            sample.endDate ?? null,
          raw_data: sample,
        }));

      if (rows.length > 0) {
        const { error } = await supabase
          .from("health_metrics")
          .upsert(rows, {
            onConflict:
              "user_id,provider,metric_type,external_id",
            ignoreDuplicates: true,
          });

        if (error) {
          return NextResponse.json(
            {
              ok: false,
              stage: "metrics",
              error: error.message,
            },
            { status: 500 }
          );
        }

        metricCount = rows.length;
      }
    }

    return NextResponse.json({
      ok: true,
      workoutsReceived: workouts.length,
      workoutsSaved: workoutCount,
      samplesReceived: samples.length,
      samplesSaved: metricCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

