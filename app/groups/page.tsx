// app/groups/page.tsx

import Link from "next/link";
import { trainingGroups, type TrainingGroup } from "./groups-data";

export const dynamic = "force-static";

export default function GroupsPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <header style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              marginBottom: 8,
            }}
          >
            Grupos de treino
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            Escolha o grupo que melhor se conecta com o seu momento de treino.
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {trainingGroups.map((group: TrainingGroup) => (
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
                  borderRadius: 20,
                  border: "1px solid rgba(30,64,175,0.7)",
                  background:
                    "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
                  padding: "16px 18px",
                  minHeight: 180,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 18px 45px rgba(15,23,42,0.8)",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      margin: 0,
                      marginBottom: 8,
                    }}
                  >
                    {group.title}
                  </h2>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#cbd5f5",
                      lineHeight: 1.5,
                      margin: 0,
                      marginBottom: 10,
                    }}
                  >
                    {group.shortDescription}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      margin: 0,
                    }}
                  >
                    Desafio de 30 dias incluso
                  </p>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "#22c55e",
                  }}
                >
                  <span>Ver detalhes</span>
                  <span>➜</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
