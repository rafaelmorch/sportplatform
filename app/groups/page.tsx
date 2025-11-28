// app/groups/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  trainingGroups,
  type TrainingGroup,
} from "./groups-data";

export default function GroupsPage() {
  const router = useRouter();

  const handleOpenGroup = (slug: string) => {
    router.push(`/groups/${slug}`);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "#e5e7eb",
      }}
    >
      {/* NAVBAR SIMPLES NO TOPO */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: "1px solid rgba(31,41,55,0.8)",
          background:
            "linear-gradient(to right, #020617, #020617 40%, #020617ee)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                border: "2px solid #22c55e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "#22c55e",
              }}
            >
              SP
            </span>
            <span
              style={{
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              SportPlatform
            </span>
          </div>

          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 13,
            }}
          >
            <Link
              href="/dashboard"
              style={{
                color: "#9ca3af",
                textDecoration: "none",
              }}
            >
              Dashboard
            </Link>
            <Link
              href="/events"
              style={{
                color: "#9ca3af",
                textDecoration: "none",
              }}
            >
              Eventos
            </Link>
            <Link
              href="/groups"
              style={{
                color: "#e5e7eb",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Grupos
            </Link>
          </nav>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "20px 16px 32px",
        }}
      >
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
              marginBottom: 6,
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

        {/* GRID DE CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {trainingGroups.map((group: TrainingGroup) => (
            <button
              key={group.slug}
              type="button"
              onClick={() => handleOpenGroup(group.slug)}
              style={{
                textAlign: "left",
                borderRadius: 18,
                border: "1px solid rgba(31,41,55,0.9)",
                background:
                  "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
                padding: "16px 14px 14px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "transform 0.12s ease-out, box-shadow 0.12s ease-out, border-color 0.12s ease-out",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 18px 35px rgba(15,23,42,0.9)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(52,211,153,0.9)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(31,41,55,0.9)";
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "#22c55e",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  margin: 0,
                }}
              >
                Grupo de treino
              </p>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                {group.title}
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "#d1d5db",
                  margin: 0,
                  marginBottom: 6,
                }}
              >
                {group.shortDescription}
              </p>

              <p
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  margin: 0,
                  marginTop: 4,
                }}
              >
                Desafio de 30 dias incluso
              </p>

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: "#22c55e",
                  }}
                >
                  Ver detalhes →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
