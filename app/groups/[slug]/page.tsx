// app/groups/[slug]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import {
  trainingGroups,
  type TrainingGroupSlug,
  type TrainingGroup,
} from "../groups-data";
import JoinGroupButton from "./JoinGroupButton";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { slug: string };
};

async function getMemberCount(slug: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_slug", slug); // 👈 coluna snake_case no banco

  if (error) {
    console.error("Erro ao contar membros:", error);
    return 0;
  }

  return count ?? 0;
}

export default async function GroupDetailPage({ params }: PageProps) {
  const slug = params.slug as TrainingGroupSlug;

  const groupFound = trainingGroups.find((g) => g.slug === slug);
  if (!groupFound) {
    notFound();
  }
  const group = groupFound as TrainingGroup;

  const memberCount = await getMemberCount(slug);
  const plan = group.twelveWeekPlan;

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "24px",
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
            href="/groups"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "#9ca3af",
              textDecoration: "none",
            }}
          >
            <span
              style={{
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ←
            </span>
            <span>Voltar para grupos</span>
          </Link>
        </div>

        {/* Header do grupo */}
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
            Grupo de treino
          </p>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
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
        </header>

        {/* Bloco: comunidade + botão entrar/sair */}
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
          <div
            style={{
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
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#a5b4fc",
                    textTransform: "uppercase",
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
                  Comunidade do grupo
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "#e5e7eb",
                    margin: 0,
                  }}
                >
                  {memberCount === 0
                    ? "Seja o primeiro a participar deste grupo."
                    : `${memberCount} ${
                        memberCount === 1 ? "participante" : "participantes"
                      } ativos neste grupo.`}
                </p>
              </div>

              {/* Só UM componente: JoinGroupButton (ele mesmo cuida de entrar e sair) */}
              <div
                style={{
                  minWidth: 220,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <JoinGroupButton groupSlug={group.slug} />
              </div>
            </div>

            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                margin: 0,
                marginTop: 8,
              }}
            >
              Ao participar, seus minutos de atividade (via Strava) passam a
              contar no ranking e nos desafios deste grupo.
            </p>
          </div>
        </section>

        {/* Sobre o grupo */}
        <section
          style={{
            borderRadius: 20,
            border: "1px solid rgba(55,65,81,0.9)",
            background:
              "radial-gradient(circle at top, #020617, #020617 50%, #000000 100%)",
            padding: "16px 14px",
            marginBottom: 20,
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
            {group.longDescription}
          </p>
        </section>

        {/* Plano de 12 semanas */}
        <section
          style={{
            borderRadius: 20,
            border: "1px solid rgba(148,163,184,0.35)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: "16px 14px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              alignItems: "baseline",
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Plano de 12 semanas
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  margin: 0,
                }}
              >
                Estrutura progressiva pensada para os atletas deste grupo.
              </p>
            </div>
          </div>

          {!plan ? (
            <p
              style={{
                fontSize: 13,
                color: "#9ca3af",
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              Em breve este grupo terá um plano completo de 12 semanas com
              progressão semanal e recomendações detalhadas.
            </p>
          ) : (
            <>
              {plan.volumeLabel && (
                <p
                  style={{
                    fontSize: 13,
                    color: "#a5b4fc",
                    marginBottom: 10,
                  }}
                >
                  {plan.volumeLabel}
                </p>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 10,
                }}
              >
                {plan.weeks.map((week) => (
                  <div
                    key={week.week}
                    style={{
                      borderRadius: 16,
                      border: "1px solid rgba(51,65,85,0.9)",
                      background:
                        "radial-gradient(circle at top, #020617, #020617 60%, #000000 100%)",
                      padding: "10px 12px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        color: "#64748b",
                        textTransform: "uppercase",
                        margin: 0,
                        marginBottom: 4,
                      }}
                    >
                      Semana {week.week}
                    </p>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        margin: 0,
                        marginBottom: 4,
                      }}
                    >
                      {week.title}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#a5b4fc",
                        margin: 0,
                        marginBottom: 4,
                      }}
                    >
                      Foco: {week.focus}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#d1d5db",
                        margin: 0,
                      }}
                    >
                      {week.description}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
