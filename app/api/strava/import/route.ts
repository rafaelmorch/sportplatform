// app/api/strava/import/route.ts
import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic"; // garante que não fica cacheado

export async function GET(_req: NextRequest) {
  // 1) Buscar a conexão Strava mais recente (por enquanto)
  const { data: conn, error } = await supabaseAdmin
    .from("strava_connections")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !conn) {
    return new Response(
      "Nenhuma conexão Strava encontrada em strava_connections.",
      { status: 404 }
    );
  }

  const accessToken = conn.access_token as string | undefined;
  const athleteId = conn.athlete_id as number | undefined;

  if (!accessToken || !athleteId) {
    return new Response(
      "Conexão encontrada, mas sem access_token ou athlete_id.",
      { status: 500 }
    );
  }

  const perPage = 100; // até 200 é permitido, 100 é um bom tamanho
  let page = 1;
  let totalProcessadas = 0;

  while (true) {
    const url = `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const txt = await res.text();
      return new Response(
        `Erro ao buscar atividades do Strava na página ${page}:\n\n${txt}`,
        { status: 500 }
      );
    }

    const activities: any[] = await res.json();

    // Se não vier nada, acabou o histórico
    if (!Array.isArray(activities) || activities.length === 0) {
      break;
    }

    // 2) Transformar as atividades no formato da tabela "activities"
    const rows = activities.map((act) => ({
      athlete_id: athleteId,
      strava_activity_id: act.id,
      name: act.name ?? null,
      sport_type: act.sport_type ?? act.type ?? null,
      start_date: act.start_date ?? null,
      distance_m: act.distance ?? null,
      moving_time_s: act.moving_time ?? null,
      elapsed_time_s: act.elapsed_time ?? null,
      elev_gain_m: act.total_elevation_gain ?? null,
      avg_speed_ms: act.average_speed ?? null,
      max_speed_ms: act.max_speed ?? null,
      avg_heartrate: act.average_heartrate ?? null,
      max_heartrate: act.max_heartrate ?? null,
      calories: act.calories ?? null,
      has_heartrate: act.has_heartrate ?? null,
      commute: act.commute ?? null,
      trainer: act.trainer ?? null,
      map_polyline: act.map?.summary_polyline ?? null,
      raw_activity: act, // objeto completo como backup
    }));

    // 3) Salvar / atualizar no Supabase (evitando duplicados)
    const { error: upsertError } = await supabaseAdmin
      .from("activities")
      .upsert(rows, { onConflict: "strava_activity_id" });

    if (upsertError) {
      return new Response(
        "Erro ao salvar atividades no Supabase: " + upsertError.message,
        { status: 500 }
      );
    }

    totalProcessadas += rows.length;

    // Se veio menos que perPage, essa já era a última página
    if (activities.length < perPage) {
      break;
    }

    page += 1;

    // Segurança: não passar de 20 páginas (~2.000 atividades) num único GET
    if (page > 20) {
      break;
    }
  }

  return new Response(
    `Importação concluída para atleta ${athleteId}. Atividades processadas (incluindo já existentes): ${totalProcessadas}.`,
    { status: 200 }
  );
}

