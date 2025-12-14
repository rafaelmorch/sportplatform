import { NextRequest, NextResponse } from "next/server";

// Força runtime Node (necessário em OAuth server-side)
export const runtime = "nodejs";

// Variáveis conforme seu .env.local / Vercel
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_REDIRECT_URL = process.env.STRAVA_REDIRECT_URL!;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // state = user_id do Supabase (site) ou token curto (app)
    const state = searchParams.get("state");

    const authUrl = new URL("https://www.strava.com/oauth/authorize");
    authUrl.searchParams.set("client_id", STRAVA_CLIENT_ID);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", STRAVA_REDIRECT_URL);
    authUrl.searchParams.set("approval_prompt", "auto");
    authUrl.searchParams.set("scope", "read,activity:read_all");

    if (state) {
      authUrl.searchParams.set("state", state);
    }

    // Redireciona o usuário (site ou app) para o Strava
    return NextResponse.redirect(authUrl.toString());
  } catch (err) {
    console.error("Erro ao iniciar OAuth do Strava:", err);
    return NextResponse.json(
      { message: "Erro ao iniciar conexão com Strava." },
      { status: 500 }
    );
  }
}
