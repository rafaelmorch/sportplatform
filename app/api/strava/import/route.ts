import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE são obrigatórios.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

export async function GET(_req: NextRequest) {
  try {
    // 1) Buscar o token do Strava no Supabase (por enquanto pegamos o primeiro registro)
    const { data: tokenRow, error: tokenError } = await supabase
      .from("strava_tokens")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (tokenError) {
      console.error("Erro ao buscar token do Strava no Supabase:", tokenError);
      return new NextResponse(
        "Erro ao buscar token do Strava no banco de dados.",
        { status: 500 }
      );
    }

    if (!tokenRow) {
      return new NextResponse(
        "Nenhum token do Strava encontrado em strava_tokens.",
        { status: 400 }
      );
    }

    const athleteId = tokenRow.athlete_id as number;
    const accessToken = tokenRow.access_token as string;

    if (!athleteId || !accessToken) {
      return new NextResponse(
        "Registro em strava_tokens incompleto (sem athlete_id ou access_token).",
        { status: 500 }
      );
    }

    console.log("Importando atividades para athlete_id:", athleteId);

    // 2) Buscar atividades no Strava com paginação
    const perPage = 50;
    const maxPages = 10; // limite de segurança
    let page = 1;
    let totalImported = 0;

    while (page <= maxPages) {
      const url = new URL("https://www.strava.com/api/v3/athlete/activities");
      url.searchParams.set("per_page", String(perPage));
      url.searchParams.set("page", String(page));

      const activitiesResponse = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!activitiesResponse.ok) {
        const errorText = await activitiesResponse.text();
        console.error(
          `Erro ao buscar atividades do Strava (page=${page}):`,
          errorText
        );
        return new NextResponse(
          `Erro ao buscar atividades do Strava na página ${page}:\n\n${errorText}`,
          { status: 500 }
        );
      }

      const activities = (await activitiesResponse.json()) as any[];

      if (!activities.length) {
        console.log("Nenhuma atividade adicional encontrada. Encerrando importação.");
        break;
      }

      console.log(
        `Página ${page} retornou ${activities.length} atividades do Strava.`
      );

      // 3) Montar os registros para salvar no Supabase
      const rows = activities.map((a) => ({
        athlete_id: athleteId,
        activity_id: a.id,
        name: a.name,
        type: a.type,
        sport_type: a.sport_type,
        start_date: a.start_date ? new Date(a.start_date).toISOString() : null,
        start_date_local: a.start_date_local
          ? new Date(a.start_date_local).toISOString()
          : null,
        timezone: a.timezone,
        distance: a.distance,
        moving_time: a.moving_time,
        elapsed_time: a.elapsed_time,
        total_elevation_gain: a.total_elevation_gain,
        average_speed: a.average_speed,
        max_speed: a.max_speed,
        is_trainer: a.trainer ?? false,
        is_commute: a.commute ?? false,
        is_private: a.private ?? false,
        is_flagged: a.flagged ?? false,
        map_summary_polyline: a.map?.summary_polyline ?? null,
        raw: a,
        updated_at: new Date().toISOString(),
      }));

      // 4) Upsert no Supabase
      const { error: upsertError } = await supabase
        .from("strava_activities")
        .upsert(rows, {
          onConflict: "athlete_id,activity_id",
        });

      if (upsertError) {
        console.error("Erro ao salvar atividades no Supabase:", upsertError);
        return new NextResponse(
          "Falha ao salvar atividades do Strava no banco de dados.",
          { status: 500 }
        );
      }

      totalImported += rows.length;
      page += 1;
    }

    // 5) Resumo final
    return NextResponse.json(
      {
        message: "Importação de atividades do Strava concluída.",
        athlete_id: athleteId,
        total_imported: totalImported,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erro inesperado ao importar atividades do Strava:", err);
    return new NextResponse(
      "Erro inesperado ao importar atividades do Strava.",
      { status: 500 }
    );
  }
}
