// app/groups/[slug]/page.tsx
import Link from "next/link";
import { trainingGroups } from "../groups-data";
import { trainingPlans } from "../../plans/plans-data";
import BottomNavbar from "@/components/BottomNavbar";

type GroupPageProps = {
  params: { slug: string };
};

// Mapa de planos recomendados por grupo (slug → slugs de planos)
const groupToPlansMap: Record<string, string[]> = {
  "beginners-running": ["starter-5k", "weight-loss-plus"],
  marathon: ["marathon-pro", "premium-10k"],
  triathlon: ["triathlon-complete", "marathon-pro"],
  "weight-loss-running": ["weight-loss-plus", "starter-5k"],
  "performance-5k": ["starter-5k", "premium-10k"],
  "performance-10k": ["premium-10k", "marathon-pro"],
};

function humanizeSlug(slug: string | undefined): string {
  if (!slug) return "Grupo de treino";
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function GroupDetailPage({ params }: GroupPageProps) {
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const group = trainingGroups.find((g) => g.slug === slug);

  if (!group) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "24px 16px 90px",
          background: "radial-gradient(circle at top, #020617, #000000 55%)",
          color: "white",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            marginBottom: "12px",
            letterSpacing: "-0.03em",
          }}
        >
          Grupo não encontrado
        </h1>
        <p
          style={{
            opacity: 0.8,
            maxWidth: "520px",
            marginBottom: "24px",
          }}
        >
          Não encontramos este grupo. Verifique o link ou volte para a lista de
          grupos.
        </p>
        <Link
          href="/groups"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 18px",
            borderRadius: "999px",
            background: "#22c55e",
            color: "#020617",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Voltar para grupos
        </Link>

        <BottomNavbar />
      </main>
    );
  }

  const pageTitle = group.title || humanizeSlug(slug);

  const relatedPlanSlugs = groupToPlansMap[slug] ?? [];
  const relatedPlans = trainingPlans.filter((plan) =>
    relatedPlanSlugs.includes(plan.slug)
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px 16px 90px",
        background:
          "radial-gradient(circle at top, #020617, #020617 40%, #000000 100%)",
        color: "white",
      }}
    >
      {/* Cabeçalho */}
      <header
        style={{
          marginBottom: "20px",
        }}
      >
        <Link
          href="/groups"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "#9ca3af",
            textDecoration: "none",
            marginBottom: "12px",
          }}
        >
          ← Voltar para grupos
        </Link>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 10px",
              borderRadius: "999px",
              border: "1px solid rgba(148, 163, 184, 0.4)",
              fontSize: "11px",
              color: "#e5e7eb",
              width: "fit-content",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.5))",
            }}
          >
            Grupo de treino
          </span>

          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
            }}
          >
            {pageTitle}
          </h1>

          <p
            style={{
              marginTop: "4px",
              fontSize: "14px",
              color: "#cbd5f5",
              maxWidth: "580px",
            }}
          >
            {group.description}
          </p>
        </div>
      </header>

      {/* Card principal do grupo */}
      <section
        style={{
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            borderRadius: "20px",
            padding: "16px",
            background:
              "radial-gradient(circle at top left, #0f172a, #020617 70%)",
            border: "1px solid rgba(31, 41, 55, 0.9)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              color: "#e5e7eb",
              marginBottom: "8px",
            }}
          >
            Este grupo conecta atletas com objetivos similares, compartilhando
            métricas, desafios mensais e evolução dentro da SportPlatform.
          </p>

          <p
            style={{
              fontSize: "12px",
              color: "#9ca3af",
            }}
          >
            Use este grupo como base para acompanhar seus treinos de corrida,
            comparar progresso e manter a consistência ao longo das semanas.
          </p>
        </div>
      </section>

      {/* Planos conectados */}
      <section>
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 700,
            marginBottom: "10px",
          }}
        >
          Planos ideais para quem está neste grupo
        </h2>

        {relatedPlans.length === 0 ? (
          <p
            style={{
              fontSize: "13px",
              color: "#9ca3af",
            }}
          >
            Em breve vamos liberar recomendações automáticas de plano para cada
            grupo.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {relatedPlans.map((plan) => (
              <Link
                key={plan.slug}
                href={`/plans/${plan.slug}`}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: "14px",
                  background:
                    "linear-gradient(135deg, #020617, #020617, #020617)",
                  border: "1px solid rgba(30,64,175,0.7)",
                  textDecoration: "none",
                  color: "white",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    {plan.title}
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      marginTop: "2px",
                    }}
                  >
                    {plan.description}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "20px",
                    color: "#4ade80",
                    marginLeft: "12px",
                  }}
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <BottomNavbar />
    </main>
  );
}
