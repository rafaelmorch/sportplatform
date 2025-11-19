// app/groups/page.tsx

import Link from "next/link";
import { trainingGroups } from "./groups-data";

export default function GroupsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "24px",
      }}
    >
      <header style={{ marginBottom: "24px" }}>
        <p
          style={{
            fontSize: "12px",
            color: "#a5b4fc",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "4px",
          }}
        >
          Comunidades de treino
        </p>

        <h1 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "8px" }}>
          Escolha seu grupo de treino
        </h1>

        <p style={{ color: "#94a3b8", maxWidth: "720px", fontSize: "14px" }}>
          Grupos pensados para perfis diferentes de atleta: iniciantes, maratonistas,
          triatletas, foco em peso, performance em 5K e 10K. Você pode entrar em
          mais de um grupo dependendo da sua fase de treino.
        </p>
      </header>

      <main>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          {trainingGroups.map((group) => (
            <Link key={group.slug} href={`/groups/${group.slug}`}>
              <div
                style={{
                  borderRadius: "14px",
                  border: "1px solid #1e293b",
                  background:
                    "radial-gradient(circle at top left, #0f172a, #020617)",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "border-color 0.15s ease, transform 0.15s ease",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    color: "#a5b4fc",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "6px",
                  }}
                >
                  {group.level}
                </p>

                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  {group.title}
                </h2>

                <p
                  style={{
                    fontSize: "13px",
                    color: "#9ca3af",
                    marginBottom: "8px",
                  }}
                >
                  {group.subtitle}
                </p>

                <p
                  style={{
                    fontSize: "12px",
                    color: "#cbd5e1",
                  }}
                >
                  {group.description}
                </p>

                <p
                  style={{
                    marginTop: "10px",
                    fontSize: "12px",
                    color: "#22c55e",
                  }}
                >
                  Ver plano de 30 dias →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
