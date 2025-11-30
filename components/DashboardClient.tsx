// components/DashboardClient.tsx
"use client";

import { useEffect, useState } from "react";
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
  moving_time: number | null; // segundos
  total_elevation_gain: number | null;
};

type EventsSummary = {
  availableEvents: number;
  userEvents: number;
};

type RangeKey = "all" | "today" | "7d" | "30d" | "6m";

type DashboardClientProps = {
  activities: StravaActivity[];
  eventsSummary: EventsSummary; // mantido só por compatibilidade
};

type RankingEntry = {
  userId: string;
  label: string;
  totalPoints: number;
  totalHours: number;
  isCurrent: boolean;
};

type SortKey = "label" | "totalPoints";

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

type GroupActivityRow = {
  user_id: string;
  start_date: string;
  type: string | null;
  minutes: number;
  full_name: string | null;
};

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

function isInRange(dateStr: string | null, range: RangeKey, now: Date): boolean {
  if (range === "all") return true;

  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;

  const dateKey = d.toISOString().slice(0, 10);
  const todayKey = now.toISOString().slice(0, 10);

  if (range === "today") {
    return dateKey === todayKey;
  }

  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (range === "7d") return diffDays <= 7;
  if (range === "30d") return diffDays <= 30;
  if (range === "6m") return diffDays <= 180;

  return true;
}

// ---------------------
// PONTUAÇÃO DO RANKING (user_activities)
// ---------------------

function isWalkingType(type: string | null | undefined): boolean {
  const t = (type ?? "").toLowerCase();
  return t.includes("walk") || t.includes("hike") || t.includes("caminhada");
}

/**
 * Regra:
 * - Atividades que NÃO são caminhada: 1h = 100 pontos
 * - Caminhada: 1h = 15 pontos
 * (usando minutos da tabela user_activities)
 */
function getUserActivityPoints(type: string | null, minutes: number): number {
  if (!minutes || minutes <= 0) return 0;
  const hours = minutes / 60;
  const rate = isWalkingType(type) ? 15 : 100;
  return hours * rate;
}

export default function DashboardClient({
  activities,
}: DashboardClientProps) {
  const [range, setRange] = useState<RangeKey>("30d");

  const [currentAthleteId, setCurrentAthleteId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState<string | null>(null);
  const [loadingAthlete, setLoadingAthlete] = useState(true);

  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupAthleteIds, setGroupAthleteIds] = useState<number[] | null>(null);
  const [groupUserActivities, setGroupUserActivities] = useState<
    GroupActivityRow[]
  >([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingGroupActivities, setLoadingGroupActivities] = useState(false);

  const [rankingSortKey, setRankingSortKey] = useState<SortKey>("totalPoints");
  const [rankingSortDir, setRankingSortDir] = useState<"asc" | "desc">("desc");

  // Carrega usuário, athlete_id e grupos em que ele participa
  useEffect(() => {
    const loadAthleteAndGroups = async () => {
      try {
        setLoadingAthlete(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Erro ao carregar usuário:", userError);
        }

        if (!user) {
          const firstAthlete = activities[0]?.athlete_id ?? null;
          setCurrentAthleteId(firstAthlete);
          setLoadingAthlete(false);
          return;
        }

        setCurrentUserId(user.id);

        // Perfil (nome)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Erro ao carregar profile:", profileError);
        }

        if (profile?.full_name) {
          setAthleteName(profile.full_name);
        }

        // Athlete id do usuário (Strava)
        const { data: tokenRow, error: tokenError } = await supabase
          .from("strava_tokens")
          .select("athlete_id")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (tokenError) {
          console.error("Erro ao carregar strava_tokens:", tokenError);
        }

        if (tokenRow?.athlete_id) {
          setCurrentAthleteId(tokenRow.athlete_id);
        } else {
          const firstAthlete = activities[0]?.athlete_id ?? null;
          setCurrentAthleteId(firstAthlete);
        }

        // Grupos em que o usuário participa
        setLoadingGroups(true);

        const { data: memberRows, error: memberError } = await supabase
          .from("training_group_members")
          .select("group_id")
          .eq("user_id", user.id);

        if (memberError) {
          console.error("Erro ao carregar grupos do usuário:", memberError);
        } else if (memberRows && memberRows.length > 0) {
          const groupIds = Array.from(
            new Set(memberRows.map((m: any) => m.group_id as string))
          );

          const { data: groupRows, error: groupError } = await supabase
            .from("training_groups")
            .select("id, title")
            .in("id", groupIds);

          if (groupError) {
            console.error("Erro ao carregar dados dos grupos:", groupError);
          } else if (groupRows) {
            const opts: GroupOption[] = groupRows.map((g: any) => ({
              id: g.id as string,
              name: g.title as string,
            }));

            setGroups(opts);
            if (opts.length > 0) {
              setSelectedGroupId(opts[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Erro inesperado ao definir atleta/grupos:", err);
        const firstAthlete = activities[0]?.athlete_id ?? null;
        setCurrentAthleteId(firstAthlete);
      } finally {
        setLoadingAthlete(false);
        setLoadingGroups(false);
      }
    };

    loadAthleteAndGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper para carregar atividades de user_activities dos membros do grupo
  const loadGroupUserActivities = async (userIds: string[]) => {
    if (!userIds || userIds.length === 0) {
      setGroupUserActivities([]);
      return;
    }

    try {
      setLoadingGroupActivities(true);

      const { data: activitiesData, error: activitiesError } = await supabase
        .from("user_activities")
        .select("user_id, start_date, type, minutes")
        .in("user_id", userIds);

      if (activitiesError) {
        console.error(
          "Erro ao carregar user_activities do grupo:",
          activitiesError
        );
        setGroupUserActivities([]);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profilesError) {
        console.error("Erro ao carregar profiles do grupo:", profilesError);
      }

      const nameMap = new Map<string, string | null>();
      (profilesData ?? []).forEach((p: any) => {
        nameMap.set(p.id as string, (p.full_name as string) ?? null);
      });

      const rows: GroupActivityRow[] = (activitiesData ?? []).map(
        (row: any) => ({
          user_id: row.user_id as string,
          start_date: row.start_date as string,
          type: (row.type as string) ?? null,
          minutes: (row.minutes as number) ?? 0,
          full_name: nameMap.get(row.user_id as string) ?? null,
        })
      );

      setGroupUserActivities(rows);
    } catch (err) {
      console.error("Erro inesperado ao carregar atividades do grupo:", err);
      setGroupUserActivities([]);
    } finally {
      setLoadingGroupActivities(false);
    }
  };

  // Carrega os athlete_ids E os user_activities dos membros do grupo selecionado
  useEffect(() => {
    const loadGroupAthletes = async () => {
      if (!selectedGroupId) {
        setGroupAthleteIds(null);
        setGroupUserActivities([]);
        return;
      }

      try {
        setLoadingGroups(true);

        const { data: members, error: membersError } = await supabase
          .from("training_group_members")
          .select("user_id")
          .eq("group_id", selectedGroupId);

        if (membersError) {
          console.error("Erro ao carregar membros do grupo:", membersError);
          setGroupAthleteIds(null);
          setGroupUserActivities([]);
          return;
        }

        const userIds = (members ?? []).map((m: any) => m.user_id as string);

        // carrega atividades de user_activities para TODOS os membros do grupo
        await loadGroupUserActivities(userIds);

        // Mapeia para athlete_ids (Strava) quando existir
        if (userIds.length === 0) {
          setGroupAthleteIds([]);
          return;
        }

        const { data: tokens, error: tokensError } = await supabase
          .from("strava_tokens")
          .select("user_id, athlete_id")
          .in("user_id", userIds);

        if (tokensError) {
          console.error(
            "Erro ao carregar tokens dos atletas do grupo:",
            tokensError
          );
          setGroupAthleteIds(null);
          return;
        }

        const athleteIds = (tokens ?? [])
          .map((t: any) => t.athlete_id as number | null)
          .filter((id): id is number => id != null);

        setGroupAthleteIds(Array.from(new Set(athleteIds)));
      } catch (err) {
        console.error("Erro inesperado ao carregar atletas do grupo:", err);
        setGroupAthleteIds(null);
        setGroupUserActivities([]);
      } finally {
        setLoadingGroups(false);
      }
    };

    if (selectedGroupId) {
      loadGroupAthletes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId]);

  const now = new Date();

  // Atividades Strava dentro do range (ainda usadas para alguns cards/tabela)
  const activitiesInRange = activities.filter((a) =>
    isInRange(a.start_date, range, now)
  );

  let groupActivities = activitiesInRange;
  if (groupAthleteIds && groupAthleteIds.length > 0) {
    groupActivities = groupActivities.filter(
      (a) =>
        typeof a.athlete_id === "number" &&
        groupAthleteIds.includes(a.athlete_id)
    );
  }

  const athleteActivities =
    currentAthleteId != null
      ? groupActivities.filter((a) => a.athlete_id === currentAthleteId)
      : groupActivities;

  const athleteDistance = athleteActivities.reduce(
    (sum, a) => sum + metersToKm(a.distance),
    0
  );
  const athleteMovingTime = athleteActivities.reduce(
    (sum, a) => sum + (a.moving_time ?? 0),
    0
  );
  const athleteElevation = athleteActivities.reduce(
    (sum, a) => sum + (a.total_elevation_gain ?? 0),
    0
  );
  const athleteActivitiesCount = athleteActivities.length;

  const groupDistance = groupActivities.reduce(
    (sum, a) => sum + metersToKm(a.distance),
    0
  );
  const groupMovingTime = groupActivities.reduce(
    (sum, a) => sum + (a.moving_time ?? 0),
    0
  );
  const groupElevation = groupActivities.reduce(
    (sum, a) => sum + (a.total_elevation_gain ?? 0),
    0
  );
  const groupActivitiesCount = groupActivities.length;

  const lastActivities = [...groupActivities]
    .sort((a, b) => {
      const da = a.start_date ? new Date(a.start_date).getTime() : 0;
      const db = b.start_date ? new Date(b.start_date).getTime() : 0;
      return db - da;
    })
    .slice(0, 10);

  const ranges: { key: RangeKey; label: string }[] = [
    { key: "all", label: "Tudo" },
    { key: "today", label: "Hoje" },
    { key: "7d", label: "7 dias" },
    { key: "30d", label: "30 dias" },
    { key: "6m", label: "6 meses" },
  ];

  const athleteLabel =
    athleteName ?? (currentAthleteId ? `Atleta ${currentAthleteId}` : "Atleta");

  // -----------------------------
  // RANKING DO GRUPO (com user_activities)
  // -----------------------------
  const ranking: RankingEntry[] = (() => {
    if (!groupUserActivities || groupUserActivities.length === 0) return [];

    const filtered = groupUserActivities.filter((a) =>
      isInRange(a.start_date, range, now)
    );
    if (filtered.length === 0) return [];

    const map = new Map<
      string,
      { points: number; hours: number; name: string | null }
    >();

    for (const a of filtered) {
      const minutes = a.minutes ?? 0;
      const pts = getUserActivityPoints(a.type, minutes);
      const hours = minutes / 60;

      const prev = map.get(a.user_id) ?? {
        points: 0,
        hours: 0,
        name: a.full_name,
      };

      map.set(a.user_id, {
        points: prev.points + pts,
        hours: prev.hours + hours,
        name: a.full_name ?? prev.name,
      });
    }

    const entries: RankingEntry[] = Array.from(map.entries()).map(
      ([userId, v]) => ({
        userId,
        label: v.name ?? `Atleta ${userId.slice(0, 8)}`,
        totalPoints: Math.round(v.points),
        totalHours: v.hours,
        isCurrent: currentUserId === userId,
      })
    );

    // sem ordenação aqui; a ordenação final é aplicada em sortedRanking
    return entries;
  })();

  const sortedRanking: RankingEntry[] = (() => {
    const list = [...ranking];
    list.sort((a, b) => {
      if (rankingSortKey === "totalPoints") {
        const diff = a.totalPoints - b.totalPoints;
        return rankingSortDir === "asc" ? diff : -diff;
      }

      // label
      const cmp = a.label.localeCompare(b.label, "pt-BR", {
        sensitivity: "base",
      });
      return rankingSortDir === "asc" ? cmp : -cmp;
    });
    return list;
  })();

  // -----------------------------
  // EVOLUÇÃO DOS TREINOS (MINUTOS) - 3 linhas
  // -----------------------------
  const evolutionData: EvolutionPoint[] = (() => {
    if (!groupUserActivities || groupUserActivities.length === 0) return [];

    const filtered = groupUserActivities.filter((a) =>
      isInRange(a.start_date, range, now)
    );
    if (filtered.length === 0) return [];

    const leaderId = sortedRanking.length > 0 ? sortedRanking[0].userId : null;

    const userMap = new Map<string, number>(); // date -> minutos do usuário
    const leaderMap = new Map<string, number>(); // date -> minutos do líder
    const groupMap = new Map<
      string,
      { totalMinutes: number; userIds: Set<string> }
    >();

    for (const a of filtered) {
      if (!a.start_date) continue;
      const d = new Date(a.start_date);
      if (Number.isNaN(d.getTime())) continue;

      const key = d.toISOString().slice(0, 10);
      const minutes = a.minutes ?? 0;

      // grupo (para média)
      const gPrev =
        groupMap.get(key) ?? {
          totalMinutes: 0,
          userIds: new Set<string>(),
        };
      gPrev.totalMinutes += minutes;
      gPrev.userIds.add(a.user_id);
      groupMap.set(key, gPrev);

      // usuário atual
      if (currentUserId && a.user_id === currentUserId) {
        userMap.set(key, (userMap.get(key) ?? 0) + minutes);
      }

      // líder
      if (leaderId && a.user_id === leaderId) {
        leaderMap.set(key, (leaderMap.get(key) ?? 0) + minutes);
      }
    }

    const allDates = new Set<string>([
      ...userMap.keys(),
      ...leaderMap.keys(),
      ...groupMap.keys(),
    ]);

    const sorted = Array.from(allDates).sort((a, b) => (a < b ? -1 : 1));

    return sorted.map((key) => {
      const d = new Date(key);
      const label = d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });

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
  })();

  const handleRankingSort = (key: SortKey) => {
    if (rankingSortKey === key) {
      setRankingSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setRankingSortKey(key);
      // default: pontos em ordem desc, nome em ordem asc
      setRankingSortDir(key === "totalPoints" ? "desc" : "asc");
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (rankingSortKey !== key) return "↕";
    return rankingSortDir === "asc" ? "▲" : "▼";
  };

  return (
    <>
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
          <span
            style={{
              fontSize: 12,
              color: "#9ca3af",
            }}
          >
            {groups.length > 1
              ? "Selecione o grupo para ver ranking e métricas:"
              : "Grupo atual:"}
          </span>
          {groups.length === 0 ? (
            <span
              style={{
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Nenhum grupo encontrado.
            </span>
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
              }}
            >
              {groups.map((g) => (
                <option
                  key={g.id}
                  value={g.id}
                  style={{
                    backgroundColor: "#020617",
                    color: "#0f172a", // cor do texto no dropdown nativo
                  }}
                >
                  {g.name}
                </option>
              ))}
            </select>
          )}

          {(loadingGroups || loadingGroupActivities) && (
            <span
              style={{
                fontSize: 11,
                color: "#9ca3af",
              }}
            >
              Carregando grupos/atividades...
            </span>
          )}
        </div>

        <p
          style={{
            fontSize: 13,
            color: "#9ca3af",
            margin: 0,
            marginTop: 4,
          }}
        >
          Visão geral do atleta, do grupo selecionado, ranking de pontos e
          evolução dos treinos (minutos de atividade).
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
        }}
      >
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

      {/* Linha 1: Atleta x Grupo (dados Strava) */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Atleta */}
        <div
          style={{
            borderRadius: 18,
            padding: "14px 14px",
            background: "radial-gradient(circle at top, #0f172a, #020617 60%)",
            border: "1px solid rgba(34,197,94,0.35)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "#86efac",
              marginBottom: 4,
              textTransform: "uppercase",
            }}
          >
            {athleteLabel}
            {range === "all" ? " · todo período" : " · período selecionado"}
            {loadingAthlete ? " (carregando...)" : ""}
          </p>
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 2,
            }}
          >
            {athleteDistance.toFixed(1)} km
          </p>
          <p
            style={{
              fontSize: 11,
              color: "#6b7280",
              marginBottom: 8,
            }}
          >
            Distância total em todas as atividades deste atleta no grupo e
            período filtrados (dados Strava).
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              fontSize: 11,
              color: "#9ca3af",
            }}
          >
            <div>
              <div>Tempo em movimento</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#e5e7eb",
                }}
              >
                {formatDuration(athleteMovingTime)}
              </div>
            </div>
            <div>
              <div>Elevação acumulada</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#e5e7eb",
                }}
              >
                {Math.round(athleteElevation)} m
              </div>
            </div>
            <div>
              <div>Atividades</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#e5e7eb",
                }}
              >
                {athleteActivitiesCount}
              </div>
            </div>
          </div>
        </div>

        {/* Grupo */}
        <div
          style={{
            borderRadius: 18,
            padding: "14px 14px",
            background: "radial-gradient(circle at top, #0b1120, #020617 60%)",
            border: "1px solid rgba(59,130,246,0.35)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "#93c5fd",
              marginBottom: 4,
              textTransform: "uppercase",
            }}
          >
            Grupo
            {range === "all" ? " · todo período" : " · período selecionado"}
          </p>
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 2,
            }}
          >
            {groupDistance.toFixed(1)} km
          </p>
          <p
            style={{
              fontSize: 11,
              color: "#6b7280",
              marginBottom: 8,
            }}
          >
            Distância total somando todos os atletas do grupo selecionado (apenas
            quem tem Strava conectado) no período filtrado.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              fontSize: 11,
              color: "#9ca3af",
            }}
          >
            <div>
              <div>Tempo em movimento</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#e5e7eb",
                }}
              >
                {formatDuration(groupMovingTime)}
              </div>
            </div>
            <div>
              <div>Elevação acumulada</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#e5e7eb",
                }}
              >
                {Math.round(groupElevation)} m
              </div>
            </div>
            <div>
              <div>Atividades</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#e5e7eb",
                }}
              >
                {groupActivitiesCount}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RANKING DO GRUPO (user_activities) */}
      <section
        style={{
          borderRadius: 20,
          border: "1px solid rgba(148,163,184,0.35)",
          background:
            "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
          padding: "16px 14px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            alignItems: "baseline",
            marginBottom: 10,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
              }}
            >
              Ranking do grupo
              {range === "all"
                ? " (todo período)"
                : " (dentro do período selecionado)"}
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              Pontuação baseada nos treinos do grupo (user_activities):
              atividades (exceto caminhada) = 100 pts/h, caminhada = 15 pts/h.
            </p>
          </div>
        </div>

        {sortedRanking.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              marginTop: 8,
            }}
          >
            Nenhuma atividade encontrada nesse período para montar o ranking
            deste grupo.
          </p>
        ) : (
          <div
            style={{
              width: "100%",
              overflowX: "auto",
              maxHeight: 360, // ~12 linhas, depois scroll
              overflowY: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                minWidth: 420,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(55,65,81,0.8)",
                    color: "#9ca3af",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "8px 4px", width: 40 }}>Pos.</th>
                  <th style={{ padding: "8px 4px" }}>
                    <button
                      type="button"
                      onClick={() => handleRankingSort("label")}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "inherit",
                        font: "inherit",
                        padding: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        cursor: "pointer",
                      }}
                    >
                      <span>Atleta</span>
                      <span
                        style={{
                          fontSize: 10,
                        }}
                      >
                        {renderSortIcon("label")}
                      </span>
                    </button>
                  </th>
                  <th
                    style={{
                      padding: "8px 4px",
                      textAlign: "right",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleRankingSort("totalPoints")}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "inherit",
                        font: "inherit",
                        padding: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        cursor: "pointer",
                      }}
                    >
                      <span>Pontos</span>
                      <span
                        style={{
                          fontSize: 10,
                        }}
                      >
                        {renderSortIcon("totalPoints")}
                      </span>
                    </button>
                  </th>
                  <th
                    style={{
                      padding: "8px 4px",
                      textAlign: "right",
                    }}
                  >
                    Horas (total)
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRanking.map((r, index) => (
                  <tr
                    key={r.userId}
                    style={{
                      borderBottom: "1px solid rgba(31,41,55,0.7)",
                      background: r.isCurrent
                        ? "linear-gradient(to right, rgba(34,197,94,0.18), transparent)"
                        : "transparent",
                    }}
                  >
                    <td
                      style={{
                        padding: "8px 4px",
                        whiteSpace: "nowrap",
                        fontWeight: r.isCurrent ? 700 : 500,
                      }}
                    >
                      #{index + 1}
                    </td>
                    <td
                      style={{
                        padding: "8px 4px",
                        maxWidth: 220,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: r.isCurrent ? 700 : 500,
                      }}
                    >
                      {r.label}
                      {r.isCurrent && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 10,
                            padding: "1px 6px",
                            borderRadius: 999,
                            border: "1px solid rgba(34,197,94,0.6)",
                            color: "#bbf7d0",
                          }}
                        >
                          Você
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "8px 4px",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                        fontWeight: r.isCurrent ? 700 : 500,
                      }}
                    >
                      {r.totalPoints}
                    </td>
                    <td
                      style={{
                        padding: "8px 4px",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                        color: "#9ca3af",
                      }}
                    >
                      {r.totalHours.toFixed(1)} h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Gráfico ÚNICO: Evolução dos treinos (user_activities) */}
      <section
        style={{
          borderRadius: 20,
          border: "1px solid rgba(148,163,184,0.35)",
          background:
            "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
          padding: "16px 14px",
          marginBottom: 24,
        }}
      >
        <DashboardCharts evolutionData={evolutionData} />
      </section>

      {/* Últimas atividades (Strava) */}
      <section
        style={{
          borderRadius: 20,
          border: "1px solid rgba(148,163,184,0.35)",
          background:
            "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
          padding: "16px 14px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            alignItems: "baseline",
            marginBottom: 10,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
              }}
            >
              Últimas atividades
              {range === "all"
                ? " (todo período)"
                : " (dentro do período selecionado)"}
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              As 10 atividades mais recentes (Strava) do grupo selecionado
              dentro do filtro atual.
            </p>
          </div>
        </div>

        {lastActivities.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              marginTop: 8,
            }}
          >
            Nenhuma atividade Strava encontrada nesse período para o grupo
            selecionado.
          </p>
        ) : (
          <div
            style={{
              width: "100%",
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                minWidth: 520,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(55,65,81,0.8)",
                    color: "#9ca3af",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "8px 4px" }}>Data</th>
                  <th style={{ padding: "8px 4px" }}>Atividade</th>
                  <th style={{ padding: "8px 4px" }}>Tipo</th>
                  <th style={{ padding: "8px 4px", textAlign: "right" }}>
                    Distância
                  </th>
                  <th style={{ padding: "8px 4px", textAlign: "right" }}>
                    Tempo
                  </th>
                  <th style={{ padding: "8px 4px", textAlign: "right" }}>
                    Ritmo
                  </th>
                </tr>
              </thead>
              <tbody>
                {lastActivities.map((a) => (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom: "1px solid rgba(31,41,55,0.7)",
                    }}
                  >
                    <td style={{ padding: "8px 4px", whiteSpace: "nowrap" }}>
                      {formatDate(a.start_date)}
                    </td>
                    <td
                      style={{
                        padding: "8px 4px",
                        maxWidth: 220,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.name ?? "-"}
                    </td>
                    <td style={{ padding: "8px 4px" }}>
                      {a.sport_type ?? a.type ?? "-"}
                    </td>
                    <td
                      style={{
                        padding: "8px 4px",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {metersToKm(a.distance).toFixed(2)} km
                    </td>
                    <td
                      style={{
                        padding: "8px 4px",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDuration(a.moving_time)}
                    </td>
                    <td
                      style={{
                        padding: "8px 4px",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatPace(a.moving_time, a.distance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
