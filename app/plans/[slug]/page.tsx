// app/plans/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import BottomNavbar from "@/components/BottomNavbar";
import { createClient } from "@supabase/supabase-js";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// Cliente Supabase para rodar no servidor (usando as envs públicas)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Training = {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  duration_weeks: number | null;
  price_cents: number | null;
  currency: string | null;
  slug: string | null;
};

function formatPrice(price_cents: number | null, currency: string | null) {
  if (!price_cents || price_cents <= 0) return undefined;
  const curr = (currency || "BRL").toUpperCase();

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: curr,
  }).format(price_cents / 100);
}

export default async function PlanDetailPage({ params }: PageProps) {
  // Next 16: params é Promise
  const { slug } = await params;

  // Busca o treinamento no Supabase
  const { data, error } = await supabase
    .from("trainings")
    .select(
      "id, title, description, level, duration_weeks, price_cents, currency, slug"
    )
    .eq("slug", slug)
    .eq("visibility", "platform")
    .eq("is_active", true)
    .single<Training>();

  if (error || !data) {
    console.error("Erro ao carregar treinamento:", error);
    notFound();
  }

  const training = data;

  const title: string = training.title ?? "Treinamento sem título";
  const description: string =
    training.description ?? "Descrição em breve para este treinamento.";
  const level: string | null = training.level;
  const priceFormatted = formatPrice(
    training.price_cents,
    training.currency
  );

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
            Treinamento online
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
          {(level || priceFormatted) && (
            <p
              style={{
                fontSize: 13,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              {level && <span>Nível: {level}</span>}
              {level && priceFormatted && <span> · </span>}
              {priceFormatted && (
                <span>Investimento: {priceFormatted}</span>
              )}
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
            O que você recebe neste treinamento
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
            Este treinamento foi pensado para se conectar com os dados reais
            do atleta via Strava, permitindo acompanhar métricas de volume,
            intensidade e evolução ao longo das semanas.
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
            metas definidas.
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
            href={`/checkout/${training.slug ?? ""}`}
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
            Voltar para lista de treinamentos
          </Link>
        </div>
      </div>

      <BottomNavbar />
    </main>
  );
}
