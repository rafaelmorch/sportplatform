// app/plans/[slug]/page.tsx
import { notFound } from "next/navigation";
import { trainingPlans } from "../plans-data";
import { trainingGroups } from "../../groups/groups-data";
import BottomNavbar from "@/components/BottomNavbar";

type PageProps = {
  params: { slug: string };
};

export default function PlanDetailPage({ params }: PageProps) {
  // usar any pra não brigar com o TypeScript
  const plan = trainingPlans.find((p: any) => p.slug === params.slug) as any;

  if (!plan) {
    notFound();
  }

  // também vamos tratar grupos como any aqui
  const relatedGroups = trainingGroups.filter((group: any) =>
    Array.isArray(plan.recommendedFor)
      ? plan.recommendedFor.includes(group.title)
      : false
  );

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
          paddingBottom: "72px",
        }}
      >
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
          }}
        >
          {/* Header */}
          <header
            style={{
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              alignItems: "center",
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
                {plan.title}
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                }}
              >
                {plan.shortDescription || plan.description}
              </p>
            </div>

            <a
              href="/plans"
              style={{
                fontSize: "12px",
                color: "#e5e7eb",
                textDecoration: "none",
              }}
            >
              Ver todos os planos
            </a>
          </header>

          {/* Info principal */}
          <section
            style={{
              borderRadius: "16px",
              border: "1px solid #1e293b",
              background: "#020617",
              padding: "14px",
              marginBottom: "14px",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                color: "#cbd5e1",
                marginBottom: "8px",
              }}
            >
              {plan.longDescription || plan.description}
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                fontSize: "12px",
                color: "#94a3b8",
                marginTop: "4px",
              }}
            >
              {plan.durationLabel && <span>Duração: {plan.durationLabel}</span>}
              {plan.weeklyLoadLabel && (
                <span>Carga semanal: {plan.weeklyLoadLabel}</span>
              )}
            </div>
          </section>

          {/* Recomendações */}
          <section
            style={{
              borderRadius: "16px",
              border: "1px solid #1e293b",
              background:
                "radial-gradient(circle at top, #0f172a, #020617 60%)",
              padding: "14px",
              marginBottom: "14px",
            }}
          >
            <h2
              style={{
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              Indicado para
            </h2>
            {Array.isArray(plan.recommendedFor) && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginBottom: "6px",
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
            <p
              style={{
                fontSize: "12px",
                color: "#94a3b8",
              }}
            >
              O plano foi estruturado para encaixar com diferentes perfis de
              atleta e níveis de experiência, sempre com progressão controlada.
            </p>
          </section>

          {/* Conexão com grupos */}
          {relatedGroups.length > 0 && (
            <section
              style={{
                borderRadius: "16px",
                border: "1px solid #1e293b",
                background: "#020617",
                padding: "14px",
                marginBottom: "14px",
              }}
            >
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  marginBottom: "6px",
                }}
              >
                Grupos conectados a este plano
              </h2>
              <p
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  marginBottom: "8px",
                }}
              >
                Combine o plano de treino com um grupo de atletas com objetivos
                semelhantes para acompanhar evolução, comparativos e desafios
                semanais.
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {relatedGroups.map((group: any) => (
                  <li key={group.slug}>
                    <a
                      href={`/groups/${group.slug}`}
                      style={{
                        fontSize: "13px",
                        color: "#bfdbfe",
                        textDecoration: "none",
                      }}
                    >
                      {group.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Call to action checkout (visual) */}
          <section
            style={{
              borderRadius: "16px",
              border: "1px solid #1e293b",
              background: "#020617",
              padding: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#cbd5e1",
                  }}
                >
                  Investimento
                </p>
                <p
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#4ade80",
                  }}
                >
                  {plan.priceLabel}
                </p>
              </div>
              <a
                href={`/checkout/${plan.slug}`}
                style={{
                  fontSize: "13px",
                  padding: "8px 16px",
                  borderRadius: "999px",
                  background: "#22c55e",
                  color: "#020617",
                  textDecoration: "none",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Continuar para checkout
              </a>
            </div>
          </section>
        </div>
      </main>

      <BottomNavbar />
    </div>
  );
}
