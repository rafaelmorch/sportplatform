// app/api/admin/debug-activities/route.ts
import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  // 1) Pegar a conexão mais recente na tabela strava_connections
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

  if (!accessToken) {
    return new Response(
      "Conexão encontrada, mas sem access_token salvo.",
      { status: 500 }
    );
  }

  // 2) Chamar a API do Strava para listar atividades
  const url =
    "https://www.strava.com/api/v3/athlete/activities?per_page=10&page=1";

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    return new Response(
      "Erro ao buscar atividades do Strava:\n\n" + txt,
      { status: 500 }
    );
  }

  const activities = await res.json();

  // 3) Retornar o JSON bonitinho (apenas debug)
  const body = JSON.stringify(activities, null, 2);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

