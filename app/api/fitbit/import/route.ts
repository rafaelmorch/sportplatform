// app/api/fitbit/import/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}

function yyyyMmDd(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(req: Request) {
  try {
    const supabase = supabaseServer();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) {
      return NextResponse.json({ ok: false, error: userErr.message }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    // pega o token mais recente
    const { data: tokenRow, error: tokenErr } = await supabase
      .from("fitbit_tokens")
      .select("access_token, fitbit_user_id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenErr) {
      return NextResponse.json({ ok: false, error: tokenErr.message }, { status: 500 });
    }
    if (!tokenRow?.access_token) {
      return NextResponse.json({ ok: false, error: "No Fitbit token found for this user" }, { status: 400 });
    }

    // quantos dias importar (default 30)
    const url = new URL(req.url);
    const days = Math.max(1, Math.min(180, Number(url.searchParams.get("days") ?? "30")));
    const beforeDate = yyyyMmDd(new Date());

    // Fitbit activities list
    // docs: /1/user/-/activities/list.json?beforeDate=YYYY-MM-DD&sort=desc&limit=...
    const fbUrl = new URL("https://api.fitbit.com/1/user/-/activities/list.json");
    fbUrl.searchParams.set("beforeDate", beforeDate);
    fbUrl.searchParams.set("sort", "desc");
    fbUrl.searchParams.set("offset", "0");
    fbUrl.searchParams.set("limit", "100");

    const fbRes = await fetch(fbUrl.toString(), {
      headers: {
        Authorization: `Bearer ${tokenRow.access_token}`,
        "Accept-Language": "en_US",
      },
    });

    if (!fbRes.ok) {
      const body = await fbRes.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `Fitbit API error: ${fbRes.status}`, body },
        { status: 500 }
      );
    }

    const fbJson: any = await fbRes.json();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const activities: any[] = Array.isArray(fbJson?.activities) ? fbJson.activities : [];

    // mapeia para fitbit_activities + user_activities
    const fitbitRows = [];
    const userActivityRows = [];

    for (const a of activities) {
      const logId = a?.logId;
      const startTime = a?.startTime; // ISO-ish
      const durationMs = Number(a?.duration ?? 0);
      const distance = Number(a?.distance ?? 0);

      if (!logId || !startTime) continue;

      const startDate = new Date(startTime);
      if (Number.isNaN(startDate.getTime())) continue;
      if (startDate < cutoff) continue;

      const movingTimeSec = Math.round(durationMs / 1000);
      const minutes = durationMs / 60000;

      const name = (a?.activityName ?? a?.name ?? "Activity") as string;
      const type = (a?.activityTypeId != null ? String(a.activityTypeId) : (a?.activityName ?? "Activity")) as string;

      fitbitRows.push({
        user_id: user.id,
        fitbit_user_id: tokenRow.fitbit_user_id ?? null,
        activity_id: logId, // bigint no banco
        name,
        type,
        start_date: startDate.toISOString(),
        distance: Number.isFinite(distance) ? distance : 0,
        moving_time: Number.isFinite(movingTimeSec) ? movingTimeSec : 0,
        raw: a,
      });

      userActivityRows.push({
        user_id: user.id,
        provider: "fitbit",
        external_id: String(logId), // user_activities.external_id é text
        start_date: startDate.toISOString(),
        type: name, // mantém simples pro ranking (o app usa type)
        minutes: Number.isFinite(minutes) ? minutes : 0,
        raw: a,
      });
    }

    // grava fitbit_activities
    if (fitbitRows.length > 0) {
      const { error: fbInsErr } = await supabase.from("fitbit_activities").insert(fitbitRows);
      if (fbInsErr) {
        return NextResponse.json({ ok: false, error: `fitbit_activities insert: ${fbInsErr.message}` }, { status: 500 });
      }
    }

    // grava user_activities (é o que o APP lê)
    if (userActivityRows.length > 0) {
      const { error: uaInsErr } = await supabase.from("user_activities").insert(userActivityRows);
      if (uaInsErr) {
        return NextResponse.json({ ok: false, error: `user_activities insert: ${uaInsErr.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      imported_fitbit_activities: fitbitRows.length,
      imported_user_activities: userActivityRows.length,
      days,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
