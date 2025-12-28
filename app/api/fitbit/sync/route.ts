// app/api/fitbit/sync/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID!;
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET!;

function jsonError(status: number, message: string, details?: any) {
  return NextResponse.json({ message, details }, { status });
}

function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function yyyyMmDd(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function refreshFitbitToken(refreshToken: string) {
  const tokenUrl = "https://api.fitbit.com/oauth2/token";

  const basic = Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString("base64");

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refreshToken);

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(`Fitbit refresh failed: ${JSON.stringify(json)}`);
  }

  return json as {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    scope?: string;
    expires_in: number;
    user_id: string;
  };
}

async function fetchFitbitActivities(accessToken: string, afterDate: string) {
  // Fitbit exige exatamente UM: afterDate OU beforeDate (e não pode ser vazio)
  // Vamos usar afterDate sempre.
  const url = new URL("https://api.fitbit.com/1/user/-/activities/list.json");
  url.searchParams.set("afterDate", afterDate);
  url.searchParams.set("sort", "asc");
  url.searchParams.set("limit", "100");
  url.searchParams.set("offset", "0");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(`Fitbit activities failed: ${JSON.stringify(json)}`);
  }

  return json as any;
}

export async function GET(req: Request) {
  try {
    // 1) auth do usuário (JWT do Supabase)
    const jwt = getBearerToken(req);
    if (!jwt) return jsonError(401, "Token ausente.");

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonError(401, "Token inválido ou sessão expirada.", userErr?.message);
    }
    const userId = userData.user.id;

    // 2) supabase admin (pra ler/gravar tokens)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE);

    const { data: tokenRow, error: tokenErr } = await supabaseAdmin
      .from("fitbit_tokens")
      .select("user_id, fitbit_user_id, access_token, refresh_token, token_type, scope, expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (tokenErr) return jsonError(500, "Erro ao ler fitbit_tokens.", tokenErr.message);
    if (!tokenRow?.refresh_token) return jsonError(400, "Fitbit não conectado para este usuário.");

    // 3) refresh se necessário (ou sempre, pra simplificar)
    const refreshed = await refreshFitbitToken(tokenRow.refresh_token);

    const newAccess = refreshed.access_token;
    const newRefresh = refreshed.refresh_token ?? tokenRow.refresh_token; // importante: salvar se veio novo
    const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

    const { error: upErr } = await supabaseAdmin
      .from("fitbit_tokens")
      .update({
        access_token: newAccess,
        refresh_token: newRefresh,
        token_type: refreshed.token_type ?? tokenRow.token_type,
        scope: refreshed.scope ?? tokenRow.scope,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (upErr) {
      return jsonError(500, "Erro ao atualizar fitbit_tokens após refresh.", upErr.message);
    }

    // 4) definir afterDate (nunca vazio)
    // padrão: últimos 30 dias
    const after = yyyyMmDd(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    // 5) buscar atividades
    const payload = await fetchFitbitActivities(newAccess, after);

    // 6) (opcional) tentar salvar no banco, mas NÃO falhar o endpoint se der problema
    // Ajuste aqui depois conforme seu schema real de fitbit_activities.
    let saved = 0;
    try {
      const activities: any[] = Array.isArray(payload?.activities) ? payload.activities : [];
      if (activities.length > 0) {
        // Exemplo de mapeamento mínimo
        const rows = activities.map((a: any) => ({
          user_id: userId,
          fitbit_user_id: refreshed.user_id ?? tokenRow.fitbit_user_id ?? null,
          activity_log_id: a.logId ?? null,
          activity_name: a.activityName ?? a.name ?? null,
          start_time: a.startTime ?? null,
          duration_ms: a.duration ?? null,
          calories: a.calories ?? null,
          raw: a,
          updated_at: new Date().toISOString(),
        }));

        // Se não existir constraint única, isso pode duplicar.
        // Depois a gente cria a UNIQUE certinha e troca pra upsert.
        const { error: insErr, count } = await supabaseAdmin
          .from("fitbit_activities")
          .insert(rows, { count: "exact" });

        if (!insErr) saved = count ?? rows.length;
      }
    } catch {
      // ignora por enquanto
    }

    return NextResponse.json({
      ok: true,
      user_id: userId,
      afterDate: after,
      fetched: Array.isArray(payload?.activities) ? payload.activities.length : 0,
      saved,
      note: "afterDate_required_fix",
    });
  } catch (e: any) {
    return jsonError(500, "Erro inesperado no fitbit sync.", e?.message ?? String(e));
  }
}
