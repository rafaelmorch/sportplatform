// app/plans/plans-data.ts

// ❌ Removemos o import tipado para simplificar por enquanto
// import type { TrainingGroupSlug } from "../groups/groups-data";

export type TrainingPlanSlug =
  | "starter-5k"
  | "premium-10k"
  | "marathon-pro"
  | "triathlon-complete"
  | "weight-loss-plus";

export type TrainingPlan = {
  slug: TrainingPlanSlug;
  title: string;
  subtitle: string;
  pricePerMonth: number;
  durationWeeks: number;
  level: "Beginner" | "Intermediate" | "Advanced" | "Mixed";
  description: string;
  // 👉 por enquanto, só string[]
  recommendedGroups: string[];
  highlights: string[];
};

export const trainingPlans: TrainingPlan[] = [
  {
    slug: "starter-5k",
    title: "Starter 5K",
    subtitle: "Plano básico para completar seus primeiros 5 km",
    pricePerMonth: 39,
    durationWeeks: 4,
    level: "Beginner",
    description:
      "Perfeito para quem está começando na corrida e quer completar 5 km com segurança, seguindo um plano simples e objetivo.",
    recommendedGroups: ["beginners-running", "weight-loss-running"],
    highlights: [
      "Plano de 4 semanas focado em progressão segura",
      "2 a 4 treinos por semana",
      "Suporte por e-mail 1x por semana",
    ],
  },
  {
    slug: "premium-10k",
    title: "Premium 10K",
    subtitle: "Estrutura profissional para baixar tempo nos 10 km",
    pricePerMonth: 59,
    durationWeeks: 6,
    level: "Intermediate",
    description:
      "Para quem já corre 5–8 km e quer estruturar treinos para evoluir nos 10 km, com foco em ritmo e consistência.",
    recommendedGroups: ["performance-10k", "performance-5k"],
    highlights: [
      "Plano de 6 semanas com treinos intervalados e tempo run",
      "3 a 5 treinos por semana",
      "Feedback mensal por vídeo/análise",
    ],
  },
  {
    slug: "marathon-pro",
    title: "Marathon Pro",
    subtitle: "Preparação específica para maratona",
    pricePerMonth: 89,
    durationWeeks: 8,
    level: "Advanced",
    description:
      "Indicado para corredores experientes que querem se preparar com qualidade para uma maratona, com longões e treinos de ritmo.",
    recommendedGroups: ["marathon-42k", "performance-10k"],
    highlights: [
      "Plano de 8 semanas com foco em endurance",
      "Longões progressivos e treinos de ritmo",
      "Ajuste individual 1x por mês",
    ],
  },
  {
    slug: "triathlon-complete",
    title: "Triathlon Complete",
    subtitle: "Integração de natação, bike e corrida",
    pricePerMonth: 99,
    durationWeeks: 8,
    level: "Intermediate",
    description:
      "Para triatletas amadores que querem organizar melhor os treinos das três modalidades, com equilíbrio de carga.",
    recommendedGroups: ["triathlon-endurance"],
    highlights: [
      "Plano de 8 semanas com treinos combinados",
      "Brick sessions (bike + corrida)",
      "Sugestão de sessões de natação e força",
    ],
  },
  {
    slug: "weight-loss-plus",
    title: "Weight Loss Plus",
    subtitle: "Corrida, caminhada e rotina ativa para emagrecimento",
    pricePerMonth: 49,
    durationWeeks: 4,
    level: "Mixed",
    description:
      "Ideal para quem quer usar a corrida e a caminhada como ferramenta de perda de peso de forma organizada.",
    recommendedGroups: ["weight-loss-running", "beginners-running"],
    highlights: [
      "Plano de 4 semanas com treinos intervalados leves",
      "Recomendações de rotina ativa no dia a dia",
      "Foco em constância e aumento de gasto calórico",
    ],
  },
];
