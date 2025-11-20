// app/groups/page.tsx
import Link from "next/link";
import { trainingGroups } from "./groups-data";
import BottomNavbar from "@/components/BottomNavbar";

export default function GroupsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <main
        style={{
          flex: 1,
          padding: "16px",
          paddingBottom: "72px", // espaço para a bottom navbar
        }}
      >
        <div
          style={{
            maxWidth: "1024px",
            margin: "0 auto",
          }}
        >
          <header
            style={{
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  marginBottom: "4px",
                }}
              >
                Grupos de treino
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                }}
              >
                Escolha o grupo que melhor se conecta com o seu momento de
                treino.
              </p>
            </div>
          </header>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "14px",
            }}
          >
            {trainingGroups.map((group: any) => (
              <Link
                key={group.slug}
                href={`/groups/${group.slug}`}
                style={{ textDecoration: "none" }}
              >
                <article
                  style={{
                    borderRadius: "16px",
                    border: "1px solid #1e293b",
                    background:
                      "radial-gradient(circle at top left, #0f172a, #020617)",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontSize: "16px",
                          fontWeight: 700,
                          marginBottom: "4px",
                          color: "#e5e7eb",
                        }}
                      >
                        {group.title}
                      </h2>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#cbd5e1",
                        }}
                      >
                        {group.shortDescription || group.description}
                      </p>
                    </div>
                    {group.levelLabel && (
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "4px 8px",
                          borderRadius: "999px",
                          border: "1px solid #1e293b",
                          color: "#a5b4fc",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {group.levelLabel}
                      </span>
                    )}
                  </div>

                  {Array.isArray(group.tags) && group.tags.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        marginTop: "4px",
                      }}
                    >
                      {group.tags.map((tag: string) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: "11px",
                            padding: "3px 8px",
                            borderRadius: "999px",
                            background: "#020617",
                            border: "1px solid #1f2937",
                            color: "#9ca3af",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "11px",
                      color: "#64748b",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>Desafio de 30 dias incluso</span>
                    <span>Ver detalhes ⟶</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <BottomNavbar />
    </div>
  );
}
