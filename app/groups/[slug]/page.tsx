// app/groups/[slug]/page.tsx
"use client";

import { notFound } from "next/navigation";
import { getGroupBySlug, TrainingGroup, TrainingGroupSlug } from "../groups-data";

type DayPlan = {
  day: number;
  title: string;
  description: string;
};

function generate30DayPlan(group: TrainingGroup): DayPlan[] {
  const plans: DayPlan[] = [];

  for (let i = 1; i <= 30; i++) {
    let title = "";
    let description = "";

    const isRecoveryDay = i % 7 === 0; // a cada 7 dias, regenerativo
    const isLongRunDay = (group.slug === "marathon" || group.slug === "performance-10k") && (i % 7 === 6);
    const isSpeedDay = (group.slug === "performance-5k" || group.slug === "performance-10k") && (i % 5 === 3);

    switch (group.slug) {
      case "beginners-running":
        if (isRecoveryDay) {
          title = "Dia de descanso ativo";
          description =
            "Caminhada leve de 20–30 minutos ou alongamentos. O objetivo é recuperar e manter o corpo em movimento.";
        } else if (i <= 10) {
          title = "Caminhada + trote leve";
          description =
            "Alternar 2 minutos de caminhada com 1 minuto de trote leve, repetindo por 20–25 minutos.";
        } else if (i <= 20) {
          title = "Blocos de corrida contínua";
          description =
            "Correr 5 minutos contínuos em ritmo confortável, seguidos de 2 minutos de caminhada. Repetir 4 vezes.";
        } else {
          title = "Rumo aos 5 km";
          description =
            "Correr 20–30 minutos contínuos em ritmo confortável. Se possível, medir a distância e aproximar dos 5 km.";
        }
        break;

      case "marathon":
        if (isRecoveryDay) {
          title = "Regenerativo + mobilidade";
          description =
            "Corrida bem leve de 20–30 minutos, seguida de 10 minutos de alongamentos e mobilidade.";
        } else if (isLongRunDay) {
          title = "Longão da semana";
          description =
            "Corrida longa em ritmo confortável, entre 18 e 28 km, dependendo do seu nível. Foco em ritmo constante.";
        } else {
          title = "Endurance em ritmo confortável";
          description =
            "Corrida contínua entre 8 e 14 km em ritmo confortável (Z2/Z3). Manter técnica e hidratação.";
        }
        break;

      case "triathlon":
        if (isRecoveryDay) {
          title = "Dia de técnica + core";
          description =
            "30 minutos de técnica (natação leve ou pedal girado) + 10–15 minutos de exercícios de core e estabilidade.";
        } else if (i % 3 === 1) {
          title = "Treino de natação";
          description =
            "Sessão de 1.500 a 2.500 m, com foco em técnica de braçada, respiração e séries moderadas.";
        } else if (i % 3 === 2) {
          title = "Treino de bike";
          description =
            "Pedal entre 45 e 90 minutos, ritmo moderado. Se possível, incluir subidas ou variações de cadência.";
        } else {
          title = "Brick run (corrida após bike)";
          description =
            "Corrida de 20–40 minutos logo após um pedal leve, simulando a transição da prova.";
        }
        break;

      case "weight-loss-running":
        if (isRecoveryDay) {
          title = "Caminhada ativa + mobilidade";
          description =
            "Caminhada em ritmo moderado por 30–40 minutos, seguida de alongamentos leves.";
        } else if (i % 4 === 1) {
          title = "Intervalado leve";
          description =
            "Aquecimento de 10 minutos + 6 a 8 blocos de 1 minuto de corrida moderada e 2 minutos de caminhada.";
        } else if (i % 4 === 3) {
          title = "Corrida contínua leve";
          description =
            "Corrida de 25–35 minutos em ritmo confortável, mantendo a respiração controlada.";
        } else {
          title = "Caminhada acelerada";
          description =
            "Caminhada em ritmo acelerado por 30–45 minutos, tentando manter frequência cardíaca moderada.";
        }
        break;

      case "performance-5k":
        if (isRecoveryDay) {
          title = "Corrida regenerativa";
          description =
            "20–30 minutos de corrida bem leve, apenas para soltar as pernas, sem preocupação com pace.";
        } else if (isSpeedDay) {
          title = "Tiros curtos (velocidade)";
          description =
            "Aquecimento de 10–15 minutos + 8 a 12 tiros de 200–400 m em ritmo forte, com trote leve entre eles.";
        } else if (i % 2 === 0) {
          title = "Tempo run / ritmo de prova";
          description =
            "Aquecimento + 15–20 minutos em ritmo próximo ao pace desejado para 5K + desaquecimento.";
        } else {
          title = "Rodagem leve";
          description =
            "Corrida de 30–40 minutos em ritmo confortável para acumular volume.";
        }
        break;

      case "performance-10k":
        if (isRecoveryDay) {
          title = "Corrida regenerativa";
          description =
            "25–35 minutos de corrida bem leve, soltando o corpo e recuperando dos treinos fortes.";
        } else if (isSpeedDay) {
          title = "Intervalado forte";
          description =
            "Aquecimento + 6 a 8 repetições de 800–1.000 m em ritmo forte, com trote de recuperação entre as séries.";
        } else if (isLongRunDay) {
          title = "Longão progressivo";
          description =
            "Corrida de 12–18 km começando em ritmo bem confortável e terminando próximo ao ritmo de prova.";
        } else {
          title = "Ritmo moderado";
          description =
            "Corrida de 40–50 minutos em ritmo moderado, mantendo boa técnica e controle de respiração.";
        }
        break;

      default:
        title = "Treino livre";
        description =
          "Dia de treino livre. Use este dia para ajustar volume ou repetir um treino que tenha funcionado bem para você.";
    }

    plans.push({ day: i, title, description });
  }

  return plans;
}

interface GroupPageProps {
  params: { slug: TrainingGroupSlug };
}

export default function GroupDetailPage({ params }: GroupPageProps) {
  const group = getGroupBySlug(params.slug);

  if (!group) {
    notFound();
  }

  const plan = generate30DayPlan(group);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "24px",
      }}
    >
      <header style={{ marginBottom: "20px" }}>
        <p
          style={{
            fontSize: "12px",
            color: "#a5b4fc",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "4px",
          }}
        >
          Grupo de treino • {group.level}
        </p>
        <h1 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "4px" }}>
          {group.title}
        </h1>
        <p style={{ color: "#94a3b8", marginBottom: "8px" }}>
          {group.subtitle}
        </p>
        <p style={{ color: "#9ca3af", maxWidth: "640px" }}>
          {group.description}
        </p>
        <p
          style={{
            marginTop: "12px",
            fontSize: "14px",
            color: "#22c55e",
          }}
        >
          Plano de 30 dias – desafios diários para você seguir e marcar sua
          evolução.
        </p>
      </header>

      {/* Lista de 30 dias */}
      <div
        style={{
          borderRadius: "14px",
          border: "1px solid #1e293b",
          background: "#020617",
          padding: "16px",
        }}
      >
        <h2
          style={{
            fontSize: "18px",
            marginBottom: "12px",
            fontWeight: 600,
          }}
        >
          Desafios – 30 dias
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "12px",
          }}
        >
          {plan.map((day) => (
            <div
              key={day.day}
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #1e293b",
                background: "#020617",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "#a5b4fc",
                  marginBottom: "4px",
                }}
              >
                Dia {day.day}
              </p>
              <p
                style={{
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                {day.title}
              </p>
              <p style={{ fontSize: "13px", color: "#cbd5e1" }}>
                {day.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
