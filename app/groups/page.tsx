// app/groups/page.tsx
"use client";

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
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "20px 16px 32px",
        }}
      >
        {/* TÍTULO E SUBTÍTULO DA PÁGINA */}
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

        {/* GRID DE CARDS DOS GRUPOS */}
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
                transition:
                  "transform 0.12s ease-out, box-shadow 0.12s ease-out, border-color 0.12s ease-out",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = "translateY(-2px)";
                el.style.boxShadow = "0 18px 35px rgba(15,23,42,0.9)";
                el.style.borderColor = "rgba(52,211,153,0.9)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "none";
                el.style.borderColor = "rgba(31,41,55,0.9)";
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
