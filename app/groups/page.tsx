// app/groups/page.tsx
import Link from "next/link";
import { trainingGroups } from "./groups-data";

export default function GroupsPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "20px",
        paddingBottom: "80px",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          Grupos de treino
        </h1>

        <p
          style={{
            fontSize: 14,
            color: "#94a3b8",
            marginBottom: 20,
          }}
        >
          Escolha o grupo que melhor se conecta com o seu momento de treino.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          {trainingGroups.map((group) => (
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
                  borderRadius: 16,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background:
                    "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  transition: "0.2s",
                }}
              >
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {group.name}
                </h2>

                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: "#cbd5e1",
                    margin: 0,
                  }}
                >
                  {group.shortDescription}
                </p>

                <p
                  style={{
                    fontSize: 12,
                    margin: 0,
                    color: "#64748b",
                    marginTop: 6,
                  }}
                >
                  Desafio de 30 dias incluso
                </p>

                <p
                  style={{
                    margin: 0,
                    marginTop: 10,
                    fontSize: 13,
                    color: "#22c55e",
                    fontWeight: 500,
                  }}
                >
                  Ver detalhes →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
