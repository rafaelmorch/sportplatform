// components/DashboardClient.tsx
"use client";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";


import { useEffect, useMemo, useRef, useState } from "react";
import DashboardCharts from "@/components/DashboardCharts";
import { supabaseBrowser } from "@/lib/supabase-browser";

const supabase = supabaseBrowser;

type GroupActivity = {
  id: string;
  user_id: string;
  user_name?: string;
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
  activities: GroupActivity[];
  eventsSummary: EventsSummary; // compat
  communityId?: string;
};

type RankingEntry = {
  userId: string;
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

const AUTO_SYNC_KEY = "sp_autosync_ran_at";
const AUTO_SYNC_COOLDOWN_MS = 10 * 60 * 1000;

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

function formatPace(
  movingTime: number | null | undefined,
  distance: number | null | undefined
): string {
  if (!movingTime || !distance || distance <= 0) return "-";

  const km = distance / 1000;
  if (km <= 0) return "-";

  const paceSeconds = movingTime / km;
  const min = Math.floor(paceSeconds / 60);
  const sec = Math.round(paceSeconds % 60);

  return `${min}:${sec.toString().padStart(2, "0")} /km`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

/** Dia local (sem UTC) */
function startOfDayLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** YYYY-MM-DD no fuso local */
function dateKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isInRange(dateStr: string | null, range: RangeKey, now: Date): boolean {
  if (range === "all") return true;
  if (!dateStr) return false;

  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;

  const today = startOfDayLocal(now);
  const day = startOfDayLocal(d);

  const diffDays = Math.floor((today.getTime() - day.getTime()) / 86400000);

  if (range === "today") return diffDays === 0;
  if (range === "7d") return diffDays >= 0 && diffDays <= 6;
  if (range === "30d") return diffDays >= 0 && diffDays <= 29;
  if (range === "6m") return diffDays >= 0 && diffDays <= 179;

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
 */
function getStravaActivityPoints(type: string | null, movingSeconds: number): number {
  if (!movingSeconds || movingSeconds <= 0) return 0;
  const hours = movingSeconds / 3600;
  const rate = isWalkingType(type) ? 15 : 100;
  return hours * rate;
}

export default function DashboardClient({ activities, eventsSummary, communityId }: DashboardClientProps) {
  const now = new Date();

  const [range, setRange] = useState<RangeKey>("7d");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  const [userNames, setUserNames] = useState<Record<string, string>>({});

  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingGroupAthletes, setLoadingGroupAthletes] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [isStravaConnected, setIsStravaConnected] = useState<boolean>(true);
  const autoSyncRanRef = useRef(false);

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
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
  setSyncMsg(
    (json?.message as string) ??
      "Não foi possível sincronizar agora."
  );

  if ((json?.message as string)?.toLowerCase().includes("strava")) {
    setIsStravaConnected(false);
  }

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

  // load current user
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user ?? null;

        if (!user) {
          return;
        }

        setCurrentUserId(user.id);

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
          console.error(
            "Erro ao carregar profile:",
            profileError
          );
        }

        if (profile?.full_name) {
          setCurrentUserName(profile.full_name);
        }
      } catch (err) {
        console.error(
          "Erro inesperado ao definir usuário:",
          err
        );
      }
    };

    loadCurrentUser();
  }, []);
  // auto-sync cooldown
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

  // filters
  const activitiesInRange = safeActivities.filter((a) => isInRange(a.start_date, range, now));

  const groupActivities = activitiesInRange;


  const athleteActivities =
    currentUserId != null
      ? groupActivities.filter((a) => a.user_id === currentUserId)
      : groupActivities;

  const athleteDistance = athleteActivities.reduce((sum, a) => sum + metersToKm(a.distance), 0);
  const athleteMovingTime = athleteActivities.reduce((sum, a) => sum + (a.moving_time ?? 0), 0);
  const athleteElevation = athleteActivities.reduce(
    (sum, a) => sum + (a.total_elevation_gain ?? 0),
    0
  );
  const athleteActivitiesCount = athleteActivities.length;

  const lastActivities = useMemo(() => {
    return [...athleteActivities]
      .sort((a, b) => {
        const da = a.start_date ? new Date(a.start_date).getTime() : 0;
        const db = b.start_date ? new Date(b.start_date).getTime() : 0;
        return db - da;
      })
      .slice(0, 10);
  }, [athleteActivities]);

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

  const ranking: RankingEntry[] = useMemo(() => {
    if (!groupActivities || groupActivities.length === 0) return [];

    const map = new Map<string, { points: number; hours: number }>();

    for (const a of groupActivities) {
      const secs = a.moving_time ?? 0;
      if (!secs || secs <= 0) continue;

      const pts = getStravaActivityPoints(a.type ?? a.sport_type ?? null, secs);
      const hours = secs / 3600;

      const prev = map.get(a.user_id) ?? { points: 0, hours: 0 };
      map.set(a.user_id, {
        points: prev.points + pts,
        hours: prev.hours + hours,
      });
    }

const entries: RankingEntry[] = Array.from(map.entries()).map(([userId, v]) => {
  const activityWithName = groupActivities.find(
    (a) => a.user_id === userId
  );

  return {
    userId,
    label: activityWithName?.user_name ?? "Atleta",
    totalPoints: Math.round(v.points),
    totalHours: v.hours,
    isCurrent: currentUserId === userId,
  };
});

    entries.sort((a, b) => b.totalPoints - a.totalPoints);
    return entries;
  }, [groupActivities, currentUserId]);


  const topRanking = ranking.slice(0, 10);

  const currentUserRankingIndex = ranking.findIndex((entry) => entry.isCurrent);

  const currentUserRanking =
    currentUserRankingIndex >= 0
      ? {
          ...ranking[currentUserRankingIndex],
          position: currentUserRankingIndex + 1,
        }
      : null;

  const currentUserIsTop10 =
    currentUserRankingIndex >= 0 && currentUserRankingIndex < 10;
  const lastPlace = ranking.length > 0 ? ranking[ranking.length - 1] : null;

  const evolutionData: EvolutionPoint[] = useMemo(() => {
    if (!groupActivities || groupActivities.length === 0) return [];

    const leaderUserId = ranking.length > 0 ? ranking[0].userId : null;

    const userMap = new Map<string, number>();
    const leaderMap = new Map<string, number>();
    const groupMap = new Map<string, { totalMinutes: number; userIds: Set<string> }>();

    for (const a of groupActivities) {
      if (!a.start_date) continue;
      const d = new Date(a.start_date);
      if (Number.isNaN(d.getTime())) continue;

      // ✅ chave por DIA LOCAL (resolve "vai até ontem")
      const key = dateKeyLocal(d);
      const minutes = (a.moving_time ?? 0) / 60;

      const gPrev = groupMap.get(key) ?? { totalMinutes: 0, userIds: new Set<string>() };
      gPrev.totalMinutes += minutes;
      gPrev.userIds.add(a.user_id);
      groupMap.set(key, gPrev);

      if (currentUserId != null && a.user_id === currentUserId) {
        userMap.set(key, (userMap.get(key) ?? 0) + minutes);
      }

      if (leaderUserId != null && a.user_id === leaderUserId) {
        leaderMap.set(key, (leaderMap.get(key) ?? 0) + minutes);
      }
    }

    const buildContinuousKeys = (rangeKey: RangeKey, nowRef: Date): string[] => {
      if (rangeKey === "all") {
        const keys = new Set<string>([...userMap.keys(), ...leaderMap.keys(), ...groupMap.keys()]);
        return Array.from(keys).sort((a, b) => (a < b ? -1 : 1));
      }

      const end = startOfDayLocal(nowRef);
      const start = new Date(end);

      if (rangeKey === "today") start.setDate(end.getDate());
      if (rangeKey === "7d") start.setDate(end.getDate() - 6);
      if (rangeKey === "30d") start.setDate(end.getDate() - 29);
      if (rangeKey === "6m") start.setDate(end.getDate() - 179);

      const keys: string[] = [];
      const cursor = new Date(start);
      while (cursor.getTime() <= end.getTime()) {
        keys.push(dateKeyLocal(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      return keys;
    };

    const keys = buildContinuousKeys(range, now);

    return keys.map((key) => {
      // ✅ label no local (sem Z)
      const d = new Date(key + "T00:00:00");
      const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

      const userMinutes = userMap.get(key) ?? 0;
      const leaderMinutes = leaderMap.get(key) ?? 0;

      const groupInfo = groupMap.get(key);
      const groupAvgMinutes =
        groupInfo && groupInfo.userIds.size > 0
          ? groupInfo.totalMinutes / groupInfo.userIds.size
          : 0;

      return {
        date: key,
        label,
        userMinutes: Number(userMinutes.toFixed(1)),
        leaderMinutes: Number(leaderMinutes.toFixed(1)),
        groupAvgMinutes: Number(groupAvgMinutes.toFixed(1)),
      };
    });
  }, [groupActivities, ranking, range, currentUserId, now]);

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
      <header style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "999px",
              background:
                "linear-gradient(135deg, #22c55e, #86efac)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              color: "#052e16",
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
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
              Dashboard de Performance
            </h1>
          </div>
        </div>
<p style={{ fontSize: 13, color: "#64748b", margin: 0, marginTop: 4 }}>
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
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
style={{
  fontSize: 12,
  padding: "6px 14px",
  borderRadius: 999,
  border: "1px solid #16a34a",
  background: syncing ? "#e2e8f0" : "#16a34a",
  color: syncing ? "#64748b" : "#ffffff",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease",
}}          title="Puxa atividades novas do Strava"
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
                border: active ? "1px solid #22c55e" : "1px solid #cbd5e1",
                background: active ? "#dcfce7" : "transparent",
                color: active ? "#166534" : "#475569",
                cursor: "pointer",
                transition: "all 0.15s ease-out",
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {syncMsg && !isStravaConnected && (
  <div style={{ marginTop: -6, marginBottom: 12 }}>
    <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px" }}>
      {syncMsg}
    </p>

    <a
      href="/integrations"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "7px 14px",
        borderRadius: 999,
        background: "#fc4c02",
        color: "#ffffff",
        fontSize: 12,
        fontWeight: 700,
        textDecoration: "none",
      }}
    >
      Connect Strava
    </a>
  </div>
)}


      {/* RANKING */}
      <section
        style={{
          marginBottom: 18,
          padding: "14px 14px",
          borderRadius: 6,
          border: "1px solid #e2e8f0",
          boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
          background: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, fontFamily: "Montserrat, sans-serif", letterSpacing: "-0.01em" }}>Ranking do grupo ({rangeLabel})</h2>
          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
            Pontuação baseada nas atividades Strava: atividades (exceto caminhada) = 100 pts/h, caminhada = 15 pts/h.
          </p>
        </div>

        <div style={{ marginTop: 12 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "40px minmax(90px, 1fr) 58px 68px",
              gap: 10,
              padding: "10px 10px",
              color: "#64748b",
              fontSize: 12,
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div>Pos.</div>
            <div>Atleta</div>
            <div style={{ textAlign: "right" }}>Pontos</div>
            <div style={{ textAlign: "right" }}>Horas (total)</div>
          </div>

          {ranking.length === 0 ? (
            <div style={{ padding: "12px 10px", color: "#64748b", fontSize: 13 }}>
              Ainda não há atividades suficientes neste período.
            </div>
          ) : (
            topRanking.map((r, idx) => (
              <div
                key={r.userId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px minmax(90px, 1fr) 58px 68px",
                  gap: 10,
                  padding: "12px 10px",
                  borderBottom: idx === topRanking.length - 1 ? "none" : "1px solid #e2e8f0",
                  background: r.isCurrent ? "#ecfdf5" : "transparent",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 17, fontFamily: "Montserrat, sans-serif" }}>#{idx + 1}</div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, width: "100%" }}>
                  <div
                    style={{
                      fontWeight: 500,
                  fontSize: 16,
                  fontFamily: "Montserrat, sans-serif",
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
                        border: "1px solid #22c55e",
                        color: "#166534",
                        background: "#dcfce7",
                        fontWeight: 700,
                      }}
                    >
                      Você
                    </span>
                  )}
      {!currentUserIsTop10 && currentUserRanking && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              marginBottom: 8,
              fontSize: 11,
              fontWeight: 500,
              color: "#64748b",
              fontFamily: "Montserrat, sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Sua posição
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "40px minmax(90px, 1fr) 58px 68px",
              gap: 10,
              alignItems: "center",
              padding: "12px 10px",
              background: "#ecfdf5",
              borderRadius: 6,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 17, fontFamily: "Montserrat, sans-serif" }}>
              #{currentUserRanking.position}
            </div>

            <div
              style={{
                minWidth: 0,
                fontWeight: 500,
                fontSize: 15,
                fontFamily: "Montserrat, sans-serif",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {currentUserRanking.label}
            </div>

            <div style={{ textAlign: "right", fontSize: 16, fontWeight: 600, fontFamily: "Montserrat, sans-serif" }}>
              {currentUserRanking.totalPoints}
            </div>

            <div style={{ textAlign: "right", fontSize: 16, fontWeight: 600, fontFamily: "Montserrat, sans-serif" }}>
              {currentUserRanking.totalHours.toFixed(1)} h
            </div>
          </div>
        </div>
      )}
                </div>

                <div style={{ textAlign: "right", fontSize: 17, fontWeight: 600, fontFamily: "Montserrat, sans-serif" }}>{r.totalPoints}</div>
                <div style={{ textAlign: "right", fontSize: 17, fontWeight: 600, fontFamily: "Montserrat, sans-serif" }}>{r.totalHours.toFixed(1)} h</div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CARDS */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div style={{ padding: 14, borderRadius: 6, border: "1px solid #e2e8f0",
          boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)", background: "#ffffff" }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Atividades</div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{athleteActivitiesCount}</div>
        </div>

        <div style={{ padding: 14, borderRadius: 6, border: "1px solid #e2e8f0",
          boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)", background: "#ffffff" }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Distância (km)</div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{athleteDistance.toFixed(1)}</div>
        </div>

        <div style={{ padding: 14, borderRadius: 6, border: "1px solid #e2e8f0",
          boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)", background: "#ffffff" }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Tempo em movimento</div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{formatDuration(athleteMovingTime)}</div>
        </div>

        <div style={{ padding: 14, borderRadius: 6, border: "1px solid #e2e8f0",
          boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)", background: "#ffffff" }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Elevação (m)</div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{Math.round(athleteElevation)}</div>
        </div>
      </section>

      {/* GRÁFICO (✅ com espaço garantido embaixo) */}
      <section
        style={{
          marginBottom: 28, // ✅ separa bem do card de baixo
          paddingBottom: 6, // ✅ evita “colar” mesmo se o gráfico colapsar margem
        }}
      >
        <DashboardCharts evolutionData={evolutionData} />
      </section>

      {/* ✅ ÚLTIMAS 10 ATIVIDADES (depois do gráfico) */}
      <section
        style={{
          marginTop: 0, // ✅ não precisa mais, já tem espaço garantido no gráfico
          marginBottom: 18,
          padding: "14px 14px",
          borderRadius: 6,
          border: "1px solid #e2e8f0",
          boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
          background: "#ffffff",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, marginBottom: 10 }}>
          Últimas atividades (10)
        </h2>

        {lastActivities.length === 0 ? (
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            Ainda não há atividades neste período.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lastActivities.map((a) => {
              const title = a.name ?? a.type ?? a.sport_type ?? "Atividade";
              const km = metersToKm(a.distance);
              const dur = formatDuration(a.moving_time);
              const pace = formatPace(a.moving_time, a.distance);
              const elev = Math.round(a.total_elevation_gain ?? 0);

              return (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "10px 10px",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
          boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
                    background: "#f8fafc",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 520,
                      }}
                    >
                      {title}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {formatDate(a.start_date)}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      alignItems: "center",
                      fontSize: 12,
                      color: "#0f172a",
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                    }}
                  >
                    <span>
                      <b>{km.toFixed(1)}</b> km
                    </span>
                    <span>
                      <b>{dur}</b>
                    </span>
                    <span>
                      <b>{pace}</b>
                    </span>
                    <span>
                      <b>{elev}</b> m
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    
  {/* RANKING COMPLETO */}
  <section
    style={{
      marginTop: 18,
      marginBottom: 18,
      padding: "14px 14px",
      borderRadius: 6,
      border: "1px solid #e2e8f0",
          boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
      background: "#ffffff",
    }}
  >
    <h2
      style={{
        margin: 0,
        marginBottom: 6,
        fontSize: 18,
        fontWeight: 600,
        fontFamily: "Montserrat, sans-serif",
        letterSpacing: "-0.01em",
      }}
    >
      Ranking completo
    </h2>

    <p
      style={{
        margin: "0 0 12px",
        fontSize: 12,
        color: "#64748b",
        fontFamily: "Montserrat, sans-serif",
      }}
    >
      Classificação completa do grupo neste período.
    </p>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "40px minmax(90px, 1fr) 58px 68px",
        gap: 10,
        padding: "10px 10px",
        color: "#64748b",
        fontSize: 12,
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <div>Pos.</div>
      <div>Atleta</div>
      <div style={{ textAlign: "right" }}>Pontos</div>
      <div style={{ textAlign: "right" }}>Horas</div>
    </div>

    {ranking.length === 0 ? (
      <div
        style={{
          padding: "14px 10px",
          color: "#64748b",
          fontSize: 13,
        }}
      >
        Ainda não há atividades suficientes neste período.
      </div>
    ) : (
      ranking.map((r, idx) => (
        <div
          key={`full-${r.userId}`}
          style={{
            display: "grid",
            gridTemplateColumns: "40px minmax(90px, 1fr) 58px 68px",
            gap: 10,
            alignItems: "center",
            padding: "12px 10px",
            borderBottom:
              idx === ranking.length - 1
                ? "none"
                : "1px solid #e2e8f0",
            background: r.isCurrent ? "#ecfdf5" : "transparent",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: 15,
              fontFamily: "Montserrat, sans-serif",
            }}
          >
            #{idx + 1}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: 0,
              width: "100%",
            }}
          >
            <div
              style={{
                minWidth: 0,
                fontWeight: 500,
                fontSize: 14,
                fontFamily: "Montserrat, sans-serif",
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
                  flexShrink: 0,
                  fontSize: 10,
                  padding: "2px 7px",
                  borderRadius: 999,
                  border: "1px solid #22c55e",
                  color: "#166534",
                  background: "#dcfce7",
                  fontWeight: 500,
                  fontFamily: "Montserrat, sans-serif",
                }}
              >
                Você
              </span>
            )}
          </div>

          <div
            style={{
              textAlign: "right",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "Montserrat, sans-serif",
            }}
          >
            {r.totalPoints}
          </div>

          <div
            style={{
              textAlign: "right",
              fontSize: 14,
              fontWeight: 500,
              fontFamily: "Montserrat, sans-serif",
            }}
          >
            {r.totalHours.toFixed(1)} h
          </div>
        </div>
      ))
    )}
  </section>
</div>
  );
}






































