// app/plans/page.tsx
import Link from "next/link";
import { trainingPlans } from "./plans-data";
import BottomNavbar from "@/components/BottomNavbar";

export default function PlansPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <main
        style={{
          flex: 1,
          padding: "16px",
          paddingBottom: "72px", // espaço para navbar
        }}
      >
        <div
          style={{
            maxWidth: "1024px",
            margin: "0 auto",
          }}
        >
          <header
            style={{
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  marginBottom: "4px",
                }}
              >
                Planos de treino
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                }}
              >
                Programas estruturados para diferentes objetivos e níveis.
              </p>
            </div>
          </header>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "14px",
            }}
          >
            {trainingPlans.map((plan: any) => (
              <Link
                key={plan.slug}
                href={`/plans/${plan.slug}`}
                style={{ textDecoration: "none" }}
              >
                <article
                  style={{
                    borderRadius: "16px",
                    border: "1px solid #1e293b",
                    background:
                      "radial-gradient(circle at top left, #0f172a, #020617)",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontSize: "16px",
                          fontWeight: 700,
                          marginBottom: "4px",
                        }}
                      >
                        {plan.title}
                      </h2>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#cbd5e1",
                        }}
                      >
                        {plan.shortDescription || plan.description}
                      </p>
                    </div>
                    {plan.priceLabel && (
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#4ade80",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {plan.priceLabel}
                      </span>
                    )}
                  </div>

                  <p
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                    }}
                  >
                    {plan.durationLabel
                      ? `Duração: ${plan.durationLabel}`
                      : "Plano com progressão estruturada"}
                  </p>

                  {Array.isArray(plan.recommendedFor) &&
                    plan.recommendedFor.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                          marginTop: "4px",
                        }}
                      >
                        {plan.recommendedFor.map((g: string) => (
                          <span
                            key={g}
                            style={{
                              fontSize: "11px",
                              padding: "3px 8px",
                              borderRadius: "999px",
                              background: "#020617",
                              border: "1px solid #1f2937",
                              color: "#9ca3af",
                            }}
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}

                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "11px",
                      color: "#64748b",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>Ver detalhes do plano</span>
                    <span>⟶</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <BottomNavbar />
    </div>
  );
}
