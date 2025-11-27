// app/groups/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { trainingGroups } from "../groups-data";
import JoinGroupButton from "./JoinGroupButton";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GroupDetailPage({ params }: PageProps) {
  // Next 16: params é Promise
  const { slug } = await params;

  const group = trainingGroups.find((g) => g.slug === slug);

  if (!group) {
    notFound();
  }

  const participants = group.members ?? 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "16px", // sem BottomNavbar aqui
      }}
    >
      {/* TOPO: botão voltar + título */}
      <header
        style={{
          maxWidth: "900px",
          margin: "0 auto 20px auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Botão de voltar */}
        <div>
          <Link
            href="/groups"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.4)",
              textDecoration: "none",
              color: "#e5e7eb",
              background:
                "radial-gradient(circle at top, rgba(15,23,42,0.9), rgba(15,23,42,0.6))",
            }}
          >
            <span style={{ fontSize: 14 }}>←</span>
            <span>Voltar para grupos</span>
          </Link>
        </div>

        {/* Título e descrição do grupo */}
        <div>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#64748b",
              margin: 0,
            }}
          >
            Grupo de treinamento
          </p>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: "4px 0 6px 0",
            }}
          >
            {group.title}
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            {group.shortDescription}
          </p>
        </div>
      </header>

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Card principal: visão geral do grupo */}
        <section
          style={{
            borderRadius: 20,
            border: "1px solid rgba(148,163,184,0.35)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: "16px 14px",
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
              color: "#d1d5db",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {group.longDescription}
          </p>
        </section>

        {/* Comunidade + botões de ação */}
        <section
          style={{
            borderRadius: 18,
            border: "1px solid rgba(55,65,81,0.9)",
            background:
              "radial-gradient(circle at top, #020617, #020617 50%, #000000 100%)",
            padding: "16px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                Comunidade do grupo
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  margin: 0,
                }}
              >
                {participants}{" "}
                {participants === 1 ? "atleta participando" : "atletas participando"}.
              </p>
              {group.levelHint && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginTop: 6,
                    marginBottom: 0,
                  }}
                >
                  Nível sugerido: {group.levelHint}
                </p>
              )}
            </div>

            {/* Botões: participar + sair */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                alignItems: "flex-end",
                minWidth: 180,
              }}
            >
              {/* Botão principal – já existe no projeto */}
              <JoinGroupButton slug={group.slug} />

              {/* Botão menor Sair do grupo (visual por enquanto) */}
              <button
                type="button"
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.6)",
                  background: "transparent",
                  color: "#9ca3af",
                  cursor: "pointer",
                }}
                onClick={() => {
                  // TODO: no futuro, conectar com Supabase para remover participação
                  alert("Em breve você poderá sair do grupo pela plataforma.");
                }}
              >
                Sair do grupo
              </button>
            </div>
          </div>
        </section>

        {/* Plano de 12 semanas */}
        <section
          style={{
            borderRadius: 20,
            border: "1px solid rgba(148,163,184,0.35)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: "16px 14px",
            marginBottom: 8,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginTop: 0,
              marginBottom: 6,
            }}
          >
            Plano de 12 semanas
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              marginTop: 0,
              marginBottom: 10,
            }}
          >
            {group.includedChallengeSummary}
          </p>

          <ul
            style={{
              paddingLeft: "18px",
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 13,
              color: "#d1d5db",
            }}
          >
            {group.weeklyPlan.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
