// app/api/strava/callback/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return new Response("Faltou o parâmetro ?code na URL.", { status: 400 });
  }

  const client_id = process.env.STRAVA_CLIENT_ID;
  const client_secret = process.env.STRAVA_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    return new Response(
      "Variáveis STRAVA_CLIENT_ID/STRAVA_CLIENT_SECRET ausentes.",
      { status: 500 }
    );
  }

  // 1) Trocar o "code" por access_token / refresh_token
  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id,
      client_secret,
      code,
      grant_type: "authorization_code",
    }),
  });

  const tokenJson = await tokenRes.json();

  if (!tokenRes.ok) {
    return new Response(
      `Erro ao obter token do Strava: ${JSON.stringify(tokenJson)}`,
      { status: 500 }
    );
  }

  const accessToken = tokenJson.access_token as string | undefined;
  const athleteName =
    tokenJson?.athlete?.firstname ||
    tokenJson?.athlete?.username ||
    "atleta";

  if (!accessToken) {
    return new Response(
      `Não veio access_token na resposta: ${JSON.stringify(tokenJson)}`,
      { status: 500 }
    );
  }

  // 2) Buscar últimas atividades do atleta
  const activitiesRes = await fetch(
    "https://www.strava.com/api/v3/athlete/activities?per_page=5&page=1",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const activitiesJson = await activitiesRes.json();

  if (!activitiesRes.ok) {
    return new Response(
      `Erro ao buscar atividades: ${JSON.stringify(activitiesJson)}`,
      { status: 500 }
    );
  }

  // 3) Montar uma resposta simples em texto
  const linhas: string[] = [];
  linhas.push(`Conexão com Strava concluída para ${athleteName}.`);
  linhas.push("");
  linhas.push("Últimas atividades:");

  for (const act of activitiesJson) {
    const nome = act.name;
    const tipo = act.sport_type || act.type;
    const distanciaKm = (act.distance ?? 0) / 1000;
    const duracaoSeg = act.moving_time ?? 0;
    const duracaoMin = Math.round(duracaoSeg / 60);

    linhas.push(
      `- ${nome} (${tipo}) — ${distanciaKm.toFixed(
        2
      )} km em ~${duracaoMin} min`
    );
  }

  const body = linhas.join("\n");

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
