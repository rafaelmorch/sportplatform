// app/api/strava/revoke/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;

    if (!token) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const userId = body?.userId as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: "missing_userId" }, { status: 400 });
    }

    // 1) Valida o JWT e garante que o userId bate
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);

    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "invalid_auth" }, { status: 401 });
    }

    if (userData.user.id !== userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // 2) Admin client (service role) para ler/apagar tokens
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: tokenRow, error: tokenErr } = await supabaseAdmin
      .from("strava_tokens")
      .select("access_token")
      .eq("user_id", userId)
      .maybeSingle();

    if (tokenErr) {
      console.error("Erro ao buscar strava_tokens:", tokenErr);
      return NextResponse.json({ error: "db_read_failed" }, { status: 500 });
    }

    // 3) Deauthorize no Strava (se existir access_token)
    const accessToken = tokenRow?.access_token as string | null | undefined;

    if (accessToken) {
      const resp = await fetch("https://www.strava.com/oauth/deauthorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ access_token: accessToken }).toString(),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        console.error("Strava deauthorize falhou:", resp.status, txt);
        // Mesmo se falhar no Strava, vamos apagar o token local para destravar a UI.
      }
    }

    // 4) Apaga token local (mantém atividades antigas)
    const { error: delErr } = await supabaseAdmin
      .from("strava_tokens")
      .delete()
      .eq("user_id", userId);

    if (delErr) {
      console.error("Erro ao deletar strava_tokens:", delErr);
      return NextResponse.json({ error: "db_delete_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Erro inesperado no revoke:", e);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
