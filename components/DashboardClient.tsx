"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DashboardCharts from "@/components/DashboardCharts";
import { supabaseBrowser } from "@/lib/supabase-browser";

const supabase = supabaseBrowser;

type StravaActivity = {
  id: string;
  athlete_id: number;
  name: string | null;
  type: string | null;
  sport_type: string | null;
  start_date: string | null;
  distance: number | null;
  moving_time: number | null;
  total_elevation_gain: number | null;
};

type EventsSummary = {
  availableEvents: number;
  userEvents: number;
};

type RangeKey = "all" | "today" | "7d" | "30d" | "6m";

type DashboardClientProps = {
  activities: StravaActivity[];
  eventsSummary: EventsSummary; // mantido por compatibilidade
};

type RankingEntry = {
  athleteId: number;
  label: string;
  totalPoints: number;
  totalHours: number;
  isCurrent: boolean;
};

type GroupOption = {
  id: string;
  name: string;
};

export type EvolutionPoint = {
  date: string;
  label: string;
  userMinutes: number;
  groupAvgMinutes: number;
  leaderMinutes: number;
};

// ✅ Anti-loop do auto-sync
const AUTO_SYNC_KEY = "sp_autosync_ran_at";
const AUTO_SYNC_COOLDOWN_MS = 10 * 60 * 1000; // 10 min

function metersToKm(distance: number | null | undefined): number {
  if (!distance || distance <= 0) return 0;
  return distance / 1000;
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "0:00:00";

  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const hh = h.toString();
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");

  return `${hh}:${mm}:${ss}`;
}

function isInRange(dateStr: string | null, range: RangeKey, now: Date): boolean {
  if (range === "all") return true;
  if (!dateStr) return false;

  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;

  // trabalha por "dia" em UTC pra bater com o Supabase (date_trunc day)
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const diffDays = (today.getTime() - day.getTime()) / 86400000;

  if (range === "today") return diffDays === 0;
  if (range === "7d") return diffDays <= 6;
  if (range === "30d") return diffDays <= 29;
  if (range === "6m") return diffDays <= 179;

  return true;
}

// ---------------------
// PONTUAÇÃO DO RANKING (Strava activities)
// ---------------------

function isWalkingType(type: string | null | undefined): boolean {
  const t = (type ?? "").toLowerCase();
  return t.includes("walk") || t.includes("hike") || t.includes("caminhada");
}

/**
 * Regra:
 * - Atividades que NÃO são caminhada: 1h = 100 pontos
 * - Caminhada: 1h = 15 pontos
 * Usa moving_time (segundos).
 */
function getStravaActivityPoints(type: string | null, movingSeconds: number): number {
  if (!movingSeconds || movingSeconds <= 0) return 0;
  const hours = movingSeconds / 3600;
  const rate = isWalkingType(type) ? 15 : 100;
  return hours * rate;
}

export default function DashboardClient({ activities, eventsSummary }: DashboardClientProps) {
  const now = new Date();

  const [range, setRange] = useState<RangeKey>("7d");

  const [currentAthleteId, setCurrentAthleteId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState<string | null>(null);

  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupAthleteIds, setGroupAthleteIds] = useState<number[] | null>(null);

  // nomes via RPC (athlete_id -> full_name)
  const [athleteNames, setAthleteNames] = useState<Record<number, string>>({});

  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingGroupAthletes, setLoadingGroupAthletes] = useState(false);

  // ✅ Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const autoSyncRanRef = useRef(false);

  // ✅ BLINDAGEM
  const safeActivities = Array.isArray(activities) ? activities : [];

  const handleSync = async () => {
    try {
      setSyncMsg(null);
      setSyncing(true);

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        console.error("Erro ao pegar sessão (sync):", sessionErr);
        setSyncMsg("Erro ao autenticar para sincronizar. Faça login novamente.");
        setSyncing(false);
        return;
      }

      const accessToken = sessionData.session?.access_token ?? null;
      if (!accessToken) {
        setSyncMsg("Você precisa estar logado para sincronizar.");
        setSyncing(false);
        return;
      }

      const res = await fetch("/api/strava/sync", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Sync falhou:", json);
        setSyncMsg(
          (json?.message as string) ?? "Falha ao sincronizar com o Strava. Tente novamente."
        );
        setSyncing(false);
        return;
      }

      setSyncMsg(
        typeof json?.fetched === "number"
          ? `Sincronizado: ${json.fetched} atividades verificadas. Recarregando...`
          : "Sincronizado. Recarregando..."
      );

      window.location.reload();
    } catch (e) {
      console.error("Erro inesperado no sync:", e);
      setSyncMsg("Erro inesperado ao sincronizar. Tente novamente.");
      setSyncing(false);
    }
  };

  // Carrega user, athlete_id e grupos
  useEffect(() => {
    const loadAthleteAndGroups = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user ?? null;

        if (!user) {
          // fallback
          const firstAthlete = safeActivities?.[0]?.athlete_id ?? null;
          setCurrentAthleteId(firstAthlete);
          return;
        }

        setCurrentUserId(user.id);

        // Perfil (nome)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) console.error("Erro ao carregar profile:", profileError);
        if (profile?.full_name) setAthleteName(profile.full_name);

        // Athlete id (Strava)
        const { data: tokenRow, error: tokenError } = await supabase
          .from("strava_tokens")
          .select("athlete_id")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (tokenError) console.error("Erro ao carregar strava_tokens:", tokenError);

        if (tokenRow?.athlete_id) {
          setCurrentAthleteId(tokenRow.athlete_id);
        } else {
          const firstAthlete = safeActivities?.[0]?.athlete_id ?? null;
          setCurrentAthleteId(firstAthlete);
        }

        // Grupos do usuário
        setLoadingGroups(true);

        const { data: memberRows, error: memberError } = await supabase
          .from("training_group_members")
          .select("group_id")
          .eq("user_id", user.id);

        if (memberError) {
          console.error("Erro ao carregar grupos do usuário:", memberError);
          return;
        }

        const groupIds = Array.from(new Set((memberRows ?? []).map((m: any) => m.group_id)));
        if (groupIds.length === 0) return;

        const { data: groupRows, error: groupError } = await supabase
          .from("training_groups")
          .select("id, title")
          .in("id", groupIds);

        if (groupError) {
          console.error("Erro ao carregar dados dos grupos:", groupError);
          return;
        }

        const opts: GroupOption[] = (groupRows ?? []).map((g: any) => ({
          id: g.id as string,
          name: g.title as string,
        }));

        setGroups(opts);
        if (opts.length > 0) setSelectedGroupId(opts[0].id);
      } catch (err) {
        console.error("Erro inesperado ao definir atleta/grupos:", err);
        const firstAthlete = safeActivities?.[0]?.athlete_id ?? null;
        setCurrentAthleteId(firstAthlete);
      } finally {
        setLoadingGroups(false);
      }
    };

    loadAthleteAndGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Auto-sync 1x ao abrir dashboard (com cooldown)
  useEffect(() => {
    const runAutoSync = async () => {
      if (!currentUserId) return;
      if (autoSyncRanRef.current) return;

      const last = sessionStorage.getItem(AUTO_SYNC_KEY);
      const lastMs = last ? Number(last) : 0;
      const nowMs = Date.now();
      if (lastMs && nowMs - lastMs < AUTO_SYNC_COOLDOWN_MS) return;

      const { data: row, error } = await supabase
        .from("strava_tokens")
        .select("athlete_id")
        .eq("user_id", currentUserId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Erro ao checar strava_tokens (auto sync):", error);
        return;
      }
      if (!row?.athlete_id) return;

      autoSyncRanRef.current = true;
      sessionStorage.setItem(AUTO_SYNC_KEY, String(nowMs));

      await handleSync();
    };

    runAutoSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // Carrega athlete_ids do grupo selecionado
  useEffect(() => {
    const loadGroupAthletes = async () => {
      if (!selectedGroupId) {
        setGroupAthleteIds(null);
        return;
      }

      try {
        setLoadingGroupAthletes(true);

        const { data, error } = await supabase
          .from("training_group_strava_athletes")
          .select("athlete_id")
          .eq("group_id", selectedGroupId);

        if (error) {
          console.error("Erro ao carregar atletas do grupo:", error);
          setGroupAthleteIds(null);
          return;
        }

        const ids = Array.from(
          new Set(
            (data ?? [])
              .map((r: any) => r.athlete_id as number | null)
              .filter((id): id is number => typeof id === "number")
          )
        );

        setGroupAthleteIds(ids);
      } catch (err) {
        console.error("Erro inesperado ao carregar atletas do grupo:", err);
        setGroupAthleteIds(null);
      } finally {
        setLoadingGroupAthletes(false);
      }
    };

    loadGroupAthletes();
  }, [selectedGroupId]);

  // Nomes dos atletas (RPC)
  useEffect(() => {
    const loadNames = async () => {
      if (!selectedGroupId) return;

      const { data, error } = await supabase.rpc("get_group_athlete_names", {
        p_group_id: selectedGroupId,
      });

      if (error) {
        console.error("Erro RPC get_group_athlete_names:", error);
        return;
      }

      const map: Record<number, string> = {};
      (data ?? []).forEach((r: any) => {
        const aid = r?.athlete_id;
        const name = r?.full_name;
        if (typeof aid === "number" && typeof name === "string" && name.trim()) {
          map[aid] = name.trim();
        }
      });

      // garante nome do usuário atual
      if (currentAthleteId && athleteName) map[currentAthleteId] = athleteName;

      setAthleteNames(map);
    };

    loadNames();
  }, [selectedGroupId, currentAthleteId, athleteName]);

  // 1) filtra por período
  const activitiesInRange = safeActivities.filter((a) => isInRange(a.start_date, range, now));

  // 2) filtra por grupo
  let groupActivities = activitiesInRange;
  if (groupAthleteIds && groupAthleteIds.length > 0) {
    groupActivities = groupActivities.filter((a) => groupAthleteIds.includes(a.athlete_id));
  } else if (groupAthleteIds && groupAthleteIds.length === 0) {
    groupActivities = [];
  }

  // Atividades do atleta atual
  const athleteActivities =
    currentAthleteId != null
      ? groupActivities.filter((a) => a.athlete_id === currentAthleteId)
      : groupActivities;

  const athleteDistance = athleteActivities.reduce((sum, a) => sum + metersToKm(a.distance), 0);
  const athleteMovingTime = athleteActivities.reduce((sum, a) => sum + (a.moving_time ?? 0), 0);
  const athleteElevation = athleteActivities.reduce((sum, a) => sum + (a.total_elevation_gain ?? 0), 0);
  const athleteActivitiesCount = athleteActivities.length;

  const ranges: { key: RangeKey; label: string }[] = [
    { key: "all", label: "Tudo" },
    { key: "today", label: "Hoje" },
    { key: "7d", label: "7 dias" },
    { key: "30d", label: "30 dias" },
    { key: "6m", label: "6 meses" },
  ];

  const rangeLabel = useMemo(() => {
    const r = ranges.find((x) => x.key === range);
    return r?.label ?? "Período";
  }, [range]);

  const athleteLabel =
    athleteName ?? (currentAthleteId ? `Atleta ${currentAthleteId}` : "Atleta");

  // -----------------------------
  // RANKING DO GRUPO
  // -----------------------------
  const ranking: RankingEntry[] = useMemo(() => {
    if (!groupActivities || groupActivities.length === 0) return [];

    const map = new Map<number, { points: number; hours: number }>();

    for (const a of groupActivities) {
      const secs = a.moving_time ?? 0;
      if (!secs || secs <= 0) continue;

      const pts = getStravaActivityPoints(a.type ?? a.sport_type ?? null, secs);
      const hours = secs / 3600;

      const prev = map.get(a.athlete_id) ?? { points: 0, hours: 0 };
      map.set(a.athlete_id, {
        points: prev.points + pts,
        hours: prev.hours + hours,
      });
    }

    const entries: RankingEntry[] = Array.from(map.entries()).map(([athleteId, v]) => ({
      athleteId,
      label: athleteNames[athleteId] ?? `Atleta ${athleteId}`,
      totalPoints: Math.round(v.points),
      totalHours: v.hours,
      isCurrent: currentAthleteId === athleteId,
    }));

    entries.sort((a, b) => b.totalPoints - a.totalPoints);
    return entries;
  }, [groupActivities, athleteNames, currentAthleteId]);

  const lastPlace = ranking.length > 0 ? ranking[ranking.length - 1] : null;

  // -----------------------------
  // EVOLUÇÃO (preenche dias vazios)
  // -----------------------------
  const evolutionData: EvolutionPoint[] = useMemo(() => {
    if (!groupActivities || groupActivities.length === 0) return [];

    const leaderAthleteId = ranking.length > 0 ? ranking[0].athleteId : null;

    const userMap = new Map<string, number>();
    const leaderMap = new Map<string, number>();
    const groupMap = new Map<string, { totalMinutes: number; athleteIds: Set<number> }>();

    for (const a of groupActivities) {
      if (!a.start_date) continue;
      const d = new Date(a.start_date);
      if (Number.isNaN(d.getTime())) continue;

      const key = d.toISOString().slice(0, 10); // UTC
      const minutes = (a.moving_time ?? 0) / 60;

      const gPrev = groupMap.get(key) ?? {
        totalMinutes: 0,
        athleteIds: new Set<number>(),
      };
      gPrev.totalMinutes += minutes;
      gPrev.athleteIds.add(a.athlete_id);
      groupMap.set(key, gPrev);

      if (currentAthleteId != null && a.athlete_id === currentAthleteId) {
        userMap.set(key, (userMap.get(key) ?? 0) + minutes);
      }

      if (leaderAthleteId != null && a.athlete_id === leaderAthleteId) {
        leaderMap.set(key, (leaderMap.get(key) ?? 0) + minutes);
      }
    }

    const buildContinuousKeys = (rangeKey: RangeKey, nowRef: Date): string[] => {
      if (rangeKey === "all") {
        // "Tudo": não preenche anos de zeros
        const keys = new Set<string>([
          ...userMap.keys(),
          ...leaderMap.keys(),
          ...groupMap.keys(),
        ]);
        return Array.from(keys).sort((a, b) => (a < b ? -1 : 1));
      }

      const end = new Date(Date.UTC(nowRef.getUTCFullYear(), nowRef.getUTCMonth(), nowRef.getUTCDate()));
      const start = new Date(end);

      if (rangeKey === "today") start.setUTCDate(end.getUTCDate());
      if (rangeKey === "7d") start.setUTCDate(end.getUTCDate() - 6);
      if (rangeKey === "30d") start.setUTCDate(end.getUTCDate() - 29);
      if (rangeKey === "6m") start.setUTCDate(end.getUTCDate() - 179);

      const keys: string[] = [];
      const cursor = new Date(start);

      while (cursor.getTime() <= end.getTime()) {
        keys.push(cursor.toISOString().slice(0, 10));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      return keys;
    };

    const keys = buildContinuousKeys(range, now);

    return keys.map((key) => {
      const d = new Date(key + "T00:00:00.000Z");
      const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

      const userMinutes = userMap.get(key) ?? 0;
      const leaderMinutes = leaderMap.get(key) ?? 0;

      const groupInfo = groupMap.get(key);
      const groupAvgMinutes =
        groupInfo && groupInfo.athleteIds.size > 0 ? groupInfo.totalMinutes / groupInfo.athleteIds.size : 0;

      return {
        date: key,
        label,
        userMinutes: Number(userMinutes.toFixed(1)),
        leaderMinutes: Number(leaderMinutes.toFixed(1)),
        groupAvgMinutes: Number(groupAvgMinutes.toFixed(1)),
      };
    });
  }, [groupActivities, ranking, range, currentAthleteId, now]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "999px",
              background:
                "radial-gradient(circle at 20% 20%, #22c55e, #16a34a 40%, #0f172a 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              color: "#0b1120",
            }}
          >
            SP
          </div>
          <div>
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#64748b",
                margin: 0,
              }}
            >
              SportPlatform
            </p>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Dashboard de Performance
            </h1>
          </div>
        </div>

        {/* Seletor de grupo */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            {groups.length > 1 ? "Selecione o grupo para ver ranking e métricas:" : "Grupo atual:"}
          </span>

          {groups.length === 0 ? (
            <span style={{ fontSize: 12, color: "#6b7280" }}>Nenhum grupo encontrado.</span>
          ) : (
            <select
              value={selectedGroupId ?? ""}
              onChange={(e) => setSelectedGroupId(e.target.value || null)}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid rgba(55,65,81,0.9)",
                backgroundColor: "#020617",
                color: "#e5e7eb",
                outline: "none",
                cursor: "pointer",
                maxWidth: "100%",
              }}
            >
              {groups.map((g) => (
                <option
                  key={g.id}
                  value={g.id}
                  style={{ backgroundColor: "#020617", color: "#e5e7eb" }}
                >
                  {g.name}
                </option>
              ))}
            </select>
          )}

          {(loadingGroups || loadingGroupAthletes) && (
            <span style={{ fontSize: 11, color: "#9ca3af" }}>Carregando grupos/atletas...</span>
          )}
        </div>

        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0, marginTop: 4 }}>
          Visão geral do ranking do grupo, meme do churrasco, evolução dos treinos (minutos) e
          resumo das suas atividades.
        </p>
      </header>

      {/* Filtro de período */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 14,
          alignItems: "center",
        }}
      >
        {/* Botão Sync no mesmo estilo dos pills */}
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          style={{
            fontSize: 11,
            padding: "4px 10px",
            borderRadius: 999,
            border: syncing ? "1px solid rgba(55,65,81,0.9)" : "1px solid rgba(34,197,94,0.8)",
            background: syncing
              ? "transparent"
              : "radial-gradient(circle at top, #22c55e33, transparent)",
            color: syncing ? "#9ca3af" : "#bbf7d0",
            cursor: syncing ? "not-allowed" : "pointer",
            transition: "all 0.15s ease-out",
          }}
          title="Puxa atividades novas do Strava"
        >
          {syncing ? "Sincronizando..." : "Sincronizar agora"}
        </button>

        {ranges.map((r) => {
          const active = range === r.key;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              style={{
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 999,
                border: active
                  ? "1px solid rgba(34,197,94,0.8)"
                  : "1px solid rgba(55,65,81,0.9)",
                background: active
                  ? "radial-gradient(circle at top, #22c55e33, transparent)"
                  : "transparent",
                color: active ? "#bbf7d0" : "#e5e7eb",
                cursor: "pointer",
                transition: "all 0.15s ease-out",
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {syncMsg && (
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: -6, marginBottom: 12 }}>
          {syncMsg}
        </p>
      )}

      {/* MEME DO CHURRASCO */}
      {lastPlace && (
        <section
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
            padding: "10px 12px",
            borderRadius: 18,
            border: "1px solid rgba(248,113,113,0.6)",
            background: "linear-gradient(135deg, rgba(248,113,113,0.16), rgba(15,23,42,0.95))",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "#fca5a5",
              }}
            >
              Quem vai pagar o próximo churrasco?
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {lastPlace.label}
            </span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>
              Último colocado no ranking neste período.
            </span>
          </div>

          <div
            aria-hidden="true"
            style={{
              minWidth: 56,
              minHeight: 56,
              borderRadius: "999px",
              border: "2px solid rgba(248,113,113,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            🥩
          </div>
        </section>
      )}

      {/* RANKING DO GRUPO */}
      <section
        style={{
          marginBottom: 18,
          padding: "14px 14px",
          borderRadius: 22,
          border: "1px solid rgba(51,65,85,0.7)",
          background: "linear-gradient(180deg, rgba(2,6,23,0.9), rgba(15,23,42,0.85))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            Ranking do grupo ({rangeLabel})
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
            Pontuação baseada nas atividades Strava: atividades (exceto caminhada) = 100 pts/h, caminhada = 15 pts/h.
          </p>
        </div>

        <div style={{ marginTop: 12 }}>
          {/* header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 140px 140px",
              gap: 10,
              padding: "10px 10px",
              color: "#9ca3af",
              fontSize: 12,
              borderBottom: "1px solid rgba(51,65,85,0.6)",
            }}
          >
            <div>Pos.</div>
            <div>Atleta</div>
            <div style={{ textAlign: "right" }}>Pontos</div>
            <div style={{ textAlign: "right" }}>Horas (total)</div>
          </div>

          {ranking.length === 0 ? (
            <div style={{ padding: "12px 10px", color: "#9ca3af", fontSize: 13 }}>
              Ainda não há atividades suficientes neste período.
            </div>
          ) : (
            ranking.map((r, idx) => (
              <div
                key={r.athleteId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 140px 140px",
                  gap: 10,
                  padding: "12px 10px",
                  borderBottom: idx === ranking.length - 1 ? "none" : "1px solid rgba(51,65,85,0.35)",
                  background: r.isCurrent ? "rgba(34,197,94,0.10)" : "transparent",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 18 }}>#{idx + 1}</div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 18,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.label}
                  </div>

                  {r.isCurrent && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(34,197,94,0.7)",
                        color: "#bbf7d0",
                        background: "rgba(34,197,94,0.12)",
                        fontWeight: 700,
                      }}
                    >
                      Você
                    </span>
                  )}
                </div>

                <div style={{ textAlign: "right", fontSize: 18, fontWeight: 800 }}>
                  {r.totalPoints}
                </div>

                <div style={{ textAlign: "right", fontSize: 18, fontWeight: 800 }}>
                  {r.totalHours.toFixed(1)} h
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CARDS RESUMO */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            padding: 14,
            borderRadius: 18,
            border: "1px solid rgba(51,65,85,0.7)",
            background: "rgba(2,6,23,0.75)",
          }}
        >
          <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 700 }}>Atividades</div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{athleteActivitiesCount}</div>
        </div>

        <div
          style={{
            padding: 14,
            borderRadius: 18,
            border: "1px solid rgba(51,65,85,0.7)",
            background: "rgba(2,6,23,0.75)",
          }}
        >
          <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 700 }}>Distância (km)</div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{athleteDistance.toFixed(1)}</div>
        </div>

        <div
          style={{
            padding: 14,
            borderRadius: 18,
            border: "1px solid rgba(51,65,85,0.7)",
            background: "rgba(2,6,23,0.75)",
          }}
        >
          <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 700 }}>Tempo em movimento</div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{formatDuration(athleteMovingTime)}</div>
        </div>

        <div
          style={{
            padding: 14,
            borderRadius: 18,
            border: "1px solid rgba(51,65,85,0.7)",
            background: "rgba(2,6,23,0.75)",
          }}
        >
          <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 700 }}>Elevação (m)</div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{Math.round(athleteElevation)}</div>
        </div>
      </section>

      {/* GRÁFICO */}
      <section style={{ marginBottom: 22 }}>
        <DashboardCharts evolutionData={evolutionData} />
      </section>
    </div>
  );
}
