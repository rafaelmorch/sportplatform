// app/api/fitbit/sync/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ cria o supabase ADMIN apenas dentro do request (evita quebrar build)
// usa SERVICE ROLE (server) e cai para anon (se você quiser rodar sem service role em dev)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !supabaseKey) return null;

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "ENV faltando: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE (ou SUPABASE_SERVICE_ROLE_KEY).",
      },
      { status: 500 }
    );
  }

  // ✅ placeholder: se você já tinha lógica aqui, a gente recoloca depois
  // por enquanto só devolve OK pra não quebrar build/prod
  return NextResponse.json({ ok: true, message: "fitbit sync route online" });
}

export async function POST() {
  return GET();
}
