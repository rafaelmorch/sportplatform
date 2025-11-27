// app/plans/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import BottomNavbar from "@/components/BottomNavbar";
import { trainingPlans } from "../plans-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PlanDetailPage({ params }: PageProps) {
  // Next 16: params vem como Promise
  const { slug } = await params;

  const plan = trainingPlans.find((p) => p.slug === slug);

  if (!plan) {
    notFound();
  }

  const {
    title,
    subtitle,
    description,
    level,
    pricePerMonth,
    durationWeeks,
  } = plan!;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "80px", // espaço pro BottomNavbar
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* Botão voltar */}
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/plans"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid rgba(55,65,81,0.9)",
              fontSize: 13,
              textDecoration: "none",
              color: "#e5e7eb",
            }}
          >
            ← Voltar para planos
          </Link>
        </div>

        {/* Header */}
        <header
          style={{
            marginBottom: 20,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#64748b",
              margin: 0,
            }}
          >
            Plano de treino
          </p>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: 14,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          )}

          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            {level && <span>Nível: {level}</span>}
            {(level || durationWeeks) && " · "}
            {durationWeeks && (
              <span>
                Duração: {durationWeeks}{" "}
                {durationWeeks === 1 ? "semana" : "semanas"}
              </span>
            )}
            {pricePerMonth && (
              <>
                {" · "}
                <span>Investimento: ${pricePerMonth}/mês</span>
              </>
            )}
          </p>
        </header>

        {/* Card principal */}
        <section
          style={{
            borderRadius: 20,
            border: "1px solid rgba(148,163,184,0.35)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: "16px 14px",
            marginBottom: 18,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginTop: 0,
              marginBottom: 8,
            }}
          >
            O que você recebe neste plano
          </h2>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "#d1d5db",
              margin: 0,
            }}
          >
            {description}
          </p>
        </section>

        {/* Integração com plataforma */}
        <section
          style={{
            borderRadius: 18,
            border: "1px solid rgba(55,65,81,0.9)",
            background:
              "radial-gradient(circle at top, #020617, #020617 50%, #000000 100%)",
            padding: "16px 14px",
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              marginTop: 0,
              marginBottom: 6,
            }}
          >
            Integrado ao Strava e ao SportPlatform
          </h3>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              marginTop: 0,
              marginBottom: 10,
            }}
          >
            Este plano é pensado para se conectar com os dados reais do atleta
            via Strava, permitindo acompanhar métricas de volume, intensidade e
            evolução ao longo das semanas.
          </p>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            Na versão completa, cada sessão será monitorada automaticamente,
            com alertas de consistência, cargas semanais e comparação com as
            metas definidas dentro do seu grupo de treino.
          </p>
        </section>

        {/* CTA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <Link
            href={`/checkout/${plan.slug}`}
            style={{
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              height: 46,
              borderRadius: 999,
              background:
                "linear-gradient(135deg, #22c55e, #16a34a, #22c55e)",
              color: "#020617",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              border: "1px solid rgba(248,250,252,0.12)",
            }}
          >
            Continuar para checkout
          </Link>

          <Link
            href="/plans"
            style={{
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              height: 44,
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.5)",
              textDecoration: "none",
              color: "#e5e7eb",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Voltar para lista de planos
          </Link>
        </div>
      </div>

      <BottomNavbar />
    </main>
  );
}
