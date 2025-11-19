// app/groups/page.tsx
"use client";

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
        <h1 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "4px" }}>
          Grupos de Treino – SportPlatform
        </h1>
        <p style={{ color: "#94a3b8", maxWidth: "640px" }}>
          Escolha um grupo para participar. Cada grupo possui um plano de{" "}
          <strong>30 dias de desafios</strong> com treinos progressivos
          específicos para o objetivo do atleta.
        </p>
      </header>

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
                padding: "16px",
                borderRadius: "14px",
                border: "1px solid #1e293b",
                background:
                  "radial-gradient(circle at top, #0f172a, #020617 55%)",
                cursor: "pointer",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "#a5b4fc",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {group.level} • {group.focus}
              </p>
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  marginBottom: "4px",
                }}
              >
                {group.title}
              </h2>
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "14px",
                  marginBottom: "8px",
                }}
              >
                {group.subtitle}
              </p>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: "13px",
                  marginBottom: "10px",
                }}
              >
                {group.description}
              </p>
              <span
                style={{
                  display: "inline-block",
                  marginTop: "4px",
                  fontSize: "13px",
                  color: "#22c55e",
                }}
              >
                Ver plano de 30 dias →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
