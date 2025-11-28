// app/groups/page.tsx

import Link from "next/link";
import BottomNavbar from "@/components/BottomNavbar";
import { trainingGroups } from "./groups-data";

export default function GroupsPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "80px", // espaço para o BottomNavbar
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* Título da página */}
        <header
          style={{
            marginBottom: 24,
          }}
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Grupos de treino
          </h1>
          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              fontSize: 14,
              color: "#9ca3af",
            }}
          >
            Escolha o grupo que melhor se conecta com o seu momento de treino.
          </p>
        </header>

        {/* Grid de grupos */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
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
                  borderRadius: 20,
                  border: "1px solid rgba(148,163,184,0.35)",
                  background:
                    "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
                  padding: "18px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  height: "100%",
                  cursor: "pointer",
                }}
              >
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {group.name}
                </h2>

                <p
                  style={{
                    fontSize: 13,
                    color: "#d1d5db",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {group.shortDescription}
                </p>

                <p
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    marginTop: 12,
                    marginBottom: 0,
                  }}
                >
                  Desafio de 30 dias incluso
                </p>

                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 12,
                    color: "#22c55e",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>Ver detalhes →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Navbar fixa para página principal de grupos */}
      <BottomNavbar />
    </main>
  );
}
