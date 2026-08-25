/**
 * PLATFORM SPORTS
 * Arquivo: app/api/health-connect/connection/route.ts
 * Criado em: 2026-08-24 20:08 ET
 *
 * Função:
 * Registrar e remover o Health Connect como fonte ativa
 * da Platform Sports.
 *
 * Regras:
 * - POST marca Health Connect como conectado.
 * - DELETE desconecta Health Connect da Platform Sports.
 * - Não apaga atividades ou métricas históricas.
 * - Não revoga permissões no Android.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getAccessToken(req: Request) {
  const authorization =
    req.headers.get("authorization") ?? "";

  return authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
}

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    process.env.SUPABASE_SERVICE_ROLE?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing Supabase server configuration.",
        },
        { status: 500 }
      );
    }

    const accessToken = getAccessToken(req);

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid or expired session.",
        },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    const { data: currentSource, error: sourceError } =
      await supabase
        .from("user_activity_source")
        .select("provider")
        .eq("user_id", userId)
        .maybeSingle();

    if (sourceError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to verify current activity source.",
        },
        { status: 500 }
      );
    }

    if (
      currentSource?.provider &&
      currentSource.provider !== "health_connect"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Another activity source is already connected.",
          activeProvider: currentSource.provider,
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    const { error: upsertError } =
      await supabase
        .from("user_activity_source")
        .upsert(
          {
            user_id: userId,
            provider: "health_connect",
            connected_at: now,
            updated_at: now,
          },
          {
            onConflict: "user_id",
          }
        );

    if (upsertError) {
      console.error(
        "Health Connect connection upsert error:",
        upsertError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Failed to save Health Connect connection.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      provider: "health_connect",
    });
  } catch (error) {
    console.error(
      "Unexpected Health Connect connection error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected connection error.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing Supabase server configuration.",
        },
        { status: 500 }
      );
    }

    const accessToken = getAccessToken(req);

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid or expired session.",
        },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    const { error: deleteError } =
      await supabase
        .from("user_activity_source")
        .delete()
        .eq("user_id", userId)
        .eq("provider", "health_connect");

    if (deleteError) {
      console.error(
        "Health Connect disconnect error:",
        deleteError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Failed to disconnect Health Connect.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      disconnected: true,
    });
  } catch (error) {
    console.error(
      "Unexpected Health Connect disconnect error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected disconnect error.",
      },
      { status: 500 }
    );
  }
}
