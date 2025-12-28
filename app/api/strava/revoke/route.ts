import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

type StravaTokenRow = {
  user_id: string;
  athlete_id: number;
  access_token: string;
};

export async function POST(req: NextRequest) {
  try {
    // ✅ precisa do JWT do usuário logado
    const auth = req.headers.get("authorization") ?? "";
    const jwt = auth.toLowerCase().startsWith("bearer ")
      ? auth.slice(7).trim()
      : null;

    if (!jwt) {
      return NextResponse.json(
        { message: "Missing Authorization Bearer token." },
        { status: 401 }
      );
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(
      jwt
    );

    if (userErr || !userData?.user) {
      return NextResponse.json(
        { message: "Invalid session token.", details: userErr?.message },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // 1) Buscar tokens Strava do usuário
    const { data: tokenRow, error: tokenErr } = await supabaseAdmin
      .from("strava_tokens")
      .select("user_id, athlete_id, access_token")
      .eq("user_id", userId)
      .maybeSingle();

    if (tokenErr) {
      return NextResponse.json(
        { message: "Erro ao ler strava_tokens.", details: tokenErr.message },
        { status: 500 }
      );
    }

    if (!tokenRow?.access_token) {
      // Já está desconectado
      return NextResponse.json({ ok: true, alreadyDisconnected: true });
    }

    const row = tokenRow as StravaTokenRow;

    // 2) Revogar no Strava
    const res = await fetch("https://www.strava.com/api/v3/oauth/deauthorize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${row.access_token}`,
      },
    });

    const json = await res.json().catch(() => null);

    // Mesmo se falhar no Strava, a gente garante o "desconectado" no seu app
    if (!res.ok) {
      console.error("Erro Strava deauthorize:", json);
    }

    // 3) Remover tokens do banco (✅ NÃO apaga strava_activities)
    const { error: delErr } = await supabaseAdmin
      .from("strava_tokens")
      .delete()
      .eq("user_id", userId);

    if (delErr) {
      return NextResponse.json(
        { message: "Erro ao remover strava_tokens.", details: delErr.message },
        { status: 500 }
      );
    }

    // opcional: limpar prefer provider
    const { error: prefErr } = await supabaseAdmin
      .from("user_integrations")
      .upsert(
        { user_id: userId, preferred_provider: null, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (prefErr) console.error("Erro ao limpar user_integrations:", prefErr);

    return NextResponse.json({ ok: true, revokedOnStrava: res.ok });
  } catch (e: any) {
    console.error("Erro inesperado no revoke:", e);
    return NextResponse.json(
      { message: "Erro inesperado no revoke.", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
