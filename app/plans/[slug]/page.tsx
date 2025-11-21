// app/plans/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import BottomNavbar from "@/components/BottomNavbar";
import { trainingPlans } from "../plans-data";

type PageProps = {
  params: { slug: string };
};

export default function PlanDetailPage({ params }: PageProps) {
  const plan = trainingPlans.find((p: any) => p.slug === params.slug) as
    | any
    | undefined;

  if (!plan) {
    notFound();
  }

  const title: string = plan.title ?? "Plano sem título";
  const description: string =
    plan.description ??
    plan.shortDescription ??
    "Descrição em breve para este plano.";
  const level: string | undefined = plan.level;
  const price: string | undefined = plan.price; // se existir no data, mostramos; senão, ignorado

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
        {/* Header */}
        <header
          style={{
            marginBottom: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
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
          {(level || price) && (
            <p
              style={{
                fontSize: 13,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              {level && <span>Nível: {level}</span>}
              {level && price && <span> · </span>}
              {price && <span>Investimento: {price}</span>}
            </p>
          )}
        </header>

        {/* Card principal */}
        <section
          style={{
            borderRadius: "20px",
            border: "1px solid rgba(148,163,184,0.35)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: "16px 14px",
            marginBottom: "18px",
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

        {/* Seção de destaque / integração futura */}
        <section
          style={{
            borderRadius: "18px",
            border: "1px solid rgba(55,65,81,0.9)",
            background:
              "radial-gradient(circle at top, #020617, #020617 50%, #000000 100%)",
            padding: "16px 14px",
            marginBottom: "20px",
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
            Este plano foi pensado para se conectar com os dados reais do
            atleta via Strava, permitindo acompanhar métricas de volume,
            intensidade e evolução ao longo das semanas.
          </p>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            Na versão completa do SportPlatform, cada sessão de treino será
            monitorada automaticamente, com alertas de consistência, cargas
            semanais e comparação com a meta definida no início do plano.
          </p>
        </section>

        {/* CTA / navegação */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: "12px",
          }}
        >
          <Link
            href={`/checkout/${plan.slug}`}
            style={{
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              height: 46,
              borderRadius: "999px",
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
              borderRadius: "999px",
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
