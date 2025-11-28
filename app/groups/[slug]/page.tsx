// app/groups/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { trainingGroups, type TrainingGroupSlug } from "../groups-data";
import { supabaseAdmin } from "@/lib/supabase";
import JoinGroupButton from "./JoinGroupButton";

type PageProps = {
  params: Promise<{ slug: TrainingGroupSlug }>;
};

// Conta participantes usando o slug do grupo
async function getMemberCount(slug: TrainingGroupSlug): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("challenge_participants") // se o nome da tabela for outro, ajusta aqui
    .select("id", { count: "exact" })
    .eq("group_slug", slug); // usamos a coluna group_slug

  if (error) {
    console.error("Erro ao contar participantes do grupo", slug, error);
    return 0;
  }

  return data?.length ?? 0;
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // 👉 forçamos any pra não dar mais xilique de tipo
  const group = trainingGroups.find((g) => g.slug === slug) as any;

  if (!group) {
    notFound();
  }

  const memberCount = await getMemberCount(slug);
  const plan = (group as any).twelveWeekPlan as
    | {
        volumeLabel?: string;
        weeks?: {
          week: number;
          title: string;
          focus: string;
          description: string;
        }[];
      }
    | undefined;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
      }}
    >
      <div
        style={{
          maxWidth: "980px",
          margin: "0 auto",
        }}
      >
        {/* Botão voltar – sem BottomNavbar nesta página */}
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/groups"
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
            ← Voltar para grupos
          </Link>
        </div>

        {/* Header do grupo */}
        <section
          style={{
            borderRadius: 20,
            border: "1px solid rgba(31,41,55,0.9)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: "20px 18px",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
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
                Grupo de treino
              </p>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {group.name}
              </h1>
            </div>

            <div
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.5)",
                color: "#cbd5f5",
                whiteSpace: "nowrap",
              }}
            >
              {memberCount}{" "}
              {memberCount === 1 ? "participante" : "participantes"}
            </div>
          </div>

          {/* Descrição longa do grupo */}
          <p
            style={{
              fontSize: 14,
              color: "#d1d5db",
              margin: 0,
            }}
          >
            {group.longDescription}
          </p>

          {/* Botões Participar / Sair */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 18,
              alignItems: "center",
            }}
          >
            {/* Botão principal – client component */}
            <JoinGroupButton groupSlug={group.slug} />

            {/* Botão menor – placeholder por enquanto */}
            <button
              type="button"
              disabled
              style={{
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.6)",
                backgroundColor: "transparent",
                color: "#9ca3af",
                fontSize: 13,
                cursor: "not-allowed",
              }}
            >
              Sair do grupo (em breve)
            </button>
          </div>
        </section>

        {/* Plano de 12 semanas */}
        <section
          style={{
            borderRadius: 20,
            border: "1px solid rgba(31,41,55,0.9)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: "20px 18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 12,
              marginBottom: 10,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  margin: 0,
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
                fontSize: 12,
                color: "#a5b4fc",
                margin: 0,
                whiteSpace: "nowrap",
              }}
            >
              {plan?.volumeLabel ??
                "Volume alvo adaptado ao nível dos atletas do grupo."}
            </p>
          </div>

          {plan && plan.weeks && plan.weeks.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
                marginTop: 10,
              }}
            >
              {plan.weeks.map((w) => (
                <div
                  key={w.week}
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(55,65,81,0.9)",
                    padding: "10px 12px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      margin: 0,
                      marginBottom: 4,
                    }}
                  >
                    Semana {w.week} · {w.focus}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      margin: 0,
                      marginBottom: 4,
                    }}
                  >
                    {w.title}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#d1d5db",
                      margin: 0,
                    }}
                  >
                    {w.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p
              style={{
                fontSize: 13,
                color: "#d1d5db",
                marginTop: 10,
              }}
            >
              Em breve você verá aqui o detalhamento semana a semana deste grupo,
              com treinos organizados por fase (base, progressão, carga alta e
              taper).
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
