// app/groups/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";

import { trainingGroups } from "../groups-data";
import JoinGroupButton from "./JoinGroupButton";
import { supabaseAdmin } from "@/lib/supabase";

// Tipo do params (Next 16 manda como Promise)
type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getMemberCount(groupSlug: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("group_members")
    .select("*", { head: true, count: "exact" })
    .eq("group_slug", groupSlug);

  if (error) {
    console.error("Erro ao buscar membros do grupo:", error);
    return 0;
  }

  return count ?? 0;
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const group = trainingGroups.find((g) => g.slug === slug);

  if (!group) {
    notFound();
  }

  // 👇 Aqui a gente “relaxa” o tipo para poder usar campos extras
  const g = group as any;

  const memberCount = await getMemberCount(g.slug as string);

  const plan = g.twelveWeekPlan ?? null;
  const weeks: any[] = plan?.weeks ?? [];

  const hasPlan = !!plan;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
        }}
      >
        {/* Topo: botão voltar */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Link
            href="/groups"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.5)",
              fontSize: 13,
              textDecoration: "none",
              color: "#e5e7eb",
              background:
                "radial-gradient(circle at top left, #020617, #020617 60%, #000000 100%)",
            }}
          >
            <span style={{ fontSize: 16 }}>←</span>
            <span>Voltar para grupos</span>
          </Link>
        </div>

        {/* Header do grupo */}
        <header
          style={{
            borderRadius: 24,
            padding: "18px 18px",
            marginBottom: 18,
            background:
              "radial-gradient(circle at top left, #020617, #020617 40%, #000000 100%)",
            border: "1px solid rgba(55,65,81,0.9)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#64748b",
              margin: 0,
              marginBottom: 6,
            }}
          >
            Grupo de treino
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                {g.name}
              </h1>
              {g.tagline && (
                <p
                  style={{
                    fontSize: 14,
                    color: "#9ca3af",
                    margin: 0,
                  }}
                >
                  {g.tagline}
                </p>
              )}
            </div>

            {/* chips à direita */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "flex-end",
              }}
            >
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(34,197,94,0.6)",
                  fontSize: 11,
                  color: "#bbf7d0",
                  background:
                    "radial-gradient(circle at top, #022c22, #022c22 40%, transparent)",
                }}
              >
                {memberCount} participante
                {memberCount === 1 ? "" : "s"}
              </span>

              {g.recommendedLevel && (
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(59,130,246,0.65)",
                    fontSize: 11,
                    color: "#bfdbfe",
                    background:
                      "radial-gradient(circle at top, #0b1120, #020617 60%)",
                  }}
                >
                  Nível sugerido: {g.recommendedLevel}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Descrição longa + botões */}
        <section
          style={{
            borderRadius: 20,
            border: "1px solid rgba(75,85,99,0.9)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: "16px 16px 14px",
            marginBottom: 18,
          }}
        >
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "#d1d5db",
              marginTop: 0,
              marginBottom: 14,
            }}
          >
            {g.longDescription}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
            }}
          >
            {/* Botão principal: Join (client component) */}
            <JoinGroupButton groupSlug={g.slug} />

            {/* Botão menor – ainda sem ação */}
            <button
              type="button"
              disabled
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.6)",
                backgroundColor: "transparent",
                color: "#9ca3af",
                fontSize: 12,
                cursor: "not-allowed",
                opacity: 0.7,
              }}
            >
              Sair do grupo (em breve)
            </button>
          </div>
        </section>

        {/* Plano de 12 semanas */}
        <section
          style={{
            borderRadius: 22,
            border: "1px solid rgba(148,163,184,0.35)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 40%, #000000 100%)",
            padding: "18px 16px 18px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                Plano de 12 semanas
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  margin: 0,
                }}
              >
                Estrutura progressiva pensada para o objetivo principal do
                grupo.
              </p>
            </div>

            <p
              style={{
                fontSize: 13,
                color: "#a5b4fc",
                margin: 0,
              }}
            >
              Volume alvo:{" "}
              {g.targetVolumeDescription ?? "adaptado ao grupo"}
            </p>
          </div>

          {hasPlan && weeks.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              {weeks.map((week, index) => (
                <div
                  key={week.title ?? index}
                  style={{
                    borderRadius: 16,
                    padding: "10px 10px",
                    border: "1px solid rgba(55,65,81,0.9)",
                    background:
                      "radial-gradient(circle at top, #020617, #020617 60%, #000000 100%)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      color: "#64748b",
                      margin: 0,
                      marginBottom: 4,
                    }}
                  >
                    Semana {index + 1}
                  </p>
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      margin: 0,
                      marginBottom: 4,
                    }}
                  >
                    {week.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      margin: 0,
                      marginBottom: 6,
                    }}
                  >
                    {week.focus}
                  </p>
                  {week.keyWorkouts && week.keyWorkouts.length > 0 && (
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 16,
                        fontSize: 12,
                        color: "#e5e7eb",
                      }}
                    >
                      {week.keyWorkouts.map((w: string, i: number) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p
              style={{
                fontSize: 13,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              Em breve você verá aqui o detalhamento semana a semana deste
              grupo.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
