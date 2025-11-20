// app/groups/[slug]/page.tsx
import BottomNavbar from "@/components/BottomNavbar";

type GroupPageProps = {
  params: { slug: string };
};

type GroupContent = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  levelLabel: string;
  tags: string[];
  challenge?: {
    description: string;
    mainMetric: string;
  };
};

const GROUPS: Record<string, GroupContent> = {
  "beginners-running": {
    slug: "beginners-running",
    title: "Beginners Running",
    shortDescription: "Grupo para quem está começando agora na corrida.",
    description:
      "Foco em criar base sólida de corrida e caminhada, com muita orientação de ritmo leve, progressão suave e atenção total à consistência. Ideal para quem está dando os primeiros passos ou voltando depois de um tempo parado.",
    levelLabel: "Iniciante",
    tags: ["Base aeróbia", "Corrida + caminhada", "Hábito diário"],
    challenge: {
      description:
        "Completar 30 dias de movimento (corrida ou caminhada) com pelo menos 20 minutos de atividade.",
      mainMetric: "Dias ativos em 30 dias",
    },
  },
  marathon: {
    slug: "marathon",
    title: "Maratona",
    shortDescription: "Comunidade focada em preparação para maratonas.",
    description:
      "Espaço para quem está treinando para sua primeira maratona ou buscando melhorar tempo. Troca de experiências sobre longões, nutrição de prova, recuperação e estratégias de ritmo.",
    levelLabel: "Intermediário / Avançado",
    tags: ["Longão", "Endurance", "Prova-alvo"],
    challenge: {
      description:
        "Completar 4 longões em 30 dias, com progressão de distância ou tempo.",
      mainMetric: "Longões concluídos",
    },
  },
  triathlon: {
    slug: "triathlon",
    title: "Triathlon",
    shortDescription: "Grupo para quem treina natação, ciclismo e corrida.",
    description:
      "Organização de rotina multi-esporte, com foco em encaixar natação, bike e corrida dentro da semana. Espaço para discutir transições, treinos brick e estratégias de prova em diferentes distâncias.",
    levelLabel: "Intermediário",
    tags: ["Multiesporte", "Transições", "Brick sessions"],
    challenge: {
      description:
        "Realizar pelo menos 2 treinos combinados (brick) por semana ao longo de 4 semanas.",
      mainMetric: "Treinos combinados",
    },
  },
  "weight-loss-running": {
    slug: "weight-loss-running",
    title: "Running for Weight Loss",
    shortDescription: "Foco em perda de peso com corrida e caminhada estruturadas.",
    description:
      "Grupo para quem quer usar a corrida (e caminhada) como ferramenta de controle de peso, com abordagem cuidadosa de carga, recuperação e acompanhamento de evolução sem extremos.",
    levelLabel: "Todos os níveis",
    tags: ["Perda de peso", "Baixa intensidade", "Consistência"],
    challenge: {
      description:
        "Acumular pelo menos 10 horas de movimento leve/moderado ao longo de 30 dias.",
      mainMetric: "Tempo em movimento",
    },
  },
  "performance-5k": {
    slug: "performance-5k",
    title: "Performance 5K",
    shortDescription: "Comunidade focada em baixar tempo nos 5 km.",
    description:
      "Aqui o foco é velocidade controlada, treinos intervalados bem desenhados e estratégias para provas de 5K. Ideal para quem já corre e quer ver o cronômetro descer.",
    levelLabel: "Intermediário",
    tags: ["Velocidade", "Intervalado", "Controle de ritmo"],
    challenge: {
      description:
        "Executar 2 sessões de treino de ritmo/intervalado por semana durante 4 semanas.",
      mainMetric: "Sessões de intensidade concluídas",
    },
  },
  "performance-10k": {
    slug: "performance-10k",
    title: "Performance 10K",
    shortDescription: "Foco em performance e controle de ritmo em 10K.",
    description:
      "Grupo para atletas que já correm com regularidade e querem trabalhar resistência em ritmo forte, controle de pace e estratégia de prova em 10 quilômetros.",
    levelLabel: "Intermediário / Avançado",
    tags: ["Tempo run", "Progressivo", "Controle de carga"],
    challenge: {
      description:
        "Finalizar pelo menos 3 treinos tempo run ou progressivos em 4 semanas.",
      mainMetric: "Sessões chave concluídas",
    },
  },
};

export default function GroupDetailPage({ params }: GroupPageProps) {
  const group = GROUPS[params.slug];

  if (!group) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "#e5e7eb",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <main
          style={{
            flex: 1,
            padding: "16px",
            paddingBottom: "72px",
          }}
        >
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 800,
                marginBottom: "8px",
              }}
            >
              Grupo não encontrado
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "#94a3b8",
                marginBottom: "12px",
              }}
            >
              Não encontramos este grupo. Verifique o link ou volte para a lista
              de grupos.
            </p>
            <a
              href="/groups"
              style={{
                fontSize: "13px",
                padding: "8px 16px",
                borderRadius: "999px",
                background: "#22c55e",
                color: "#020617",
                textDecoration: "none",
                fontWeight: 600,
                display: "inline-block",
              }}
            >
              Voltar para grupos
            </a>
          </div>
        </main>
        <BottomNavbar />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <main
        style={{
          flex: 1,
          padding: "16px",
          paddingBottom: "72px",
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          {/* Header */}
          <header
            style={{
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  marginBottom: "4px",
                }}
              >
                {group.title}
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                }}
              >
                {group.shortDescription}
              </p>
            </div>

            <a
              href="/groups"
              style={{
                fontSize: "12px",
                color: "#e5e7eb",
                textDecoration: "none",
              }}
            >
              Ver todos os grupos
            </a>
          </header>

          {/* Tags / nível */}
          <section
            style={{
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderRadius: "999px",
                  border: "1px solid #1e293b",
                  color: "#a5b4fc",
                }}
              >
                {group.levelLabel}
              </span>

              {group.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: "11px",
                    padding: "3px 8px",
                    borderRadius: "999px",
                    background: "#020617",
                    border: "1px solid #1f2937",
                    color: "#9ca3af",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>

          {/* Objetivo + foco */}
          <section
            style={{
              borderRadius: "16px",
              border: "1px solid #1e293b",
              background: "#020617",
              padding: "14px",
              marginBottom: "14px",
            }}
          >
            <h2
              style={{
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              Objetivo do grupo
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#cbd5e1",
                marginBottom: "8px",
              }}
            >
              {group.description}
            </p>
          </section>

          {/* Desafio */}
          {group.challenge && (
            <section
              style={{
                borderRadius: "16px",
                border: "1px solid #1e293b",
                background:
                  "radial-gradient(circle at top, #0f172a, #020617 60%)",
                padding: "14px",
                marginBottom: "14px",
              }}
            >
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  marginBottom: "6px",
                }}
              >
                Desafio de 30 dias
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "#cbd5e1",
                  marginBottom: "8px",
                }}
              >
                {group.challenge.description}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                }}
              >
                Foco principal: {group.challenge.mainMetric}
              </p>
            </section>
          )}

          {/* Conexão com planos */}
          <section
            style={{
              borderRadius: "16px",
              border: "1px solid #1e293b",
              background: "#020617",
              padding: "14px",
            }}
          >
            <h2
              style={{
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              Como o treino entra na rotina
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#cbd5e1",
                marginBottom: "8px",
              }}
            >
              Cada atleta pode conectar seu plano de treino favorito com este
              grupo, acompanhar evolução e comparar métricas com pessoas com
              objetivos semelhantes.
            </p>
            <a
              href="/plans"
              style={{
                display: "inline-block",
                marginTop: "4px",
                fontSize: "13px",
                padding: "8px 14px",
                borderRadius: "999px",
                background: "#22c55e",
                color: "#020617",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Ver planos disponíveis
            </a>
          </section>
        </div>
      </main>

      <BottomNavbar />
    </div>
  );
}
