// app/groups/[slug]/page.tsx
import { notFound } from "next/navigation";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseAdmin } from "@/lib/supabase";
import JoinGroupButton from "./JoinGroupButton";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type TrainingGroupRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  long_description: string | null;
  level_hint: string | null;
};

type GroupWeekRow = {
  week_number: number;
  focus: string;
  summary: string | null;
  mileage_hint: string | null;
  key_workouts: string | null;
};

export default async function GroupDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // 1) Carrega o grupo pelo slug
  const { data: group, error: groupError } = await supabaseAdmin
    .from("training_groups")
    .select(
      "id, slug, title, short_description, long_description, level_hint"
    )
    .eq("slug", slug)
    .maybeSingle<TrainingGroupRow>();

  if (!group || groupError) {
    notFound();
  }

  // 2) Carrega plano de 12 semanas
  const { data: weeks } = await supabaseAdmin
    .from("training_group_weeks")
    .select(
      "week_number, focus, summary, mileage_hint, key_workouts"
    )
    .eq("group_id", group.id)
    .order("week_number", { ascending: true })
    .returns<GroupWeekRow[]>();

  // 3) Conta participantes da comunidade
  const { count: membersCount } = await supabaseAdmin
    .from("training_group_members")
    .select("*", { head: true, count: "exact" })
    .eq("group_id", group.id);

  const totalMembers = membersCount ?? 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "80px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <header
          style={{
            marginBottom: 20,
            display: "flex",
            flexDirection: "column",
            gap: 6,
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

          {group.short_description && (
            <p
              style={{
                fontSize: 14,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              {group.short_description}
            </p>
          )}

          {group.level_hint && (
            <p
              style={{
                fontSize: 12,
                color: "#6b7280",
                margin: 0,
                marginTop: 4,
              }}
            >
              Apropriado para: {group.level_hint}
            </p>
          )}
        </header>

        {/* BLOCO COMUNIDADE + BOTÃO PARTICIPAR */}
        <section
          style={{
            borderRadius: 20,
            border: "1px solid rgba(59,130,246,0.6)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: "16px 14px",
            marginBottom: 18,
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
              alignItems: "baseline",
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
                Comunidade do grupo
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  margin: 0,
                }}
              >
                Ao participar, você entra no ranking de minutos/pontos deste
                grupo dentro do SportPlatform.
              </p>
            </div>

            <div
              style={{
                textAlign: "right",
                fontSize: 12,
                color: "#9ca3af",
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#bfdbfe",
                }}
              >
                {totalMembers}
              </div>
              <div>atleta(s) no grupo</div>
            </div>
          </div>

          <JoinGroupButton
            groupId={group.id}
            groupSlug={group.slug}
            initialMembersCount={totalMembers}
          />
        </section>

        {/* DESCRIÇÃO LONGA */}
        {group.long_description && (
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
              {group.long_description}
            </p>
          </section>
        )}

        {/* PLANO DE 12 SEMANAS */}
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
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginTop: 0,
              marginBottom: 8,
            }}
          >
            Treinamento de 12 semanas
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              marginTop: 0,
              marginBottom: 10,
            }}
          >
            Plano progressivo pensado para evoluir semana a semana, sempre
            respeitando o momento do atleta.
          </p>

          {weeks && weeks.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {weeks.map((w) => (
                <div
                  key={w.week_number}
                  style={{
                    borderRadius: 14,
                    border: "1px solid rgba(55,65,81,0.9)",
                    padding: "10px 12px",
                    background:
                      "radial-gradient(circle at top, #020617, #020617 60%, #000000 100%)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <strong
                      style={{
                        fontSize: 13,
                      }}
                    >
                      Semana {w.week_number} – {w.focus}
                    </strong>
                    {w.mileage_hint && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                        }}
                      >
                        Volume alvo: {w.mileage_hint}
                      </span>
                    )}
                  </div>

                  {w.summary && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#d1d5db",
                        margin: 0,
                        marginBottom: w.key_workouts ? 4 : 0,
                      }}
                    >
                      {w.summary}
                    </p>
                  )}

                  {w.key_workouts && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                        margin: 0,
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>Treinos-chave:</span>{" "}
                      {w.key_workouts}
                    </p>
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
              Em breve vamos publicar o plano completo de 12 semanas para este
              grupo.
            </p>
          )}
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
