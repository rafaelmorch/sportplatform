"use client";

import { notFound } from "next/navigation";
import { trainingPlans } from "../plans-data";
import { trainingGroups } from "../../groups/groups-data";

type PageProps = {
  params: { slug: string };
};

type WeekPlan = {
  week: number;
  title: string;
  description: string;
};

function generateWeeklyPlan(slug: string, durationWeeks: number): WeekPlan[] {
  const weeks: WeekPlan[] = [];

  for (let w = 1; w <= durationWeeks; w++) {
    let title = "";
    let description = "";

    switch (slug) {
      case "starter-5k":
        if (w === 1) {
          title = "Semana 1 – Início e adaptação";
          description =
            "Foco em caminhar e trotar leve, 3 sessões na semana. Construção de hábito e adaptação articular.";
        } else if (w === 2) {
          title = "Semana 2 – Mais tempo correndo";
          description =
            "Aumentar levemente o tempo de corrida contínua, alternando com caminhada. 3–4 sessões na semana.";
        } else if (w === 3) {
          title = "Semana 3 – Sustentando o trote";
          description =
            "Blocos maiores de corrida em ritmo confortável, com caminhadas menores. 4 sessões na semana.";
        } else {
          title = "Semana 4 – Rumo aos 5 km";
          description =
            "Tentar completar 20–30 minutos contínuos de corrida leve. Pelo menos 1 tentativa de 5 km na semana.";
        }
        break;

      case "premium-10k":
        if (w === 1) {
          title = "Semana 1 – Base e diagnóstico";
          description =
            "Rodagens leves de 30–45 min e 1 treino com ritmo um pouco mais forte para entender o nível atual.";
        } else if (w === 2) {
          title = "Semana 2 – Ritmo controlado";
          description =
            "Introdução de tempo run de 15–20 min próximo ao ritmo de prova, além de rodagem leve.";
        } else if (w === 3) {
          title = "Semana 3 – Intervalados de 10K";
          description =
            "Séries de 800–1.000 m em ritmo de prova ou um pouco mais forte, com recuperação trocada.";
        } else if (w === 4) {
          title = "Semana 4 – Consolidação de volume";
          description =
            "Rodagens de 45–60 min, mantendo boa técnica e aumentando a confiança na distância.";
        } else if (w === 5) {
          title = "Semana 5 – Ritmo forte e ajuste fino";
          description =
            "Treinos intervalados combinados com tempo run, já pensando na prova-alvo.";
        } else {
          title = "Semana 6 – Redução de volume e prova";
          description =
            "Redução do volume total, manutenção de intensidade e simulação de prova de 10 km.";
        }
        break;

      case "marathon-pro":
        if (w === 1) {
          title = "Semana 1 – Base organizada";
          description =
            "Rodagens leves e médias, longão moderado no fim de semana. Adaptação à rotina de treinos mais estruturada.";
        } else if (w === 2) {
          title = "Semana 2 – Volume em crescimento";
          description =
            "Aumento leve do volume semanal, introdução de um treino de ritmo contínuo (Z2/Z3).";
        } else if (w === 3) {
          title = "Semana 3 – Longão progressivo";
          description =
            "Longão maior com parte final um pouco mais forte, simulando o cansaço da prova.";
        } else if (w === 4) {
          title = "Semana 4 – Ritmo de maratona";
          description =
            "Treinos de tempo run em ritmo de maratona, além de rodagens médias.";
        } else if (w === 5) {
          title = "Semana 5 – Pico de volume";
          description =
            "Maior volume semanal do ciclo, com longão mais extenso (30–32 km, dependendo do nível).";
        } else if (w === 6) {
          title = "Semana 6 – Lapidação de ritmo";
          description =
            "Menos volume, mas manutenção de um treino forte de ritmo controlado.";
        } else if (w === 7) {
          title = "Semana 7 – Tapering (redução de carga)";
          description =
            "Redução mais significativa do volume, foco em chegar descansado e confiante na prova.";
        } else {
          title = "Semana 8 – Semana da prova";
          description =
            "Treinos curtos, leves e com alguns estímulos. Organização de logística, nutrição e estratégia de prova.";
        }
        break;

      case "triathlon-complete":
        if (w === 1) {
          title = "Semana 1 – Organização das 3 modalidades";
          description =
            "Distribuição básica de natação, bike e corrida ao longo da semana para entender a rotina.";
        } else if (w === 2) {
          title = "Semana 2 – Ajuste de intensidade";
          description =
            "Natação técnica, bike moderada e corrida leve, com 1 sessão combinada (brick leve).";
        } else if (w === 3) {
          title = "Semana 3 – Foco em ciclismo + corrida";
          description =
            "Maior ênfase em pedais mais longos e bricks com corrida curta logo após a bike.";
        } else if (w === 4) {
          title = "Semana 4 – Integração total";
          description =
            "Uma semana com simulação parcial de prova (ex.: natação + bike + corrida em blocos).";
        } else if (w === 5) {
          title = "Semana 5 – Intensidade controlada";
          description =
            "Sessões mais intensas nas três modalidades, com controle de carga e recuperação.";
        } else if (w === 6) {
          title = "Semana 6 – Simulação de prova";
          description =
            "Sessão longa que se aproxime da estrutura da prova alvo (short ou olímpico).";
        } else if (w === 7) {
          title = "Semana 7 – Redução de volume";
          description =
            "Redução do volume total, mantendo alguns estímulos fortes curtos.";
        } else {
          title = "Semana 8 – Semana de prova";
          description =
            "Foco em descanso, técnica leve e preparação mental para a prova.";
        }
        break;

      case "weight-loss-plus":
        if (w === 1) {
          title = "Semana 1 – Início de rotina ativa";
          description =
            "Caminhadas aceleradas 3–4x na semana, introdução de pequenos blocos de trote para quem se sentir confortável.";
        } else if (w === 2) {
          title = "Semana 2 – Aumento de intensidade";
          description =
            "Treinos intervalados leves (caminhada + trote) e manutenção de caminhadas mais longas.";
        } else if (w === 3) {
          title = "Semana 3 – Consistência de treinos";
          description =
            "Mesclar treinos intervalados com caminhadas longas, focando em não pular sessões.";
        } else {
          title = "Semana 4 – Consolidação da rotina";
          description =
            "Manter frequência de treinos estável, com ênfase em percepção de esforço e bem-estar.";
        }
        break;

      default:
        title = `Semana ${w}`;
        description =
          "Plano dessa semana será ajustado de acordo com sua evolução e feedback.";
    }

    weeks.push({ week: w, title, description });
  }

  return weeks;
}

export default function PlanDetailPage({ params }: PageProps) {
  const plan = trainingPlans.find((p) => p.slug === params.slug);

  if (!plan) {
    notFound();
  }

  const groups = trainingGroups.filter((g) =>
    plan.recommendedGroups.includes(g.slug)
  );

  const weeklyPlan = generateWeeklyPlan(plan.slug, plan.durationWeeks);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "24px",
      }}
    >
      <header style={{ marginBottom: "24px" }}>
        <p
          style={{
            fontSize: "12px",
            color: "#a5b4fc",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "4px",
          }}
        >
          Plano de treino • {plan.level}
        </p>
        <h1 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "4px" }}>
          {plan.title}
        </h1>
        <p style={{ color: "#94a3b8", marginBottom: "8px" }}>
          {plan.subtitle}
        </p>
        <p style={{ color: "#9ca3af", maxWidth: "640px" }}>
          {plan.description}
        </p>

        <div
          style={{
            marginTop: "12px",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <p
            style={{
              fontSize: "22px",
              fontWeight: 700,
            }}
          >
            ${plan.pricePerMonth}
            <span
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                marginLeft: "4px",
              }}
            >
              / mês
            </span>
          </p>
          <p style={{ fontSize: "13px", color: "#9ca3af" }}>
            Duração: {plan.durationWeeks} semanas
          </p>
        </div>

        {/* Botão de CTA */}
        <div style={{ marginTop: "14px" }}>
          <a
            href={`mailto:support@sportplatform.app?subject=Interesse no plano ${encodeURIComponent(
              plan.title
            )}`}
            style={{
              display: "inline-block",
              padding: "9px 16px",
              borderRadius: "999px",
              border: "none",
              background: "#22c55e",
              color: "#020617",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            Quero este treino
          </a>
        </div>

        {/* Grupos indicados */}
        <div style={{ marginTop: "16px" }}>
          <p
            style={{
              fontSize: "12px",
              color: "#9ca3af",
              marginBottom: "4px",
            }}
          >
            Indicado para os grupos:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {groups.map((g) => (
              <a key={g.slug} href={`/groups/${g.slug}`}>
                <span
                  style={{
                    fontSize: "11px",
                    padding: "4px 8px",
                    borderRadius: "999px",
                    border: "1px solid #334155",
                    background: "#020617",
                    cursor: "pointer",
                  }}
                >
                  {g.title}
                </span>
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* Destaques */}
      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "18px",
            marginBottom: "8px",
            fontWeight: 600,
          }}
        >
          O que está incluído
        </h2>
        <ul
          style={{
            listStyle: "disc",
            paddingLeft: "18px",
            fontSize: "13px",
            color: "#e5e7eb",
          }}
        >
          {plan.highlights.map((item, idx) => (
            <li key={idx} style={{ marginBottom: "4px" }}>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Plano por semana */}
      <section>
        <h2
          style={{
            fontSize: "18px",
            marginBottom: "8px",
            fontWeight: 600,
          }}
        >
          Estrutura semana a semana
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "12px",
          }}
        >
          {weeklyPlan.map((week) => (
            <div
              key={week.week}
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
                Semana {week.week}
              </p>
              <p
                style={{
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                {week.title}
              </p>
              <p style={{ fontSize: "13px", color: "#cbd5e1" }}>
                {week.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
