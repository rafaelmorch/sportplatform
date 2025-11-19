"use client";

import Link from "next/link";
import { trainingPlans } from "./plans-data";
import { trainingGroups } from "../groups/groups-data";

export default function PlansPage() {
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
          Treinos Pagos – SportPlatform
        </h1>
        <p style={{ color: "#94a3b8", maxWidth: "640px" }}>
          Escolha um plano de treino estruturado de acordo com o seu objetivo.
          Cada plano é conectado a um ou mais grupos de treino.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "18px",
        }}
      >
        {trainingPlans.map((plan) => {
          const groups = trainingGroups.filter((g) =>
            plan.recommendedGroups.includes(g.slug)
          );

          return (
            <div
              key={plan.slug}
              style={{
                padding: "18px",
                borderRadius: "14px",
                border: "1px solid #1e293b",
                background:
                  "radial-gradient(circle at top, #0f172a, #020617 55%)",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "#a5b4fc",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "4px",
                }}
              >
                {plan.level} • {plan.durationWeeks} semanas
              </p>

              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  marginBottom: "4px",
                }}
              >
                {plan.title}
              </h2>

              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "14px",
                  marginBottom: "8px",
                }}
              >
                {plan.subtitle}
              </p>

              <p
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  marginBottom: "4px",
                }}
              >
                ${plan.pricePerMonth}
                <span
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
                    marginLeft: "4px",
                  }}
                >
                  / mês
                </span>
              </p>

              <p
                style={{
                  fontSize: "13px",
                  color: "#cbd5e1",
                  marginBottom: "12px",
                }}
              >
                {plan.description}
              </p>

              {/* Grupos recomendados */}
              <div style={{ marginBottom: "10px" }}>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
                    marginBottom: "4px",
                  }}
                >
                  Indicado para os grupos:
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {groups.map((g) => (
                    <Link key={g.slug} href={`/groups/${g.slug}`}>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "4px 8px",
                          borderRadius: "999px",
                          border: "1px solid #334155",
                          background: "#020617",
                          cursor: "pointer",
                        }}
                      >
                        {g.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <ul
                style={{
                  listStyle: "disc",
                  paddingLeft: "18px",
                  marginBottom: "12px",
                  fontSize: "13px",
                  color: "#e5e7eb",
                }}
              >
                {plan.highlights.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: "2px" }}>
                    {item}
                  </li>
                ))}
              </ul>

              {/* BOTÕES COMPLETOS */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "4px",
                  flexWrap: "wrap",
                }}
              >
                {/* VER DETALHES */}
                <Link
                  href={`/plans/${plan.slug}`}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "999px",
                    border: "1px solid #334155",
                    background: "transparent",
                    color: "#e5e7eb",
                    fontSize: "13px",
                    fontWeight: 500,
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  Ver detalhes
                </Link>

                {/* QUERO ESTE TREINO → CHECKOUT */}
                <Link
                  href={`/checkout/${plan.slug}`}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "999px",
                    border: "none",
                    background: "#22c55e",
                    color: "#020617",
                    fontSize: "13px",
                    fontWeight: 700,
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  Quero este treino
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
