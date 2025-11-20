// app/plans/[slug]/page.tsx
import BottomNavbar from "@/components/BottomNavbar";

type PlanPageProps = {
  params: { slug: string };
};

type PlanContent = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  durationLabel: string;
  weeklyLoadLabel: string;
  priceLabel: string;
  recommendedFor: string[];
};

const PLANS: Record<string, PlanContent> = {
  "starter-5k": {
    slug: "starter-5k",
    title: "Starter 5K",
    shortDescription: "Plano de 8 semanas para sair do zero e completar 5K com segurança.",
    description:
      "O Starter 5K foi pensado para quem está começando e quer completar seus primeiros 5 quilômetros correndo, sem pressa e sem se machucar. Volume progressivo, treinos curtos e orientação clara em cada semana.",
    durationLabel: "8 semanas",
    weeklyLoadLabel: "3 a 4 sessões por semana",
    priceLabel: "US$ 29",
    recommendedFor: [
      "Beginners Running",
      "Running for Weight Loss",
    ],
  },
  "premium-10k": {
    slug: "premium-10k",
    title: "Premium 10K Performance",
    shortDescription: "Plano para baixar tempo nos 10K com controle de ritmo e intensidade.",
    description:
      "Focado em atletas que já correm 5K ou 10K e querem melhorar tempo. Estrutura com treinos intervalados, tempo run e rodagem controlada, sempre com foco em performance e recuperação.",
    durationLabel: "10 semanas",
    weeklyLoadLabel: "4 a 5 sessões por semana",
    priceLabel: "US$ 39",
    recommendedFor: [
      "Performance 5K",
      "Performance 10K",
    ],
  },
  "marathon-pro": {
    slug: "marathon-pro",
    title: "Marathon Pro",
    shortDescription: "Preparação completa para maratona com foco em resistência e consistência.",
    description:
      "Plano voltado para atletas que querem completar ou melhorar o tempo em uma maratona. Inclui longões progressivos, blocos de força na corrida e semanas de descarga para absorver o treinamento.",
    durationLabel: "16 semanas",
    weeklyLoadLabel: "4 a 6 sessões por semana",
    priceLabel: "US$ 59",
    recommendedFor: [
      "Maratona",
      "Performance 10K",
    ],
  },
  "triathlon-complete": {
    slug: "triathlon-complete",
    title: "Triathlon Complete",
    shortDescription:
      "Estrutura integrada de natação, ciclismo e corrida para provas short ou olímpico.",
    description:
      "Plano pensado para quem quer organizar a rotina de treinos das três modalidades sem excesso de carga. Distribui sessões ao longo da semana com foco em consistência, técnica e transições.",
    durationLabel: "12 semanas",
    weeklyLoadLabel: "5 a 7 sessões por semana (multi-esporte)",
    priceLabel: "US$ 69",
    recommendedFor: [
      "Triathlon",
    ],
  },
  "weight-loss-plus": {
    slug: "weight-loss-plus",
    title: "Weight Loss Plus",
    shortDescription:
      "Plano de corrida e caminhada para quem quer perder peso com segurança e controle.",
    description:
      "Combina treinos de baixa e moderada intensidade com dias de caminhada ativa. Ideal para quem quer reduzir peso, melhorar condicionamento geral e criar hábito consistente de movimento.",
    durationLabel: "10 semanas",
    weeklyLoadLabel: "3 a 5 sessões por semana",
    priceLabel: "US$ 34",
    recommendedFor: [
      "Running for Weight Loss",
      "Beginners Running",
    ],
  },
};

export default function PlanDetailPage({ params }: PlanPageProps) {
  const plan = PLANS[params.slug];

  if (!plan) {
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
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 800,
                marginBottom: "8px",
              }}
            >
              Plano não encontrado
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "#94a3b8",
                marginBottom: "12px",
              }}
            >
              Não encontramos este plano de treino. Verifique o link ou volte
              para a lista de planos.
            </p>
            <a
              href="/plans"
              style={{
                fontSize: "13px",
                padding: "8px 16px",
                borderRadius: "999px",
                background: "#22c55e",
                color: "#020617",
                textDecoration: "none",
                fontWeight: 600,
                display: "inline-block",
              }}
            >
              Voltar para planos
            </a>
          </div>
        </main>
        <BottomNavbar />
      </div>
    );
  }

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
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
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
                {plan.shortDescription}
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
              {plan.description}
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
              <span>Duração: {plan.durationLabel}</span>
              <span>Carga semanal: {plan.weeklyLoadLabel}</span>
            </div>
          </section>

          {/* Indicado para */}
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

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginBottom: "6px",
              }}
            >
              {plan.recommendedFor.map((g) => (
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

          {/* Bloco de preço / CTA */}
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
