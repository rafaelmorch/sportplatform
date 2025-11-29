"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { trainingPlans } from "../plans-data";

type DbTraining = {
  id: string;
  title: string;
  description: string | null;
  duration_weeks: number | null;
  price_cents: number | null;
  currency: string | null;
  slug: string;
};

type TrainingGroup = {
  id: string;
  title: string;
};

type StaticPlan = (typeof trainingPlans)[number];

function formatPrice(priceCents: number | null, currency: string | null) {
  if (!priceCents || !currency) return "Gratuito";
  const value = priceCents / 100;
  return `${currency} ${value.toFixed(2)}`;
}

export default function PlanDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const supabase = supabaseBrowser;

  const [dbTraining, setDbTraining] = useState<DbTraining | null>(null);
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [staticPlan, setStaticPlan] = useState<StaticPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    async function fetchData() {
      setLoading(true);
      setErrorMsg(null);

      // 1) tenta buscar no Supabase
      const { data: trainingData, error: trainingError } = await supabase
        .from("trainings")
        .select(
          "id, title, description, duration_weeks, price_cents, currency, slug"
        )
        .eq("slug", slug)
        .maybeSingle();

      if (trainingError) {
        console.error("Erro ao carregar treinamento do Supabase:", trainingError);
      }

      if (trainingData) {
        const t = trainingData as DbTraining;
        setDbTraining(t);

        // 2) busca grupos relacionados
        const { data: relations, error: relError } = await supabase
          .from("training_group_trainings")
          .select("training_group_id")
          .eq("training_id", t.id);

        if (relError) {
          console.error(
            "Erro ao carregar vínculos com grupos de treinamento:",
            relError
          );
        } else {
          const groupIds =
            relations?.map(
              (row: { training_group_id: string }) => row.training_group_id
            ) ?? [];

          if (groupIds.length > 0) {
            const { data: groupsData, error: groupsError } = await supabase
              .from("training_groups")
              .select("id, title")
              .in("id", groupIds)
              .order("title", { ascending: true });

            if (groupsError) {
              console.error(
                "Erro ao carregar grupos de treinamento:",
                groupsError
              );
            } else {
              setGroups(groupsData as TrainingGroup[]);
            }
          }
        }

        setLoading(false);
        return;
      }

      // 3) se não achou no Supabase, tenta nos planos estáticos
      const foundStatic = trainingPlans.find((p) => p.slug === slug) ?? null;
      setStaticPlan(foundStatic);

      if (!foundStatic) {
        setErrorMsg("Treinamento não encontrado.");
      }

      setLoading(false);
    }

    fetchData();
  }, [slug, supabase]);

  const isDb = !!dbTraining;
  const isStatic = !!staticPlan;

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
        {/* Botão voltar */}
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/plans"
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
            ← Voltar para planos
          </Link>
        </div>

        {/* Header */}
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
            Plano de treino
          </p>

          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
            }}
          >
            {isDb
              ? dbTraining!.title
              : isStatic
              ? staticPlan!.title
              : "Detalhes do plano"}
          </h1>

          {isStatic && staticPlan!.subtitle && (
            <p
              style={{
                fontSize: 14,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              {staticPlan!.subtitle}
            </p>
          )}

          {/* Linha de info (nível / duração / preço) */}
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            {/* planos estáticos antigos */}
            {isStatic && staticPlan!.level && (
              <span>Nível: {staticPlan!.level}</span>
            )}
            {isStatic && (staticPlan!.level || staticPlan!.durationWeeks) && " · "}
            {isStatic && staticPlan!.durationWeeks && (
              <span>
                Duração: {staticPlan!.durationWeeks}{" "}
                {staticPlan!.durationWeeks === 1 ? "semana" : "semanas"}
              </span>
            )}
            {isStatic && staticPlan!.pricePerMonth && (
              <>
                {" · "}
                <span>Investimento: ${staticPlan!.pricePerMonth}/mês</span>
              </>
            )}

            {/* planos vindos do Supabase */}
            {isDb && dbTraining!.duration_weeks && (
              <>
                {isStatic ? " · " : ""}
                <span>
                  Duração: {dbTraining!.duration_weeks}{" "}
                  {dbTraining!.duration_weeks === 1 ? "semana" : "semanas"}
                </span>
              </>
            )}
            {isDb && dbTraining!.price_cents && (
              <>
                {" · "}
                <span>
                  Investimento:{" "}
                  {formatPrice(dbTraining!.price_cents, dbTraining!.currency)}
                </span>
              </>
            )}
          </p>
        </header>

        {/* Loading / erro simples */}
        {loading && (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>Carregando...</p>
        )}

        {!loading && errorMsg && !isDb && !isStatic && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(127,29,29,0.9)",
              color: "#fee2e2",
              fontSize: 13,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Conteúdo principal, se tiver plano (db ou estático) */}
        {!loading && (isDb || isStatic) && (
          <>
            {/* Descrição / o que recebe */}
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
                O que você recebe neste plano
              </h2>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "#d1d5db",
                  margin: 0,
                }}
              >
                {isDb
                  ? dbTraining!.description ||
                    "Nenhuma descrição adicionada ainda."
                  : staticPlan!.description}
              </p>
            </section>

            {/* Se for plano vindo do Supabase, mostra grupos vinculados */}
            {isDb && (
              <section
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(55,65,81,0.9)",
                  background:
                    "radial-gradient(circle at top, #020617, #020617 50%, #000000 100%)",
                  padding: "16px 14px",
                  marginBottom: 20,
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
                  Grupos de treinamento indicados
                </h3>

                {groups.length === 0 ? (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#9ca3af",
                      marginTop: 0,
                      marginBottom: 0,
                    }}
                  >
                    Nenhum grupo vinculado a este treinamento ainda.
                  </p>
                ) : (
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {groups.map((g) => (
                      <li
                        key={g.id}
                        style={{
                          fontSize: 12,
                          padding: "4px 10px",
                          borderRadius: 999,
                          border: "1px solid rgba(148,163,184,0.6)",
                          background: "rgba(15,23,42,0.9)",
                        }}
                      >
                        {g.title}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* Bloco de integração / CTA */}
            <section
              style={{
                borderRadius: 18,
                border: "1px solid rgba(55,65,81,0.9)",
                background:
                  "radial-gradient(circle at top, #020617, #020617 50%, #000000 100%)",
                padding: "16px 14px",
                marginBottom: 20,
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
                Este plano é pensado para se conectar com os dados reais do
                atleta via Strava, permitindo acompanhar métricas de volume,
                intensidade e evolução ao longo das semanas.
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  margin: 0,
                }}
              >
                Na versão completa, cada sessão será monitorada
                automaticamente, com alertas de consistência, cargas semanais e
                comparação com as metas definidas dentro do seu grupo de
                treino.
              </p>
            </section>

            {/* CTA */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <button
                type="button"
                style={{
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 46,
                  borderRadius: 999,
                  background:
                    "linear-gradient(135deg, #22c55e, #16a34a, #22c55e)",
                  color: "#020617",
                  fontSize: 14,
                  fontWeight: 600,
                  border: "1px solid rgba(248,250,252,0.12)",
                  cursor: "pointer",
                }}
                onClick={() => {
                  alert("Em breve: fluxo de checkout/uso do plano.");
                }}
              >
                Usar este plano
              </button>

              <Link
                href="/plans"
                style={{
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 44,
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.5)",
                  textDecoration: "none",
                  color: "#e5e7eb",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Voltar para lista de planos
              </Link>
            </div>
          </>
        )}
      </div>

      <BottomNavbar />
    </main>
  );
}
