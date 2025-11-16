import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE são obrigatórios.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");

    if (!userId) {
      return new NextResponse("Parâmetro user_id é obrigatório.", { status: 400 });
    }

    // 1) Descobrir o athlete_id do Strava a partir do user_id
    const { data: tokenRow, error: tokenError } = await supabase
      .from("strava_tokens")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (tokenError) {
      console.error("Erro ao buscar strava_tokens:", tokenError);
      return new NextResponse("Erro ao buscar tokens do Strava.", { status: 500 });
    }

    if (!tokenRow) {
      return NextResponse.json(
        {
          connected: false,
          message: "Nenhum Strava conectado para este usuário.",
        },
        { status: 200 }
      );
    }

    const athleteId = tokenRow.athlete_id as number;

    // 2) Buscar atividades desse athlete_id (limit 1000 para não exagerar)
    const { data: activities, error: activitiesError } = await supabase
      .from("strava_activities")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("start_date", { ascending: false })
      .limit(1000);

    if (activitiesError) {
      console.error("Erro ao buscar atividades:", activitiesError);
      return new NextResponse("Erro ao buscar atividades do Strava.", {
        status: 500,
      });
    }

    if (!activities || activities.length === 0) {
      return NextResponse.json(
        {
          connected: true,
          athlete_id: athleteId,
          has_activities: false,
          message: "Nenhuma atividade encontrada para este atleta.",
        },
        { status: 200 }
      );
    }

    // Helpers para cálculo de períodos
    const now = new Date();
    const daysAgo = (n: number) =>
      new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

    function isInLastDays(dateStr: string | null, days: number): boolean {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= daysAgo(days);
    }

    // 3) Cálculos básicos
    function calcStats(list: any[]) {
      const totalActivities = list.length;
      const totalDistance = list.reduce(
        (sum, a) => sum + (a.distance ?? 0),
        0
      ); // metros
      const totalMovingTime = list.reduce(
        (sum, a) => sum + (a.moving_time ?? 0),
        0
      ); // segundos

      const avgDistance = totalActivities > 0 ? totalDistance / totalActivities : 0;

      // separação por tipo de esporte
      const bySportType: Record<
        string,
        { count: number; distance: number; moving_time: number }
      > = {};

      for (const a of list) {
        const key = a.sport_type || a.type || "Unknown";
        if (!bySportType[key]) {
          bySportType[key] = { count: 0, distance: 0, moving_time: 0 };
        }
        bySportType[key].count += 1;
        bySportType[key].distance += a.distance ?? 0;
        bySportType[key].moving_time += a.moving_time ?? 0;
      }

      return {
        total_activities: totalActivities,
        total_distance_m: totalDistance,
        total_moving_time_s: totalMovingTime,
        avg_distance_m: avgDistance,
        by_sport_type: bySportType,
      };
    }

    const allTimeStats = calcStats(activities);
    const last30d = activities.filter((a) =>
      isInLastDays(a.start_date, 30)
    );
    const last7d = activities.filter((a) =>
      isInLastDays(a.start_date, 7)
    );

    const last30dStats = calcStats(last30d);
    const last7dStats = calcStats(last7d);

    const lastActivity = activities[0];

    return NextResponse.json(
      {
        connected: true,
        athlete_id: athleteId,
        has_activities: true,

        last_activity: lastActivity
          ? {
              name: lastActivity.name,
              start_date: lastActivity.start_date,
              distance_m: lastActivity.distance,
              sport_type: lastActivity.sport_type ?? lastActivity.type,
            }
          : null,

        all_time: allTimeStats,
        last_30d: last30dStats,
        last_7d: last7dStats,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erro inesperado em /api/strava/summary:", err);
    return new NextResponse(
      "Erro inesperado ao calcular resumo das atividades.",
      { status: 500 }
    );
  }
}
