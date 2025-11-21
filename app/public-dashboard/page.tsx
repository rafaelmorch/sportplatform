// app/public-dashboard/page.tsx
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

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

async function getActivities(): Promise<StravaActivity[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("strava_activities")
      .select(
        `
        id,
        athlete_id,
        name,
        type,
        sport_type,
        start_date,
        distance,
        moving_time,
        total_elevation_gain
      `
      )
      .order("start_date", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Erro ao buscar atividades (public-dashboard):", error);
      return [];
    }

    return (data ?? []) as StravaActivity[];
  } catch (err) {
    console.error("Erro inesperado (public-dashboard):", err);
    return [];
  }
}

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

export default async function PublicDashboardPage() {
  const activities = await getActivities();

  const totalDistance = activities.reduce(
    (sum, a) => sum + metersToKm(a.distance),
    0
  );
  const totalMovingTime = activities.reduce(
    (sum, a) => sum + (a.moving_time ?? 0),
    0
  );
  const totalElevation = activities.reduce(
    (sum, a) => sum + (a.total_elevation_gain ?? 0),
    0
  );
  const totalActivities = activities.length;
  const uniqueAthletes = new Set(activities.map((a) => a.athlete_id)).size;

  const lastActivities = activities.slice(0, 8);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#64748b",
              margin: 0,
            }}
          >
            SportPlatform · Visão pública
          </p>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Painel de Performance do Grupo
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            Estatísticas gerais do grupo de atletas conectados ao SportPlatform
            via Strava. Ideal para apresentar o potencial da plataforma em
            eventos, reuniões ou para investidores.
          </p>
        </header>

        {/* Cards resumo do grupo */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              borderRadius: "18px",
              padding: "14px 14px",
              background:
                "radial-gradient(circle at top, #0f172a, #020617 60%)",
              border: "1px solid rgba(34,197,94,0.35)",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "#86efac",
                marginBottom: 4,
              }}
            >
              Distância total do grupo
            </p>
            <p
              style={{
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 2,
              }}
            >
              {totalDistance.toFixed(1)} km
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#6b7280",
              }}
            >
              Soma da distância de todos os atletas conectados.
            </p>
          </div>

          <div
            style={{
              borderRadius: "18px",
              padding: "14px 14px",
              background:
                "radial-gradient(circle at top, #0f172a, #020617 60%)",
              border: "1px solid rgba(59,130,246,0.35)",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "#93c5fd",
                marginBottom: 4,
              }}
            >
              Tempo em movimento (grupo)
            </p>
            <p
              style={{
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 2,
              }}
            >
              {formatDuration(totalMovingTime)}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#6b7280",
              }}
            >
              Total de horas de treino acumuladas pelo grupo.
            </p>
          </div>

          <div
            style={{
              borderRadius: "18px",
              padding: "14px 14px",
              background:
                "radial-gradient(circle at top, #0f172a, #020617 60%)",
              border: "1px solid rgba(248,113,113,0.35)",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "#fca5a5",
                marginBottom: 4,
              }}
            >
              Elevação acumulada
            </p>
            <p
              style={{
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 2,
              }}
            >
              {Math.round(totalElevation)} m
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#6b7280",
              }}
            >
              Ganho de altitude total em todas as atividades do grupo.
            </p>
          </div>

          <div
            style={{
              borderRadius: "18px",
              padding: "14px 14px",
              background:
                "radial-gradient(circle at top, #0f172a, #020617 60%)",
              border: "1px solid rgba(148,163,184,0.35)",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "#e5e7eb",
                marginBottom: 4,
              }}
            >
              Atletas conectados
            </p>
            <p
              style={{
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 2,
              }}
            >
              {uniqueAthletes}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#6b7280",
              }}
            >
              Perfis Strava vinculados ao SportPlatform.
            </p>
          </div>
        </section>

        {/* Tabela de últimas atividades (grupo) */}
        <section
          style={{
            borderRadius: "20px",
            border: "1px solid rgba(148,163,184,0.35)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: "16px 14px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "8px",
              alignItems: "baseline",
              marginBottom: "10px",
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
                Últimas atividades do grupo
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  margin: 0,
                }}
              >
                Atividades mais recentes sincronizadas pelos atletas conectados.
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
              Nenhuma atividade encontrada. Assim que os atletas conectarem o
              Strava, os dados aparecerão aqui.
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
                    <th style={{ padding: "8px 4px" }}>Atleta</th>
                    <th style={{ padding: "8px 4px" }}>Atividade</th>
                    <th style={{ padding: "8px 4px" }}>Tipo</th>
                    <th style={{ padding: "8px 4px", textAlign: "right" }}>
                      Distância
                    </th>
                    <th style={{ padding: "8px 4px", textAlign: "right" }}>
                      Tempo
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
                      <td style={{ padding: "8px 4px" }}>{a.athlete_id}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
