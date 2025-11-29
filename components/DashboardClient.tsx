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

type DailyPoint = {
  date: string;
  label: string;
  distanceKm: number;
  movingTimeMin: number;
};

type SportPoint = {
  sport: string;
  distanceKm: number;
};

type DashboardClientProps = {
  activities: StravaActivity[];
  eventsSummary: EventsSummary; // mantido só por compatibilidade
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
// PONTUAÇÃO DO RANKING
// ---------------------

function isWalkingActivity(a: StravaActivity): boolean {
  const t = (a.sport_type ?? a.type ?? "").toLowerCase();
  return t.includes("walk") || t.includes("hike") || t.includes("caminhada");
}

/**
 * Regra:
 * - Atividades que NÃO são caminhada: 1h = 100 pontos
 * - Caminhada: 1h = 15 pontos
 */
function getActivityPoints(a: StravaActivity): number {
  if (!a.moving_time || a.moving_time <= 0) return 0;
  const hours = a.moving_time / 3600; // segundos → horas
  const rate = isWalkingActivity(a) ? 15 : 100;
  return hours * rate;
}

export default function DashboardClient({
  activities,
}: DashboardClientProps) {
  const [range, setRange] = useState<RangeKey>("30d");

  const [currentAthleteId, setCurrentAthleteId] = useState<number | null>(null);
  const [athleteName, setAthleteName] = useState<string | null>(null);
  const [loadingAthlete, setLoadingAthlete] = useState(true);

  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupAthleteIds, setGroupAthleteIds] = useState<number[] | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);

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

        // 1) vínculos na tabela de membros
        const { data: memberRows, error: memberError } = await supabase
          .from("training_group_members") // tabela de membros
          .select("group_id")
          .eq("user_id", user.id);

        if (memberError) {
          console.error("Erro ao carregar grupos do usuário:", memberError);
        } else if (memberRows && memberRows.length > 0) {
          const groupIds = Array.from(
            new Set(memberRows.map((m: any) => m.group_id as string))
          );

          // 2) dados dos grupos (usa title como nome)
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

  // Carrega os athlete_ids dos membros do grupo selecionado
  useEffect(() => {
    const loadGroupAthletes = async () => {
      if (!selectedGroupId) {
        setGroupAthleteIds(null);
        return;
      }

      try {
        setLoadingGroups(true);

        const { data: members, error: membersError } = await supabase
          .from("training_group_members") // mesma tabela de membros
          .select("user_id")
          .eq("group_id", selectedGroupId);

        if (membersError) {
          console.error("Erro ao carregar membros do grupo:", membersError);
          setGroupAthleteIds(null);
          return;
        }

        const userIds = (members ?? []).map((m: any) => m.user_id);
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
      } finally {
        setLoadingGroups(false);
      }
    };

    if (selectedGroupId) {
      loadGroupAthletes();
    }
  }, [selectedGroupId]);

  const now = new Date();

  const activitiesInRange = activities.filter((a) =>
    isInRange(a.start_date, range, now)
  );

  // Aplica filtro de grupo (somente atletas do grupo selecionado)
  let groupActivities = activitiesInRange;
  if (groupAthleteIds && groupAthleteIds.length > 0) {
    groupActivities = groupActivities.filter(
      (a) =>
        typeof a.athlete_id === "number" &&
        groupAthleteIds.includes(a.athlete_id)
    );
  }

  // Atividades do atleta atual dentro do grupo selecionado
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

  // DAILY / SPORT CHART DATA

  const dailyMap = new Map<
    string,
    { label: string; distanceKm: number; movingTimeMin: number }
  >();

  for (const a of athleteActivities) {
    if (!a.start_date) continue;
    const d = new Date(a.start_date);
    if (Number.isNaN(d.getTime())) continue;

    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });

    const prev = dailyMap.get(key) ?? {
      label,
      distanceKm: 0,
      movingTimeMin: 0,
    };

    dailyMap.set(key, {
      label,
      distanceKm: prev.distanceKm + metersToKm(a.distance),
      movingTimeMin:
        prev.movingTimeMin + (a.moving_time ? a.moving_time / 60 : 0),
    });
  }

  const dailyData: DailyPoint[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, v]) => ({
      date: key,
      label: v.label,
      distanceKm: Number(v.distanceKm.toFixed(2)),
      movingTimeMin: Number(v.movingTimeMin.toFixed(1)),
    }));

  const sportMap = new Map<string, number>();
  for (const a of athleteActivities) {
    const sport = a.sport_type || a.type || "Outro";
    const prev = sportMap.get(sport) ?? 0;
    sportMap.set(sport, prev + metersToKm(a.distance));
  }

  const sportData: SportPoint[] = Array.from(sportMap.entries()).map(
    ([sport, distanceKm]) => ({
      sport,
      distanceKm: Number(distanceKm.toFixed(2)),
    })
  );

  const ranges: { key: RangeKey; label: string }[] = [
    { key: "all", label: "Tudo" },
    { key: "today", label: "Hoje" },
    { key: "7d", label: "7 dias" },
    { key: "30d", label: "30 dias" },
    { key: "6m", label: "6 meses" },
  ];

  const athleteLabel =
    athleteName ??
    (currentAthleteId ? `Atleta ${currentAthleteId}` : "Atleta");

  // RANKING DO GRUPO

  const ranking: RankingEntry[] = (() => {
    const map = new Map<number, { points: number; hours: number }>();

    for (const a of groupActivities) {
      if (!a.athlete_id) continue;

      const pts = getActivityPoints(a);
      const hours = a.moving_time ? a.moving_time / 3600 : 0;

      const prev = map.get(a.athlete_id) ?? { points: 0, hours: 0 };
      map.set(a.athlete_id, {
        points: prev.points + pts,
        hours: prev.hours + hours,
      });
    }

    const entries: RankingEntry[] = Array.from(map.entries()).map(
      ([athleteId, v]) => ({
        athleteId,
        label:
          currentAthleteId === athleteId && athleteName
            ? athleteName
            : `Atleta ${athleteId}`,
        totalPoints: Math.round(v.points),
        totalHours: v.hours,
        isCurrent: athleteId === currentAthleteId,
      })
    );

    entries.sort((a, b) => b.totalPoints - a.totalPoints);
    return entries;
  })();

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
                  style={{ color: "#020617" }}
                >
                  {g.name}
                </option>
              ))}
            </select>
          )}

          {loadingGroups && (
            <span
              style={{
                fontSize: 11,
                color: "#9ca3af",
              }}
            >
              Carregando grupos...
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
          Visão geral do atleta, do grupo selecionado e ranking de pontos (100
          pts/h em atividades, 15 pts/h em caminhadas).
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

      {/* Linha 1: Atleta x Grupo */}
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
            período filtrados.
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
            Distância total somando todos os atletas do grupo selecionado no
            período filtrado.
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

      {/* RANKING DO GRUPO */}
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
              Pontuação: atividades (exceto caminhada) = 100 pts/h, caminhada =
              15 pts/h.
            </p>
          </div>
        </div>

        {ranking.length === 0 ? (
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
                  <th style={{ padding: "8px 4px" }}>Atleta</th>
                  <th style={{ padding: "8px 4px", textAlign: "right" }}>
                    Pontos
                  </th>
                  <th style={{ padding: "8px 4px", textAlign: "right" }}>
                    Horas (total)
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, index) => (
                  <tr
                    key={r.athleteId}
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

      {/* Gráficos */}
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
        <DashboardCharts dailyData={dailyData} sportData={sportData} />
      </section>

      {/* Últimas atividades */}
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
              As 10 atividades mais recentes do grupo selecionado dentro do
              filtro atual.
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
            Nenhuma atividade encontrada nesse período para o grupo
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
