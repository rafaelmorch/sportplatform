// app/groups/[slug]/page.tsx

import { notFound } from "next/navigation";
import { getGroupBySlug, type TrainingGroup } from "../groups-data";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type DayPlan = {
  day: number;
  title: string;
  description: string;
};

function getGroupImage(slug: string): string {
  switch (slug) {
    case "beginners-running":
      return "/groups/beginners.jpg";
    case "marathon":
      return "/groups/marathon.jpg";
    case "triathlon":
      return "/groups/triathlon.jpg";
    case "weight-loss-running":
      return "/groups/weightloss.jpg";
    case "performance-5k":
      return "/groups/performance5k.jpg";
    case "performance-10k":
      return "/groups/performance10k.jpg";
    default:
      return "/groups/default.jpg";
  }
}

function generate30DayPlan(group: TrainingGroup): DayPlan[] {
  const plans: DayPlan[] = [];

  for (let i = 1; i <= 30; i++) {
    let title = "";
    let description = "";

    const isRecoveryDay = i % 7 === 0;
    const isLongRunDay =
      (group.slug === "marathon" || group.slug === "performance-10k") &&
      i % 7 === 6;
    const isSpeedDay =
      (group.slug === "performance-5k" || group.slug === "performance-10k") &&
      i % 5 === 3;

    switch (group.slug) {
      case "beginners-running":
        if (isRecoveryDay) {
          title = "Dia de descanso ativo";
          description =
            "Caminhada leve de 20–30 minutos ou alongamentos para manter o corpo em movimento.";
        } else if (i <= 10) {
          title = "Caminhada + trote leve";
          description =
            "Alternar 2 minutos de caminhada com 1 minuto de trote leve por 20–25 minutos.";
        } else if (i <= 20) {
          title = "Blocos de corrida contínua";
          description =
            "Correr 5 minutos contínuos em ritmo confortável, seguidos de 2 minutos de caminhada. Repetir 4 vezes.";
        } else {
          title = "Construindo os 5 km";
          description =
            "Correr 20–30 minutos contínuos em ritmo confortável, buscando se aproximar dos 5 km.";
        }
        break;

      case "marathon":
        if (isRecoveryDay) {
          title = "Regenerativo + mobilidade";
          description =
            "20–30 minutos de corrida bem leve, seguidos de alongamentos e exercícios de mobilidade.";
        } else if (isLongRunDay) {
          title = "Longão da semana";
          description =
            "Corrida longa em ritmo confortável, entre 18 e 28 km, mantendo hidratação e ritmo estável.";
        } else {
          title = "Endurance em ritmo confortável";
          description =
            "Corrida contínua de 8 a 14 km em ritmo confortável (Z2/Z3), reforçando base aeróbia.";
        }
        break;

      case "triathlon":
        if (isRecoveryDay) {
          title = "Técnica + estabilidade";
          description =
            "Sessão leve (natação ou bike) com foco em técnica, seguida de exercícios de core e estabilidade.";
        } else if (i % 3 === 1) {
          title = "Treino de natação";
          description =
            "1.500–2.500 m com foco em técnica de braçada, respiração e séries moderadas.";
        } else if (i % 3 === 2) {
          title = "Treino de bike";
          description =
            "45–90 minutos de pedal em ritmo moderado, incluindo variações de cadência ou leve altimetria.";
        } else {
          title = "Brick run";
          description =
            "Corrida de 20–40 minutos logo após um pedal leve, simulando a transição da prova.";
        }
        break;

      case "weight-loss-running":
        if (isRecoveryDay) {
          title = "Caminhada ativa + mobilidade";
          description =
            "30–40 minutos de caminhada em ritmo confortável, com alongamentos ao final.";
        } else if (i % 4 === 1) {
          title = "Intervalado leve";
          description =
            "Aquecimento de 10 minutos + 6–8 blocos de 1 minuto de corrida moderada e 2 minutos de caminhada.";
        } else if (i % 4 === 3) {
          title = "Corrida contínua leve";
          description =
            "25–35 minutos de corrida em ritmo confortável, mantendo respiração controlada.";
        } else {
          title = "Caminhada acelerada";
          description =
            "30–45 minutos de caminhada em ritmo acelerado, mantendo frequência cardíaca moderada.";
        }
        break;

      case "performance-5k":
        if (isRecoveryDay) {
          title = "Corrida regenerativa";
          description =
            "20–30 minutos de corrida bem leve, soltando as pernas sem foco em pace.";
        } else if (isSpeedDay) {
          title = "Tiros curtos (velocidade)";
          description =
            "Aquecimento de 10–15 minutos + 8–12 tiros de 200–400 m em ritmo forte, com trote leve entre as repetições.";
        } else if (i % 2 === 0) {
          title = "Tempo run / ritmo de prova";
          description =
            "Aquecimento + 15–20 minutos em ritmo próximo ao pace alvo de 5K + desaquecimento.";
        } else {
          title = "Rodagem leve";
          description =
            "30–40 minutos de corrida em ritmo confortável para acumular volume.";
        }
        break;

      case "performance-10k":
        if (isRecoveryDay) {
          title = "Corrida regenerativa";
          description =
            "25–35 minutos de corrida leve, facilitando a recuperação entre treinos intensos.";
        } else if (isSpeedDay) {
          title = "Intervalado forte";
          description =
            "Aquecimento + 6–8 repetições de 800–1.000 m em ritmo forte, com trote de recuperação entre as séries.";
        } else if (isLongRunDay) {
          title = "Longão progressivo";
          description =
            "12–18 km começando em ritmo confortável e finalizando próximo ao ritmo de prova.";
        } else {
          title = "Ritmo moderado";
          description =
            "40–50 minutos de corrida em ritmo moderado, consolidando capacidade de sustentar o pace.";
        }
        break;

      default:
        title = "Treino livre";
        description =
          "Dia livre para ajustar o volume, repetir um treino que funcionou bem ou incluir cross-training.";
    }

    plans.push({ day: i, title, description });
  }

  return plans;
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const group = getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  const heroImage = getGroupImage(group.slug);
  const plan = generate30DayPlan(group);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
      }}
    >
      {/* HERO */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "1024px",
          margin: "0 auto",
          padding: "16px 16px 0 16px",
        }}
      >
        <div
          style={{
            position: "relative",
            borderRadius: "20px",
            overflow: "hidden",
            height: "220px",
          }}
        >
          <img
            src={heroImage}
            alt={group.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          {/* Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(15,23,42,0.9), rgba(15,23,42,0.2))",
            }}
          />

          {/* Texto sobre a imagem */}
          <div
            style={{
              position: "absolute",
              left: "16px",
              right: "16px",
              bottom: "16px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                color: "#a5b4fc",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "4px",
              }}
            >
              {group.level}
            </p>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 800,
                marginBottom: "4px",
              }}
            >
              {group.title}
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "#e5e7eb",
                maxWidth: "520px",
              }}
            >
              {group.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div
        style={{
          maxWidth: "1024px",
          margin: "0 auto",
          padding: "16px",
          paddingTop: "18px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Card resumo do grupo */}
        <section
          style={{
            borderRadius: "16px",
            border: "1px solid #1e293b",
            background:
              "radial-gradient(circle at top left, #0f172a, #020617 60%)",
            padding: "16px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "6px",
            }}
          >
            Sobre este grupo
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "#cbd5e1",
              lineHeight: 1.5,
            }}
          >
            {group.description}
          </p>

          <p
            style={{
              marginTop: "10px",
              fontSize: "13px",
              color: "#22c55e",
            }}
          >
            Programa estruturado de 30 dias, com treinos organizados por
            intensidade, recuperação e evolução contínua.
          </p>
        </section>

        {/* Plano de 30 dias */}
        <section
          style={{
            borderRadius: "16px",
            border: "1px solid #1e293b",
            background: "#020617",
            padding: "16px",
          }}
        >
          <div
            style={{
              marginBottom: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              Desafio de 30 dias
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#94a3b8",
              }}
            >
              Use este plano como base automática para seus treinos diários. A
              sequência foi pensada para equilibrar estímulos, recuperação e
              progresso ao longo do mês.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "10px",
            }}
          >
            {plan.map((day) => (
              <div
                key={day.day}
                style={{
                  borderRadius: "10px",
                  border: "1px solid #1e293b",
                  background: "#020617",
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "8px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#a5b4fc",
                    }}
                  >
                    Dia {day.day}
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    Sessão programada
                  </p>
                </div>

                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    marginTop: "4px",
                    marginBottom: "2px",
                  }}
                >
                  {day.title}
                </p>

                <p
                  style={{
                    fontSize: "13px",
                    color: "#cbd5e1",
                    lineHeight: 1.4,
                  }}
                >
                  {day.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
