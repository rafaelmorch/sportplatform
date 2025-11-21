// app/groups/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import BottomNavbar from "@/components/BottomNavbar";
import { trainingGroups } from "../groups-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GroupDetailPage({ params }: PageProps) {
  // Next 16: params é uma Promise → precisamos dar await
  const { slug } = await params;

  // Usamos any pra não brigar com TS por causa de campos opcionais
  const group = trainingGroups.find((g: any) => g.slug === slug) as any | undefined;

  if (!group) {
    notFound();
  }

  const title: string = group.title ?? "Grupo sem título";
  const description: string =
    group.description ??
    group.shortDescription ??
    "Descrição em breve para este grupo.";
  const level: string | undefined = group.level;
  const focus: string | undefined = group.focus;

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
            Grupo de treino
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
          {(level || focus) && (
            <p
              style={{
                fontSize: 13,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              {level && <span>Nível: {level}</span>}
              {level && focus && <span> · </span>}
              {focus && <span>Foco: {focus}</span>}
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
            Sobre o grupo
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

        {/* Seção de explicação */}
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
            Como este grupo funciona
          </h3>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              marginTop: 0,
              marginBottom: 10,
            }}
          >
            Os treinos deste grupo são organizados em sessões progressivas, com
            foco em constância, segurança e evolução de performance ao longo do
            tempo. A ideia é que o atleta consiga enxergar claramente a
            evolução nas próximas semanas.
          </p>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            Na versão completa do SportPlatform, este grupo será conectado a
            planos de treino personalizados e métricas em tempo real.
          </p>
        </section>

        {/* Navegação */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: "12px",
          }}
        >
          <Link
            href="/groups"
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
            Voltar para lista de grupos
          </Link>
          <Link
            href="/plans"
            style={{
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              height: 44,
              borderRadius: "999px",
              background:
                "linear-gradient(135deg, #22c55e, #16a34a, #22c55e)",
              color: "#020617",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              border: "1px solid rgba(248,250,252,0.1)",
            }}
          >
            Ver planos de treino recomendados
          </Link>
        </div>
      </div>

      <BottomNavbar />
    </main>
  );
}
