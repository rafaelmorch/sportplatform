// app/groups/page.tsx

import Link from "next/link";
import BottomNavbar from "@/components/BottomNavbar";
import { trainingGroups } from "./groups-data";

export const dynamic = "force-dynamic";

export default function GroupsPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "80px", // espaço pro BottomNavbar
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
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
            Escolha um grupo que combine com seu objetivo. Ao entrar, seus
            treinos passam a contar no ranking daquela comunidade.
          </p>
        </header>

        {/* Lista de grupos */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
            marginBottom: 24,
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
                  borderRadius: 18,
                  border: "1px solid rgba(51,65,85,0.9)",
                  background:
                    "radial-gradient(circle at top, #020617, #020617 60%, #000000 100%)",
                  padding: "14px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  height: "100%",
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  Grupo de treino
                </p>
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  {group.name}
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: "#9ca3af",
                    margin: 0,
                  }}
                >
                  {group.shortDescription}
                </p>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "#a5b4fc",
                  }}
                >
                  Toque para ver o plano de 12 semanas e entrar na comunidade.
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
