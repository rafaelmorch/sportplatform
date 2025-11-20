// app/groups/page.tsx

import Link from "next/link";
import { trainingGroups } from "./groups-data";

export default function GroupsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#f8fafc",
        padding: "24px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      {/* HEADER */}
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            marginBottom: "6px",
            lineHeight: 1.2,
          }}
        >
          Escolha seu Grupo de Treino
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "#94a3b8",
            lineHeight: 1.5,
            maxWidth: "650px",
          }}
        >
          Cada grupo possui um programa estruturado automaticamente, baseado no
          seu objetivo — iniciantes, maratona, perda de peso, performance e
          triathlon. Comece agora mesmo seu desafio.
        </p>
      </div>

      {/* GRID DE GRUPOS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "16px",
        }}
      >
        {trainingGroups.map((group) => (
          <Link key={group.slug} href={`/groups/${group.slug}`}>
            <div
              style={{
                padding: "20px",
                borderRadius: "16px",
                background:
                  "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                border: "1px solid #1e293b",
                cursor: "pointer",
                transition: "transform 0.15s ease",
              }}
            >
              {/* TEXTO SUPERIOR */}
              <p
                style={{
                  fontSize: "11px",
                  color: "#38bdf8",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                {group.level}
              </p>

              {/* TÍTULO */}
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  marginBottom: "6px",
                  lineHeight: 1.2,
                }}
              >
                {group.title}
              </h2>

              {/* SUBTÍTULO */}
              <p
                style={{
                  fontSize: "13px",
                  color: "#cbd5e1",
                  marginBottom: "12px",
                }}
              >
                {group.subtitle}
              </p>

              {/* DESCRIÇÃO */}
              <p
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                  lineHeight: 1.5,
                  marginBottom: "14px",
                }}
              >
                {group.description}
              </p>

              {/* BOTÃO */}
              <div
                style={{
                  marginTop: "8px",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "10px 16px",
                    borderRadius: "999px",
                    background: "#22c55e",
                    color: "#0f172a",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  Acessar Programa →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* RESPONSIVIDADE */}
      <style>
        {`
          @media (min-width: 640px) {
            div[data-grid] {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (min-width: 900px) {
            div[data-grid] {
              grid-template-columns: repeat(3, 1fr);
            }
          }
        `}
      </style>
    </div>
  );
}
