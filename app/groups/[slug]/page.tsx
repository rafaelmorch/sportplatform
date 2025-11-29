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

type Training = {
  id: string;
  title: string;
  description: string | null;
  duration_weeks: number | null;
  price_cents: number | null;
  currency: string | null;
  slug: string;
};

function formatPrice(priceCents: number | null, currency: string | null) {
  if (!priceCents || !currency) return null;
  const value = priceCents / 100;
  return `${currency} ${value.toFixed(2)}`;
}

export default function GroupDetailPage() {
  const params = useParams();
  const slugParam = (params?.slug ?? "") as string;

  const supabase = supabaseBrowser;

  const group: TrainingGroup | undefined = trainingGroups.find(
    (g) => g.slug === slugParam
  );

  // estados para treinamentos vindos do Supabase
  const [dbGroup, setDbGroup] = useState<DbGroup | null>(null);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loadingTrainings, setLoadingTrainings] = useState(false);
  const [trainingsError, setTrainingsError] = useState<string | null>(null);

  // Carrega treinamentos vinculados a este grupo (se existir no Supabase)
  useEffect(() => {
    async function fetchTrainingsForGroup() {
      if (!group?.slug) return;

      setLoadingTrainings(true);
      setTrainingsError(null);

      // 1) Busca o grupo no Supabase pelo slug para achar o id
      const { data: groupData, error: groupError } = await supabase
        .from("training_groups")
        .select("id, slug, title")
        .eq("slug", group.slug)
        .maybeSingle();

      if (groupError) {
        console.error("Erro ao carregar grupo no Supabase:", groupError);
        setTrainingsError("Não foi possível carregar os treinamentos do grupo.");
        setLoadingTrainings(false);
        return;
      }

      if (!groupData) {
        // não existe correspondente no Supabase, então não há treinamentos vinculados
        setDbGroup(null);
        setTrainings([]);
        setLoadingTrainings(false);
        return;
      }

      const dbG = groupData as DbGroup;
      setDbGroup(dbG);

      // 2) Busca vínculos group <-> trainings
      const { data: relData, error: relError } = await supabase
        .from("training_group_trainings")
        .select("training_id")
        .eq("training_group_id", dbG.id);

      if (relError) {
        console.error(
          "Erro ao carregar vínculos do grupo com treinamentos:",
          relError
        );
        setTrainingsError("Não foi possível carregar os treinamentos do grupo.");
        setLoadingTrainings(false);
        return;
      }

      const relations =
        (relData as { training_id: string }[] | null) ?? [];

      const trainingIds = relations.map((r) => r.training_id);
      if (trainingIds.length === 0) {
        setTrainings([]);
        setLoadingTrainings(false);
        return;
      }

      // 3) Busca os treinamentos vinculados
      const { data: trainingsData, error: trainingsError } = await supabase
        .from("trainings")
        .select(
          "id, title, description, duration_weeks, price_cents, currency, slug"
        )
        .in("id", trainingIds)
        .order("created_at", { ascending: false });

      if (trainingsError) {
        console.error(
          "Erro ao carregar treinamentos do grupo:",
          trainingsError
        );
        setTrainingsError("Não foi possível carregar os treinamentos do grupo.");
        setLoadingTrainings(false);
        return;
      }

      setTrainings((trainingsData ?? []) as Training[]);
      setLoadingTrainings(false);
    }

    if (group) {
      fetchTrainingsForGroup();
    }
  }, [group, supabase]);

  // Se não achar o grupo estático, mostra a tela de "não encontrado"
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

        {/* Plano de 12 semanas (estático, como já estava) */}
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
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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

        {/* NOVA SEÇÃO: Treinamentos dinâmicos vindos do Supabase */}
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
                Treinamentos disponíveis para este grupo
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  margin: 0,
                }}
              >
                Planos cadastrados na área de Treinamentos e conectados a este
                grupo.
              </p>
            </div>
          </div>

          {trainingsError && (
            <p
              style={{
                fontSize: 13,
                color: "#fecaca",
                margin: 0,
              }}
            >
              {trainingsError}
            </p>
          )}

          {!trainingsError && loadingTrainings && (
            <p
              style={{
                fontSize: 13,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              Carregando treinamentos...
            </p>
          )}

          {!loadingTrainings && !trainingsError && trainings.length === 0 && (
            <p
              style={{
                fontSize: 13,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              Ainda não há treinamentos vinculados a este grupo. Crie um plano
              em <strong>Planos de treino &gt; Criar novo treinamento</strong>{" "}
              e selecione este grupo.
            </p>
          )}

          {!loadingTrainings && trainings.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 10,
                marginTop: 6,
              }}
            >
              {trainings.map((t) => {
                const priceLabel = formatPrice(
                  t.price_cents,
                  t.currency
                );
                const durationLabel = t.duration_weeks
                  ? `${t.duration_weeks} semana${
                      t.duration_weeks > 1 ? "s" : ""
                    }`
                  : null;

                return (
                  <Link
                    key={t.id}
                    href={`/plans/${t.slug}`}
                    style={{ textDecoration: "none" }}
                  >
                    <article
                      style={{
                        borderRadius: 16,
                        border: "1px solid rgba(51,65,85,0.9)",
                        background:
                          "radial-gradient(circle at top, #020617, #020617 60%, #000000 100%)",
                        padding: "10px 12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        height: "100%",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          margin: 0,
                        }}
                      >
                        {t.title}
                      </h3>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#d1d5db",
                          margin: 0,
                        }}
                      >
                        {t.description ||
                          "Plano com progressão estruturada."}
                      </p>

                      <p
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          margin: 0,
                        }}
                      >
                        {durationLabel
                          ? `Duração: ${durationLabel}`
                          : "Duração não informada"}
                        {priceLabel && ` · ${priceLabel}`}
                      </p>

                      <p
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          margin: 0,
                          marginTop: 4,
                        }}
                      >
                        Ver detalhes do treinamento ⟶
                      </p>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
