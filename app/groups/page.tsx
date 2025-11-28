// app/groups/page.tsx

import Link from "next/link";
import {
  trainingGroups,
  type TrainingGroupSlug,
  type TrainingGroup,
} from "./groups-data";
import { supabaseAdmin } from "@/lib/supabase";

async function getMemberCountForSlug(
  slug: TrainingGroupSlug
): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("challenge_participants")
    .select("*", { count: "exact", head: true })
    .eq("group_slug", slug);

  if (error) {
    console.error("Erro ao contar participantes do grupo:", error);
    return 0;
  }

  return count ?? 0;
}

export default async function GroupsPage() {
  // Busca contagem real de participantes para cada grupo
  const counts = await Promise.all(
    trainingGroups.map(async (group) => ({
      slug: group.slug,
      count: await getMemberCountForSlug(group.slug),
    }))
  );

  const countsMap = new Map<string, number>();
  counts.forEach(({ slug, count }) => countsMap.set(slug, count));

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "80px", // espaço pro BottomNavbar fixo
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {/* Header da página */}
        <header
          style={{
            marginBottom: 20,
            display: "flex",
            flexDirection: "column",
            gap: 8,
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
            Comunidades
          </p>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Grupos de treino
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            Escolha o grupo que mais combina com o seu momento e participe da
            comunidade para acumular pontos, registrar treinos e acompanhar sua
            evolução.
          </p>
        </header>

        {/* Grid de grupos */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {trainingGroups.map((group: TrainingGroup) => {
            const memberCount = countsMap.get(group.slug) ?? 0;
            const participantesLabel =
              memberCount === 1 ? "participante" : "participantes";

            return (
              <Link
                key={group.slug}
                href={`/groups/${group.slug}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    borderRadius: 18,
                    border: "1px solid rgba(55,65,81,0.9)",
                    background:
                      "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
                    padding: "14px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    cursor: "pointer",
                    transition: "transform 0.15s ease-out, box-shadow 0.15s ease-out, border-color 0.15s ease-out",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform =
                      "translateY(-2px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "0 10px 25px rgba(15,23,42,0.8)";
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "rgba(34,197,94,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform =
                      "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "none";
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "rgba(55,65,81,0.9)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          margin: 0,
                          marginBottom: 4,
                        }}
                      >
                        {group.title}
                      </h2>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#9ca3af",
                          margin: 0,
                        }}
                      >
                        {group.shortDescription}
                      </p>
                    </div>

                    <div
                      style={{
                        padding: "4px 8px",
                        borderRadius: 999,
                        background:
                          "radial-gradient(circle at top, #22c55e33, transparent)",
                        border: "1px solid rgba(34,197,94,0.7)",
                        fontSize: 11,
                        color: "#bbf7d0",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {memberCount} {participantesLabel}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        margin: 0,
                      }}
                    >
                      Clique para ver detalhes do grupo e o plano sugerido.
                    </p>
                    <span
                      style={{
                        fontSize: 18,
                        lineHeight: 1,
                      }}
                    >
                      →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
