// components/DashboardClient.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import DashboardCharts from "@/components/DashboardCharts";

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
  eventsSummary: EventsSummary;
};

// Supabase client no navegador (chave pública)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export default function DashboardClient({
  activities,
  eventsSummary,
}: DashboardClientProps) {
  const [range, setRange] = useState<RangeKey>("30d");

  // infos do usuário logado
  const [userAthleteId, setUserAthleteId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  const now = new Date();

  // Carrega perfil do usuário no Supabase (para pegar nome + strava_athlete_id)
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Erro ao buscar usuário:", userError);
          setUserLoaded(true);
          return;
        }

        if (!user) {
          setUserLoaded(true);
          return;
        }

        // Tenta buscar no perfil
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, strava_athlete_id")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Erro ao buscar perfil:", profileError);
        }

        const meta: any = user.user_metadata || {};
        const nameFromProfile = profile?.full_name || null;
        const nameFromMeta = meta.full_name || meta.name || null;

        const finalName =
          nameFromProfile || nameFromMeta || user.email || "Seu desempenho";

        setUserName(finalName);

        // se o perfil tiver strava_athlete_id, usamos para filtrar
        if (profile && typeof profile.strava_athlete_id === "number") {
          setUserAthleteId(profile.strava_athlete_id);
        } else {
          setUserAthleteId(null);
        }
      } catch (err) {
        console.error("Erro inesperado ao carregar perfil:", err);
      } finally {
        setUserLoaded(true);
      }
    };

    loadUserProfile();
  }, []);

  // Se já temos o atleta do usuário, usamos ele.
  // Se não, caímos no primeiro atleta da lista como fallback.
  const fallbackAthleteId = activities[0]?.athlete_id ?? null;
  const currentAthleteId = userAthleteId ?? fallbackAthleteId;

  const athleteLabel =
    userName ??
    (currentAthleteId ? `Seu desempenho` : "Seu desempenho");

  // Filtro de período em cima de TODAS as atividades
  const activitiesInRange = activities.filter((a) =>
    isInRange(a.start_date, range, now)
  );

  // Atleta: apenas atividades do athlete_id vinculado ao usuário (se existir)
  const athleteActivities = currentAthleteId
    ? activitiesInRange.filter((a) => a.athlete_id === currentAthleteId)
    : activitiesInRange;

  // Grupo: todas as atividades no período
  const groupActivities = activitiesInRange;

  // Métricas atleta
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

  // Métricas grupo
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

  // Últimas atividades (grupo)
  const lastActivities = [...groupActivities]
    .sort((a, b) => {
      const da = a.start_date ? new Date(a.start_date).getTime() : 0;
      const db = b.start_date ? new Date(b.start_date).getTime() : 0;
      return db - da;
    })
    .slice(0, 10);

  // Dados para gráficos – atleta
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
        <p
          style={{
            fontSize: 13,
            color: "#9ca3af",
            margin: 0,
          }}
        >
          Visão geral do atleta, do grupo e dos eventos conectados ao
          SportPlatform.
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
            Distância total em todas as atividades deste atleta no período
            filtrado.
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
            Distância total somando todos os atletas do grupo (atividades no
            período filtrado).
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

      {/* Linha 2: Eventos */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            borderRadius: 18,
            padding: "14px 14px",
            background: "radial-gradient(circle at top, #0f172a, #020617 60%)",
            border: "1px solid rgba(34,197,94,0.35)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 12,
                color: "#bbf7d0",
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              Eventos disponíveis
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              Provas abertas para inscrição no SportPlatform.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              {eventsSummary.availableEvents}
            </div>
            <a
              href="/events"
              style={{
                display: "inline-block",
                marginTop: 6,
                fontSize: 11,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(34,197,94,0.7)",
                background: "transparent",
                color: "#bbf7d0",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Ver eventos
            </a>
          </div>
        </div>

        <div
          style={{
            borderRadius: 18,
            padding: "14px 14px",
            background: "radial-gradient(circle at top, #020617, #020617 60%)",
            border: "1px solid rgba(56,189,248,0.5)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 12,
                color: "#7dd3fc",
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              Eventos cadastrados
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              Eventos que você criou ou em que está inscrito.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              {eventsSummary.userEvents}
            </div>
            <a
              href="/my-events"
              style={{
                display: "inline-block",
                marginTop: 6,
                fontSize: 11,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(56,189,248,0.6)",
                background: "transparent",
                color: "#7dd3fc",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Meus eventos
            </a>
          </div>
        </div>
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
              As 10 atividades mais recentes dentro do filtro atual.
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
            Nenhuma atividade encontrada nesse período. Ajuste o filtro ou
            sincronize novos treinos do Strava.
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
