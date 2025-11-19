// app/groups/groups-data.ts

export type TrainingGroupSlug =
  | "marathon"
  | "triathlon"
  | "beginners-running"
  | "weight-loss-running"
  | "performance-5k"
  | "performance-10k";

export type TrainingGroup = {
  slug: TrainingGroupSlug;
  title: string;
  subtitle: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Mixed";
  focus: string;
  description: string;
};

export const trainingGroups: TrainingGroup[] = [
  {
    slug: "marathon",
    title: "Maratona 42K",
    subtitle: "Plano de 30 dias focado em endurance",
    level: "Advanced",
    focus: "Aumentar volume e resistência específica para maratona.",
    description:
      "Grupo voltado para corredores que já conseguem correr pelo menos 15 km com conforto e querem se preparar para uma maratona. O foco é construir resistência, trabalhar ritmo constante e fortalecer a parte mental.",
  },
  {
    slug: "triathlon",
    title: "Triathlon Endurance",
    subtitle: "Corrida, bike e natação em 30 dias",
    level: "Intermediate",
    focus:
      "Integrar corrida, ciclismo e natação em uma rotina equilibrada para triatletas amadores.",
    description:
      "Ideal para quem já pratica pelo menos duas das três modalidades e quer organizar melhor os treinos para provas de short triathlon ou olímpico.",
  },
  {
    slug: "beginners-running",
    title: "Corrida para Beginners",
    subtitle: "Do sofá aos 5K em 30 dias",
    level: "Beginner",
    focus:
      "Construir o hábito de correr de forma progressiva e segura para iniciantes.",
    description:
      "Perfeito para quem está começando do zero ou voltando depois de muito tempo parado. Combina caminhada, trote leve e pequenos blocos de corrida para chegar aos 5 km contínuos.",
  },
  {
    slug: "weight-loss-running",
    title: "Running & Weight Loss",
    subtitle: "30 dias para acelerar o metabolismo",
    level: "Mixed",
    focus:
      "Combinar treinos intervalados, corridas leves e caminhadas ativas para auxiliar no processo de perda de peso.",
    description:
      "Foco em constância, intensidade controlada e aumento de gasto calórico, sempre respeitando o nível atual do atleta.",
  },
  {
    slug: "performance-5k",
    title: "Performance 5K",
    subtitle: "30 dias para baixar o tempo nos 5 km",
    level: "Intermediate",
    focus:
      "Melhorar pace, VO2max e capacidade de manter ritmo forte em provas curtas.",
    description:
      "Grupo ideal para quem já corre 5 km e quer ficar mais rápido, com treinos intervalados, tiros e ritmos controlados.",
  },
  {
    slug: "performance-10k",
    title: "Performance 10K",
    subtitle: "30 dias de foco em ritmo e resistência",
    level: "Intermediate",
    focus:
      "Aprimorar ritmo de prova nos 10 km com treinos progressivos e controle de intensidade.",
    description:
      "Para atletas que já correm 8–10 km e querem estruturar melhor os treinos para evoluir tempo e consistência.",
  },
];

export function getGroupBySlug(slug: string): TrainingGroup | undefined {
  return trainingGroups.find((g) => g.slug === slug);
}
