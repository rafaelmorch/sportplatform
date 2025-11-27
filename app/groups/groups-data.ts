// app/groups/groups-data.ts

export type TrainingGroup = {
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  includedChallengeSummary: string;
  challengeId: string; // challenges.id no Supabase
  weeklyPlan: string[]; // resumo progressivo das 12 semanas
};

export const trainingGroups: TrainingGroup[] = [
  {
    slug: "maratona-42k",
    title: "Maratona 42K",
    shortDescription:
      "Grupo voltado para corredores que já conseguem correr pelo menos 15 km com conforto e querem se preparar para uma maratona completa.",
    longDescription:
      "Foco em construir resistência, trabalhar ritmo constante e fortalecer a parte mental para encarar os 42 km. O grupo combina treinos longos, rodagens moderadas, treinos de ritmo e semanas de descarga para recuperação.",
    includedChallengeSummary: "Desafio de 12 semanas com pico entre 30 e 34 km.",
    challengeId: "UUID_DA_MARATONA_42K", // 🔹 TROCAR pelo ID real em public.challenges

    weeklyPlan: [
      "Semanas 1–3: Base aeróbia, 4–5 treinos por semana, longões até 18–20 km.",
      "Semanas 4–6: Aumento gradual do volume total, longões em torno de 24 km e treinos de ritmo controlado.",
      "Semanas 7–9: Pico de carga, longões entre 28–34 km, simulações de prova e trabalho mental.",
      "Semanas 10–11: Redução gradual do volume, mantendo intensidade moderada para chegar descansado.",
      "Semana 12: Taper final, treinos leves, ajuste de estratégia de prova e foco total em recuperação."
    ]
  },
  {
    slug: "triathlon-endurance",
    title: "Triathlon Endurance",
    shortDescription:
      "Para quem já pratica pelo menos duas das três modalidades e quer organizar melhor os treinos para provas short ou olímpicas.",
    longDescription:
      "O foco é equilibrar natação, ciclismo e corrida sem sobrecarregar o atleta. O plano traz treinos combinados (brick), sessões técnicas e semanas de foco em cada modalidade para desenvolver endurance e eficiência.",
    includedChallengeSummary:
      "Programa de 12 semanas para provas short/olímpicas com bricks estruturados.",
    challengeId: "UUID_DO_TRIATHLON_ENDURANCE",

    weeklyPlan: [
      "Semanas 1–3: Base técnica, 2x natação, 2x bike, 2x corrida por semana.",
      "Semanas 4–6: Introdução de bricks curtos (bike + corrida), foco em cadência e técnica.",
      "Semanas 7–9: Bricks mais longos, treinos específicos em ritmo de prova e simulações.",
      "Semanas 10–11: Redução de volume, mantendo algumas passadas em ritmo de prova.",
      "Semana 12: Semana de prova, treinos leves, ajustes finos de transições e logística."
    ]
  },
  {
    slug: "corrida-para-beginners",
    title: "Corrida para Beginners",
    shortDescription:
      "Perfeito para quem está começando do zero ou voltando depois de muito tempo parado. Caminhada, trote leve e pequenos blocos de corrida para chegar aos 5 km contínuos.",
    longDescription:
      "Plano pensado para ser amigável, progressivo e seguro. Começa com mais caminhada do que corrida e, semana a semana, inverte essa relação até que o atleta consiga correr 5 km sem parar.",
    includedChallengeSummary:
      "Desafio de 12 semanas para sair do zero e completar 5 km com conforto.",
    challengeId: "UUID_DO_BEGGINERS",

    weeklyPlan: [
      "Semanas 1–3: Combinação de caminhada e trote leve (ex.: 1 min correr / 2 min caminhar).",
      "Semanas 4–6: Aumenta o tempo correndo e reduz a caminhada, mantendo 3–4 sessões por semana.",
      "Semanas 7–9: Blocos maiores de corrida contínua, chegando a 20–25 minutos correndo.",
      "Semanas 10–11: Corridas contínuas entre 25–35 minutos, ajustes de ritmo e respiração.",
      "Semana 12: Semana de consolidação com um treino alvo de 5 km contínuos."
    ]
  },
  {
    slug: "running-weight-loss",
    title: "Running & Weight Loss",
    shortDescription:
      "Foco em constância, intensidade controlada e aumento de gasto calórico, sempre respeitando o nível atual do atleta.",
    longDescription:
      "Combinação de rodagens leves, treinos intervalados moderados e caminhadas ativas para aumentar o gasto calórico semanal sem exageros. Também incentiva sono, hidratação e rotina saudável.",
    includedChallengeSummary:
      "Desafio de 12 semanas com foco em consistência e evolução gradual.",
    challengeId: "UUID_DO_WEIGHT_LOSS",

    weeklyPlan: [
      "Semanas 1–3: 3 sessões por semana, com mistura de caminhada e corrida leve.",
      "Semanas 4–6: 4 sessões por semana, introduzindo intervalados suaves (ex.: 2 min forte / 2 min leve).",
      "Semanas 7–9: Aumento do tempo total ativo na semana, com um treino mais longo no fim de semana.",
      "Semanas 10–11: Mantém volume, melhora ligeiramente a intensidade para elevar o gasto calórico.",
      "Semana 12: Consolidação, mantendo rotina estável e preparando o próximo ciclo."
    ]
  },
  {
    slug: "performance-5k",
    title: "Performance 5K",
    shortDescription:
      "Grupo ideal para quem já corre 5 km e quer ficar mais rápido, com treinos intervalados, tiros e ritmos controlados.",
    longDescription:
      "Plano desenhado para melhorar o tempo nos 5 km. Combina treinos de ritmo, tiros curtos e médios, além de rodagem leve para recuperação. Ideal para quem quer baixar minutos (ou segundos) do seu melhor tempo.",
    includedChallengeSummary:
      "Ciclo de 12 semanas com foco em velocidade e ritmo de prova.",
    challengeId: "UUID_DO_PERFORMANCE_5K",

    weeklyPlan: [
      "Semanas 1–3: Construção de base, rodagens leves e alguns intervalados curtos.",
      "Semanas 4–6: Tiros médios em ritmo um pouco mais forte que o 5K alvo.",
      "Semanas 7–9: Sessões específicas em ritmo de prova e treinos progressivos.",
      "Semanas 10–11: Redução leve de volume, mantendo estímulo de velocidade.",
      "Semana 12: Afinar para a prova alvo, com 1 ou 2 treinos curtos em ritmo forte e muito descanso."
    ]
  },
  {
    slug: "performance-10k",
    title: "Performance 10K",
    shortDescription:
      "Para atletas que já correm 8–10 km e querem estruturar melhor os treinos para evoluir tempo e consistência.",
    longDescription:
      "O foco é melhorar o ritmo médio dos 10 km, com treinos de tempo run, intervalados e rodagens controladas. Combina força, resistência e ritmo para competir melhor nas provas de 10K.",
    includedChallengeSummary:
      "Ciclo de 12 semanas para baixar tempo nos 10 km.",
    challengeId: "UUID_DO_PERFORMANCE_10K",

    weeklyPlan: [
      "Semanas 1–3: Base aeróbia, rodagens entre 6–8 km e alguns blocos moderados.",
      "Semanas 4–6: Tempo run (treinos contínuos em ritmo firme) e intervalados médios.",
      "Semanas 7–9: Treinos em ritmo de prova e algumas sessões acima do ritmo alvo.",
      "Semanas 10–11: Redução de volume, mantendo intensidade em menor quantidade.",
      "Semana 12: Semana de prova com treinos curtos, leves e alguns estímulos rápidos."
    ]
  }
];
