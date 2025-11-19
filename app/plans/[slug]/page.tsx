import { notFound } from "next/navigation";
import { trainingPlans } from "../plans-data";
import { trainingGroups } from "../../groups/groups-data";

interface PlanDetailPageProps {
  params: {
    slug: string;
  };
}

export default function PlanDetailPage({ params }: PlanDetailPageProps) {
  const plan = trainingPlans.find((p) => p.slug === params.slug);

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
      }}
    >
      {/* Cabeçalho */}
      <header style={{ marginBottom: "24px" }}>
        <p
          style={{
            fontSize: "12px",
            color: "#a5b4fc",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}
        >
          Plano de treino • {plan.level}
        </p>

        <h1 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "4px" }}>
          {plan.title}
        </h1>

        <p style={{ color: "#94a3b8", marginBottom: "8px" }}>
          {plan.subtitle}
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
            marginTop: "8px",
          }}
        >
          <p style={{ fontSize: "22px", fontWeight: 700 }}>
            ${plan.pricePerMonth}
            <span style={{ fontSize: "12px", color: "#9ca3af" }}> / mês</span>
          </p>

          <p style={{ fontSize: "13px", color: "#9ca3af" }}>
            Duração: {plan.durationWeeks} semanas
          </p>
        </div>

        {/* BOTÃO → CHECKOUT */}
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

        {/* Grupos recomendados */}
        <div style={{ marginTop: "16px" }}>
          <p style={{ fontSize: "12px", color: "#9ca3af" }}>
            Indicado para os grupos:
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {groups.map((g) => (
              <a key={g.slug} href={`/groups/${g.slug}`}>
                <span
                  style={{
                    fontSize: "11px",
                    padding: "4px 8px",
                    borderRadius: "999px",
                    border: "1px solid #334155",
                    background: "#020617",
                  }}
                >
                  {g.title}
                </span>
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* Conteúdo do plano */}
      <section>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
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
    </div>
  );
}
