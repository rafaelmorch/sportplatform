// app/plans/[slug]/page.tsx

import { notFound } from "next/navigation";
import { trainingPlans } from "../plans-data";
import { trainingGroups } from "../../groups/groups-data";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PlanDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const plan = trainingPlans.find((p) => p.slug === slug);

  if (!plan) {
    notFound();
  }

  const groups = trainingGroups.filter((g) =>
    plan.recommendedGroups.includes(g.slug)
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <header style={{ marginBottom: "4px" }}>
        <p
          style={{
            fontSize: "12px",
            color: "#a5b4fc",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "4px",
          }}
        >
          Plano de treino • {plan.level}
        </p>

        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "4px",
          }}
        >
          {plan.title}
        </h1>

        <p
          style={{
            color: "#94a3b8",
            marginBottom: "8px",
            fontSize: "14px",
          }}
        >
          {plan.subtitle}
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            marginTop: "8px",
          }}
        >
          <p
            style={{
              fontSize: "22px",
              fontWeight: 700,
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
              {" "}
              / mês
            </span>
          </p>

          <p
            style={{
              fontSize: "13px",
              color: "#9ca3af",
            }}
          >
            Duração: {plan.durationWeeks} semanas
          </p>
        </div>

        <div style={{ marginTop: "14px" }}>
          <a
            href={`/checkout/${plan.slug}`}
            style={{
              display: "inline-block",
              padding: "9px 16px",
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
            Contratar este treino
          </a>
        </div>

        <div style={{ marginTop: "16px" }}>
          <p
            style={{
              fontSize: "12px",
              color: "#9ca3af",
              marginBottom: "4px",
            }}
          >
            Indicado para os grupos:
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
            }}
          >
            {groups.map((g) => (
              <a key={g.slug} href={`/groups/${g.slug}`}>
                <span
                  style={{
                    fontSize: "11px",
                    padding: "4px 8px",
                    borderRadius: "999px",
                    border: "1px solid #334155",
                    background: "#020617",
                    textDecoration: "none",
                  }}
                >
                  {g.title}
                </span>
              </a>
            ))}
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: "800px",
        }}
      >
        <section
          style={{
            borderRadius: "14px",
            border: "1px solid #1e293b",
            background: "#020617",
            padding: "16px",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            O que está incluído
          </h2>

          <ul
            style={{
              listStyle: "disc",
              paddingLeft: "18px",
              fontSize: "13px",
              color: "#e5e7eb",
            }}
          >
            {plan.highlights.map((item, idx) => (
              <li key={idx} style={{ marginBottom: "4px" }}>
                {item}
              </li>
            ))}
          </ul>

          <p
            style={{
              marginTop: "16px",
              fontSize: "13px",
              color: "#cbd5e1",
              maxWidth: "640px",
            }}
          >
            Após contratar, você recebe recomendações personalizadas, ajustes do
            treinador e acesso ao planejamento completo semana a semana.
          </p>
        </section>
      </main>
    </div>
  );
}
