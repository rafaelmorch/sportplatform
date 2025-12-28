// app/api/strava/revoke/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    const jwt = match?.[1];

    if (!jwt) {
      return NextResponse.json(
        { ok: false, error: "missing_bearer_token" },
        { status: 401 }
      );
    }

    // 1) usuário autenticado
    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { ok: false, error: "invalid_user" },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // 2) token atual do Strava
    const { data: tokenRow } = await supabase
      .from("strava_tokens")
      .select("access_token, athlete_id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!tokenRow?.access_token) {
      return NextResponse.json({
        ok: true,
        alreadyDisconnected: true,
        user_id: userId,
      });
    }

    // 3) revoke no Strava
    const form = new URLSearchParams();
    form.set("access_token", tokenRow.access_token);

    await fetch("https://www.strava.com/oauth/deauthorize", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    // 4) remove apenas tokens (mantém atividades)
    await supabase.from("strava_tokens").delete().eq("user_id", userId);

    return NextResponse.json({
      ok: true,
      revoked: true,
      user_id: userId,
      athlete_id: tokenRow.athlete_id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "unexpected", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
