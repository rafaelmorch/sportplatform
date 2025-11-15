// app/api/strava/callback/route.ts
import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return new Response("Erro na autenticação com Strava.", { status: 400 });
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response(
      "STRAVA_CLIENT_ID ou STRAVA_CLIENT_SECRET não configurados.",
      { status: 500 }
    );
  }

  // Troca o "code" por tokens no Strava
  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    console.error("Erro ao obter token do Strava:", txt);
    return new Response("Falha ao obter token do Strava.", { status: 500 });
  }

  const tokenData = await tokenRes.json();

  const athlete = tokenData.athlete;
  const athleteId = athlete?.id;
  const athleteName = `${athlete?.firstname ?? ""} ${athlete?.lastname ?? ""}`.trim();

  if (!athleteId) {
    return new Response("Não foi possível identificar o atleta do Strava.", {
      status: 500,
    });
  }
  // 👉 Aqui gravamos a conexão no Supabase
  try {
    const { error: dbError } = await supabaseAdmin
      .from("strava_connections")
      .insert({
        athlete_id: athleteId,
        athlete_name: athleteName || null,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        raw_athlete: athlete,
      });

    if (dbError) {
      console.error("Erro ao salvar no Supabase:", dbError);
    }
  } catch (e) {
    console.error("Exceção ao salvar no Supabase:", e);
  }

 

  // (Opcional) Buscar últimas atividades só para exibir um texto simples
  let atividadesTexto = "";
  try {
    const activitiesRes = await fetch(
      "https://www.strava.com/api/v3/athlete/activities?per_page=5",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (activitiesRes.ok) {
      const activities = await activitiesRes.json();
      if (Array.isArray(activities) && activities.length > 0) {
        atividadesTexto =
          "\n\nÚltimas atividades:\n" +
          activities
            .map((a: any) => `- ${a.name} (${a.distance} m)`)
            .join("\n");
      } else {
        atividadesTexto = "\n\nÚltimas atividades:\n(nenhuma atividade encontrada)";
      }
    }
  } catch (e) {
    console.error("Erro ao buscar atividades do Strava:", e);
  }

  const mensagemBase = `Conexão com Strava concluída para ${
    athleteName || "este atleta"
  }.`;

  return new Response(mensagemBase + atividadesTexto, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
