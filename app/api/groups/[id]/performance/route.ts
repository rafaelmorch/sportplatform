/**
 * PLATFORM SPORTS
 * Arquivo: app/api/groups/[id]/performance/route.ts
 * Criado em: 2026-08-21 20:17 ET
 * Última alteração: 2026-08-21 20:17 ET
 *
 * Função:
 * Retornar atividades consolidadas dos membros de um grupo.
 *
 * Regras:
 * - Aceita membros com status approved ou active.
 * - Usa approved_at como data de entrada quando existir.
 * - Usa created_at como fallback.
 * - Só retorna atividades posteriores à entrada no grupo.
 * - Lê imported_activities, independentemente do provider.
 *
 * Backup anterior:
 * N/A - arquivo criado nesta data.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await context.params;

    const supabaseUrl =
      process.env.SUPABASE_URL?.trim();

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing Supabase server configuration.",
        },
        { status: 500 }
      );
    }

    const authorization =
      req.headers.get("authorization") ?? "";

    const accessToken =
      authorization.startsWith("Bearer ")
        ? authorization.slice(7).trim()
        : "";

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

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

    const currentUserId = authData.user.id;

    const { data: community, error: communityError } =
      await supabase
        .from("app_membership_communities")
        .select("id,created_by")
        .eq("id", communityId)
        .maybeSingle();

    if (communityError || !community) {
      return NextResponse.json(
        {
          ok: false,
          error: "Community not found.",
        },
        { status: 404 }
      );
    }

    const { data: currentMembership } =
      await supabase
        .from("app_membership_requests")
        .select("status")
        .eq("community_id", communityId)
        .eq("user_id", currentUserId)
        .in("status", ["approved", "active"])
        .maybeSingle();

    const canAccess =
      community.created_by === currentUserId ||
      !!currentMembership;

    if (!canAccess) {
      return NextResponse.json(
        {
          ok: false,
          error: "Access denied.",
        },
        { status: 403 }
      );
    }

    const { data: memberRows, error: memberError } =
      await supabase
        .from("app_membership_requests")
        .select(
          "user_id,status,created_at,approved_at"
        )
        .eq("community_id", communityId)
        .in("status", ["approved", "active"]);

    if (memberError) {
      throw memberError;
    }

    const members = memberRows ?? [];

    const memberIds = Array.from(
      new Set(
        members
          .map((row) => row.user_id)
          .filter(
            (id): id is string =>
              typeof id === "string"
          )
      )
    );

    const joinedAtByUser = new Map<string, string>();

    for (const member of members) {
      if (!member.user_id) continue;

      const joinedAt =
        member.approved_at ??
        member.created_at ??
        null;

      if (joinedAt) {
        joinedAtByUser.set(
          member.user_id,
          joinedAt
        );
      }
    }

    if (memberIds.length === 0) {
      return NextResponse.json({
        ok: true,
        communityId,
        members: 0,
        activities: [],
      });
    }

    const { data: profileRows } =
      await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", memberIds);

    const userNameMap = new Map<string, string>();

    for (const profile of profileRows ?? []) {
      if (profile.id && profile.full_name) {
        userNameMap.set(
          profile.id,
          profile.full_name
        );
      }
    }

    const { data: activityRows, error: activityError } =
      await supabase
        .from("imported_activities")
        .select(
          "id,user_id,name,sport_type,start_date,distance_m,moving_time_s,elev_gain_m,provider"
        )
        .in("user_id", memberIds)
        .order("start_date", {
          ascending: false,
        })
        .limit(5000);

    if (activityError) {
      throw activityError;
    }

    const activities = (activityRows ?? [])
      .filter((activity) => {
        if (
          !activity.user_id ||
          !activity.start_date
        ) {
          return false;
        }

        const joinedAt =
          joinedAtByUser.get(activity.user_id);

        if (!joinedAt) {
          return false;
        }

        return (
          new Date(activity.start_date).getTime() >=
          new Date(joinedAt).getTime()
        );
      })
      .map((activity) => ({
        id: activity.id,
        user_id: activity.user_id,
        user_name:
          userNameMap.get(activity.user_id) ??
          "Atleta",
        name: activity.name ?? null,
        type: activity.sport_type ?? null,
        sport_type:
          activity.sport_type ?? null,
        start_date:
          activity.start_date ?? null,
        distance:
          activity.distance_m != null
            ? Number(activity.distance_m)
            : null,
        moving_time:
          activity.moving_time_s != null
            ? Number(activity.moving_time_s)
            : null,
        total_elevation_gain:
          activity.elev_gain_m != null
            ? Number(activity.elev_gain_m)
            : null,
        provider:
          activity.provider ?? null,
      }));

    return NextResponse.json({
      ok: true,
      communityId,
      members: memberIds.length,
      activities,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
