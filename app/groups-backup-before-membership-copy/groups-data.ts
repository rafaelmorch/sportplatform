// app/groups/groups-data.ts

// Slugs usados nas rotas
export type TrainingGroupSlug =
  | "marathon-42k"
  | "triathlon-endurance"
  | "beginners-running"
  | "weight-loss-running"
  | "performance-5k"
  | "performance-10k";

export type WeekPlan = {
  week: number;
  title: string;
  focus: string;
  description: string;
};

export type TwelveWeekPlan = {
  volumeLabel: string;
  weeks: WeekPlan[];
};

export type TrainingGroup = {
  slug: TrainingGroupSlug;
  title: string;
  shortDescription: string;
  longDescription: string;
  twelveWeekPlan?: TwelveWeekPlan;
};

// Lista fixa de grupos (app usa isso, e os planos detalhados vêm do Supabase)
export const trainingGroups: TrainingGroup[] = [
  {
    slug: "marathon-42k",
    title: "Maratona 42K",
    shortDescription:
      "Grupo voltado para corredores que já conseguem correr pelo menos 15 km e querem se preparar para uma maratona.",
    longDescription:
      "Foco em construir resistência, trabalhar ritmo constante e fortalecer a parte mental para encarar os 42 km. O grupo combina treinos longos, rodagens moderadas, treinos de ritmo e semanas de descarga para recuperação.",
    // Plano local de exemplo (o detalhado está no Supabase, mas deixamos esse aqui também)
    twelveWeekPlan: {
      volumeLabel: "Volume alvo: 40–60 km/semana ao final do ciclo",
      weeks: [
        {
          week: 1,
          title: "Semana 1 – Base leve",
          focus: "Adaptar o corpo ao volume",
          description:
            "3 treinos de corrida leve de 30–40 minutos + 1 sessão de fortalecimento geral. Objetivo é criar rotina sem preocupação com ritmo.",
        },
        {
          week: 2,
          title: "Semana 2 – Rotina consistente",
          focus: "Manter frequência",
          description:
            "3–4 treinos leves, incluindo 1 treino um pouco mais longo (50–60 minutos) em ritmo confortável.",
        },
        {
          week: 3,
          title: "Semana 3 – Primeiro longo",
          focus: "Aumentar o longo",
          description:
            "Rodagens leves durante a semana e 1 treino longo de 70–80 minutos no fim de semana, sempre em zona confortável.",
        },
        {
          week: 4,
          title: "Semana 4 – Consolidação",
          focus: "Consolidar volume",
          description:
            "Volume semelhante à semana 3, mantendo intensidade baixa. Atenção à recuperação (sono, hidratação e alimentação).",
        },
        {
          week: 5,
          title: "Semana 5 – Introdução de ritmo",
          focus: "Trabalhar limiar",
          description:
            "1 treino de ritmo (por exemplo 3×8 minutos em intensidade moderada) + longo de 90 minutos. Demais treinos em rodagens leves.",
        },
        {
          week: 6,
          title: "Semana 6 – Longo progressivo",
          focus: "Sustentar esforço por mais tempo",
          description:
            "Longo de 100–110 minutos com parte final um pouco mais forte, simulando o cansaço da prova. Restante da semana em rodagens regenerativas.",
        },
        {
          week: 7,
          title: "Semana 7 – Carga alta",
          focus: "Maior volume do ciclo até aqui",
          description:
            "Semana com 4 treinos, incluindo longo de até 120 minutos. Importante monitorar sinais de fadiga e ajustar se necessário.",
        },
        {
          week: 8,
          title: "Semana 8 – Semana de descarga",
          focus: "Recuperar para novo bloco",
          description:
            "Redução de aproximadamente 30% do volume total, mantendo apenas 1 treino um pouco mais forte. Semana para o corpo absorver a carga.",
        },
        {
          week: 9,
          title: "Semana 9 – Ritmo de prova",
          focus: "Testar ritmo alvo",
          description:
            "Treinos em ritmo próximo ao objetivo de prova (por exemplo, blocos de 3–5 km) + longo de 120–130 minutos em ritmo confortável.",
        },
        {
          week: 10,
          title: "Semana 10 – Pico de volume",
          focus: "Maior carga do ciclo",
          description:
            "Longo principal de 2h15–2h30, dependendo do nível do atleta, com rodagens leves nos outros dias. Importante planejar hidratação e nutrição como se fosse dia de prova.",
        },
        {
          week: 11,
          title: "Semana 11 – Início do taper",
          focus: "Reduzir volume mantendo intensidade",
          description:
            "Volume menor, mantendo alguns estímulos rápidos (tiros curtos) para preservar sensação de velocidade sem gerar fadiga.",
        },
        {
          week: 12,
          title: "Semana 12 – Semana de prova",
          focus: "Descanso ativo",
          description:
            "Rodagens bem leves, foco total em descanso, alimentação e sono. Últimos ajustes de estratégia de prova e logística do dia.",
        },
      ],
    },
  },
  {
    slug: "triathlon-endurance",
    title: "Triathlon Endurance",
    shortDescription:
      "Ideal para quem já pratica pelo menos duas modalidades e quer organizar melhor os treinos.",
    longDescription:
      "Para triatletas que querem estruturar os treinos de natação, ciclismo e corrida, equilibrando carga, transições e dias de recuperação para provas de short triathlon ou olímpico.",
  },
  {
    slug: "beginners-running",
    title: "Corrida para Beginners",
    shortDescription:
      "Perfeito para quem está começando do zero ou voltando depois de muito tempo parado.",
    longDescription:
      "Combina caminhada, trote leve e pequenos blocos de corrida contínua para chegar aos 5 km com segurança, respeitando o ritmo atual de cada atleta.",
  },
  {
    slug: "weight-loss-running",
    title: "Running & Weight Loss",
    shortDescription:
      "Foco em constância, intensidade controlada e aumento de gasto calórico.",
    longDescription:
      "Grupo voltado para quem quer emagrecer usando corrida e caminhada como ferramentas principais, sempre respeitando o nível atual e histórico de lesões.",
  },
  {
    slug: "performance-5k",
    title: "Performance 5K",
    shortDescription:
      "Grupo ideal para quem já corre 5 km e quer ficar mais rápido.",
    longDescription:
      "Treinos com foco em ritmo, tiros, intervalados e controle de carga para melhorar tempo em provas de 5 km sem perder consistência.",
  },
  {
    slug: "performance-10k",
    title: "Performance 10K",
    shortDescription:
      "Para atletas que já correm 8–10 km e querem evoluir tempo e resistência.",
    longDescription:
      "Estrutura de treinos intervalados, tempo run e rodagens em diferentes intensidades, ajudando a bater recordes pessoais nos 10 km.",
  },
];
