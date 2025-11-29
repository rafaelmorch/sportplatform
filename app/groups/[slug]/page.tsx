"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  trainingGroups,
  type TrainingGroup,
} from "../groups-data";
import JoinGroupButton from "./JoinGroupButton";
import { supabaseBrowser } from "@/lib/supabase-browser";

type DbGroup = {
  id: string;
  slug: string;
  title: string;
};

type DbWeek = {
  id: number;
  group_id: string;
  week_number: number;
  focus?: string | null;
  title?: string | null;
  description?: string | null;
  key_workouts?: string | null;
  mileage_hint?: string | null;
  // qualquer outra coluna que exista
  [key: string]: any;
};

export default function GroupDetailPage() {
  const params = useParams();
  const slugParam = (params?.slug ?? "") as string;

  const supabase = supabaseBrowser;

  // grupo estático (layout, textos etc.)
  const group: TrainingGroup | undefined = trainingGroups.find(
    (g) => g.slug === slugParam
  );

  // estados do plano de 12 semanas vindo do Supabase
  const [dbGroup, setDbGroup] = useState<DbGroup | null>(null);
  const [weeks, setWeeks] = useState<DbWeek[]>([]);
  const [loadingWeeks, setLoadingWeeks] = useState(false);
  const [weeksError, setWeeksError] = useState<string | null>(null);

  // Carrega plano de 12 semanas da tabela training_group_weeks
  useEffect(() => {
    async function fetchWeeks() {
      if (!group?.slug) return;

      setLoadingWeeks(true);
      setWeeksError(null);

      // 1) busca o grupo no Supabase para pegar o id (uuid)
      const { data: groupData, error: groupError } = await supabase
        .from("training_groups")
        .select("id, slug, title")
        .eq("slug", group.slug)
        .maybeSingle();

      if (groupError) {
        console.error(
          "Erro ao carregar grupo no Supabase para plano de 12 semanas:",
          groupError
        );
        setWeeksError("Não foi possível carregar o plano de 12 semanas.");
        setLoadingWeeks(false);
        return;
      }

      if (!groupData) {
        // não encontrou o grupo no Supabase → sem plano no banco
        setDbGroup(null);
        setWeeks([]);
        setLoadingWeeks(false);
        return;
      }

      const dbG = groupData as DbGroup;
      setDbGroup(dbG);

      // 2) busca as semanas desse grupo
      const { data: weeksData, error: weeksErrorResp } = await supabase
        .from("training_group_weeks")
        .select("*")
        .eq("group_id", dbG.id)
        .order("week_number", { ascending: true });

      if (weeksErrorResp) {
        console.error(
          "Erro ao carregar semanas do plano de 12 semanas:",
          weeksErrorResp
        );
        setWeeksError("Não foi possível carregar o plano de 12 semanas.");
        setLoadingWeeks(false);
        return;
      }

      setWeeks((weeksData ?? []) as DbWeek[]);
      setLoadingWeeks(false);
    }

    if (group) {
      fetchWeeks();
    }
  }, [group, supabase]);

  // Se não achou o grupo estático, mostra a tela de "não encontrado"
  if (!group) {
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

          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Grupo não encontrado
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#9ca3af",
            }}
          >
            Não encontramos nenhum grupo com o identificador:{" "}
            <span style={{ fontFamily: "monospace" }}>
              {slugParam || "(vazio)"}
            </span>
          </p>
        </div>
      </main>
    );
  }

  const staticPlan = group.twelveWeekPlan;

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
        {/* Voltar */}
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

        {/* Comunidade + botão entrar/sair */}
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
                  Ao participar, seus minutos de atividade (via Strava) passam a
                  contar no ranking e nos desafios deste grupo.
                </p>
              </div>

              <div
                style={{
                  minWidth: 180,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <JoinGroupButton groupSlug={group.slug} />
              </div>
            </div>
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

        {/* Plano de 12 semanas (Supabase + fallback estático) */}
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

          {/* Estados de erro / loading */}
          {weeksError && (
            <p
              style={{
                fontSize: 13,
                color: "#fecaca",
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              {weeksError}
            </p>
          )}

          {!weeksError && loadingWeeks && (
            <p
              style={{
                fontSize: 13,
                color: "#9ca3af",
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              Carregando plano de 12 semanas...
            </p>
          )}

          {/* Plano vindo do Supabase */}
          {!weeksError && !loadingWeeks && weeks.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              {weeks.map((week) => {
                const title =
                  (week as any).title ?? `Semana ${week.week_number}`;

                const focus =
                  week.focus ??
                  (week as any).focus ??
                  "";

                const description =
                  (week as any).description ?? "";

                const keyWorkouts =
                  (week as any).key_workouts ??
                  (week as any).keyWorkouts ??
                  "";

                const mileageHint =
                  (week as any).mileage_hint ??
                  (week as any).mileageHint ??
                  "";

                return (
                  <div
                    key={week.id}
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
                      Semana {week.week_number}
                    </p>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        margin: 0,
                        marginBottom: 4,
                      }}
                    >
                      {title}
                    </p>
                    {focus && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "#a5b4fc",
                          margin: 0,
                          marginBottom: 4,
                        }}
                      >
                        Foco: {focus}
                      </p>
                    )}
                    {description && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "#d1d5db",
                          margin: 0,
                          marginBottom: 4,
                        }}
                      >
                        {description}
                      </p>
                    )}
                    {keyWorkouts && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "#d1d5db",
                          margin: 0,
                          marginBottom: 4,
                        }}
                      >
                        {keyWorkouts}
                      </p>
                    )}
                    {mileageHint && (
                      <p
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          margin: 0,
                        }}
                      >
                        Volume semanal: {mileageHint}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Fallback: plano estático antigo */}
          {!weeksError &&
            !loadingWeeks &&
            weeks.length === 0 &&
            staticPlan && (
              <>
                {staticPlan.volumeLabel && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#a5b4fc",
                      marginBottom: 10,
                    }}
                  >
                    {staticPlan.volumeLabel}
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
                  {staticPlan.weeks.map((week) => (
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

          {/* Se não tem Supabase nem estático */}
          {!weeksError &&
            !loadingWeeks &&
            weeks.length === 0 &&
            !staticPlan && (
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
            )}
        </section>
      </div>
    </main>
  );
}
