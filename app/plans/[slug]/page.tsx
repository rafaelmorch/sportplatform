// app/plans/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { trainingPlans } from "../plans-data";
import BottomNavbar from "@/components/BottomNavbar";

type PageProps = {
  params: { slug: string };
};

export default function PlanDetailPage({ params }: PageProps) {
  const plan = trainingPlans.find((p) => p.slug === params.slug);

  if (!plan) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "#e5e7eb",
          padding: "24px 16px 80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "8px",
          }}
        >
          Plano não encontrado
        </h1>
        <p
          style={{
            marginBottom: "24px",
            fontSize: "14px",
            color: "#9ca3af",
          }}
        >
          Não encontramos este plano de treino. Verifique o link ou volte para a
          lista de planos.
        </p>

        <Link
          href="/plans"
          style={{
            background:
              "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#020617",
            padding: "10px 18px",
            borderRadius: "999px",
            fontSize: "14px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Voltar para planos
        </Link>

        <BottomNavbar />
      </main>
    );
  }

  return (
    <>
      <main
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "#e5e7eb",
          padding: "24px 16px 80px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {/* Breadcrumb / voltar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
            fontSize: "13px",
            color: "#9ca3af",
          }}
        >
          <Link
            href="/plans"
            style={{
              textDecoration: "none",
              color: "#9ca3af",
            }}
          >
            Planos
          </Link>
          <span>/</span>
          <span style={{ color: "#e5e7eb" }}>{plan.title}</span>
        </div>

        {/* “badge” topo */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#a5b4fc",
            background: "rgba(79, 70, 229, 0.18)",
            borderRadius: "999px",
            padding: "4px 10px",
            marginBottom: "12px",
          }}
        >
          Plano de treino • Nível {plan.level}
        </span>

        {/* Título principal */}
        <h1
          style={{
            fontSize: "26px",
            lineHeight: 1.2,
            fontWeight: 700,
            marginBottom: "12px",
          }}
        >
          {plan.title}
        </h1>

        {/* Subtítulo / resumo curto */}
        <p
          style={{
            fontSize: "14px",
            color: "#9ca3af",
            marginBottom: "20px",
          }}
        >
          Plano estruturado para evoluir com consistência, usando os dados do
          Strava para ajustar intensidade e volume semana a semana.
        </p>

        {/* Cartão principal do plano */}
        <section
          style={{
            borderRadius: "18px",
            border: "1px solid #1f2937",
            background:
              "radial-gradient(circle at top, #111827, #020617 65%)",
            padding: "18px 16px 16px",
            marginBottom: "18px",
          }}
        >
          {/* “preço fake” só como visual – sem usar plan.price */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "10px",
              gap: "8px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#9ca3af",
                  marginBottom: "4px",
                }}
              >
                Investimento mensal
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#22c55e",
                }}
              >
                R$ 197
                <span
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginLeft: "4px",
                    fontWeight: 400,
                  }}
                >
                  /mês
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "999px",
                background: "#111827",
                color: "#9ca3af",
                border: "1px solid #1f2937",
                whiteSpace: "nowrap",
              }}
            >
              Estrutura pronta para dashboard
            </span>
          </div>

          <p
            style={{
              fontSize: "13px",
              color: "#9ca3af",
              marginBottom: "14px",
            }}
          >
            Ideal para atletas que já usam Strava e querem acompanhar evolução
            de ritmo, volume semanal e performance em treinos chave.
          </p>

          {/* Botões principais */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <Link
              href={`/checkout/${plan.slug}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 14px",
                borderRadius: "999px",
                background:
                  "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#020617",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Contratar este plano
            </Link>

            <Link
              href="/groups"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "9px 14px",
                borderRadius: "999px",
                border: "1px solid #374151",
                background: "transparent",
                color: "#e5e7eb",
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              Ver grupos indicados para este plano
            </Link>
          </div>
        </section>

        {/* Descrição principal do plano (usa só plan.description) */}
        <section
          style={{
            borderRadius: "14px",
            border: "1px solid #111827",
            background: "#020617",
            padding: "14px 12px",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Como funciona o plano
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "#9ca3af",
              marginBottom: "10px",
            }}
          >
            {plan.description}
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "#9ca3af",
            }}
          >
            A estrutura foi pensada para integrar métricas do Strava (tempo,
            distância, altimetria e esforço percebido) em um painel simples de
            acompanhamento de performance.
          </p>
        </section>

        {/* Sessão de highlights fixos – sem depender de campos extras */}
        <section
          style={{
            borderRadius: "14px",
            border: "1px solid #111827",
            background: "#020617",
            padding: "14px 12px",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 600,
              marginBottom: "10px",
            }}
          >
            O que você acompanha no SportPlatform
          </h2>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "13px",
              color: "#9ca3af",
            }}
          >
            <li>• Volume semanal de quilômetros sincronizado via Strava</li>
            <li>• Ritmo médio por treino e por semana</li>
            <li>• Comparação entre treinos-chave (ex: tempo de 5K / 10K)</li>
            <li>• Visualização simples para apresentar em dashboards</li>
          </ul>
        </section>
      </main>

      <BottomNavbar />
    </>
  );
}
