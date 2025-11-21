// app/dashboard/page.tsx
import { createClient } from "@supabase/supabase-js";
import BottomNavbar from "@/components/BottomNavbar";

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
      .limit(1000);

    if (error) {
      console.error("Erro ao buscar atividades do Supabase:", error);
      return [];
    }

    return (data ?? []) as StravaActivity[];
  } catch (err) {
    console.error("Erro inesperado ao buscar atividades:", err);
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

export default async function DashboardPage() {
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

  const lastActivities = activities.slice(0, 10);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "80px", // espaço pro bottom navbar
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
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
            Visão geral das atividades sincronizadas com o Strava. Distâncias,
            tempo em movimento, ritmo médio e elevação total em um único lugar.
          </p>
        </header>

        {/* Cards principais */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
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
              Distância total
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
              Soma de todas as atividades importadas.
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
              Tempo em movimento
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
              Total de horas em treino registrado.
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
              Ganho de altitude em todas as atividades.
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
              Atividades importadas
            </p>
            <p
              style={{
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 2,
              }}
            >
              {totalActivities}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#6b7280",
              }}
            >
              Registros sincronizados com o Strava.
            </p>
          </div>
        </section>

        {/* Últimas atividades */}
        <section
          style={{
            borderRadius: "20px",
            border: "1px solid rgba(148,163,184,0.35)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: "16px 14px",
            marginBottom: "24px",
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
                Últimas atividades
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  margin: 0,
                }}
              >
                As 10 atividades mais recentes importadas do Strava.
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
              Nenhuma atividade encontrada. Conecte o Strava e sincronize seus
              treinos.
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
      </div>

      {/* Bottom Navbar fixo */}
      <BottomNavbar />
    </main>
  );
}
