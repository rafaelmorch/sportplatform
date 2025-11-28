// app/groups/groups-data.ts

// Slugs usados nas rotas, planos, etc.
export type TrainingGroupSlug =
  | "marathon-42k"
  | "triathlon-endurance"
  | "beginners-running"
  | "weight-loss-running"
  | "performance-5k"
  | "performance-10k";

// Uma semana do plano de 12 semanas
export type WeekPlan = {
  week: number;
  title: string;
  focus: string;
  description: string;
};

// Estrutura do plano de 12 semanas
export type TwelveWeekPlan = {
  volumeLabel: string;
  weeks: WeekPlan[];
};

// Estrutura de um grupo de treino
export type TrainingGroup = {
  slug: TrainingGroupSlug;
  /** Nome exibido nos cards / páginas de grupo */
  name: string;
  /** Alias para compatibilidade com páginas que usam `title` (ex.: checkout) */
  title: string;
  shortDescription: string;
  longDescription: string;
  // challengeId no Supabase (pode deixar null por enquanto)
  challengeId: string | null;
  // plano de 12 semanas (opcional – se não tiver, mostra mensagem “em breve”)
  twelveWeekPlan?: TwelveWeekPlan;
};

// Lista de grupos disponíveis na tela /groups
export const trainingGroups: TrainingGroup[] = [
  // ---------------------------------------------------------------------------
  // MARATONA 42K
  // ---------------------------------------------------------------------------
  {
    slug: "marathon-42k",
    name: "Maratona 42K",
    title: "Maratona 42K",
    shortDescription:
      "Grupo voltado para corredores que já conseguem correr pelo menos 15 km e querem se preparar para uma maratona.",
    longDescription:
      "Foco em construir resistência, trabalhar ritmo constante e fortalecer a parte mental para encarar os 42 km. O grupo combina treinos longos, rodagens moderadas, treinos de ritmo e semanas de descarga para recuperação.",
    challengeId: null,
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

  // ---------------------------------------------------------------------------
  // TRIATHLON ENDURANCE
  // ---------------------------------------------------------------------------
  {
    slug: "triathlon-endurance",
    name: "Triathlon Endurance",
    title: "Triathlon Endurance",
    shortDescription:
      "Ideal para quem já pratica pelo menos duas modalidades e quer organizar melhor os treinos.",
    longDescription:
      "Para triatletas que querem estruturar os treinos de natação, ciclismo e corrida, equilibrando carga, transições e dias de recuperação para provas de short triathlon ou olímpico.",
    challengeId: null,
    twelveWeekPlan: {
      volumeLabel: "Volume alvo: 3–4 sessões por modalidade por semana",
      weeks: [
        {
          week: 1,
          title: "Semana 1 – Base técnica",
          focus: "Ajustar técnica nas três modalidades",
          description:
            "Natação técnica (drills), pedal leve de 60–90 minutos e corrida leve de 30 minutos. Transição apenas simulada, sem pressão de tempo.",
        },
        {
          week: 2,
          title: "Semana 2 – Rotina triathlon",
          focus: "Criar consistência semanal",
          description:
            "2 sessões de natação, 2–3 de bike e 2 de corrida, todas em intensidade leve a moderada. Uma sessão de fortalecimento geral.",
        },
        {
          week: 3,
          title: "Semana 3 – Primeiros bricks",
          focus: "Introduzir transições bike + corrida",
          description:
            "1 treino de brick curto (40–50 min bike + 10–15 min corrida) + treinos individuais fáceis nas outras sessões.",
        },
        {
          week: 4,
          title: "Semana 4 – Consolidação de volume",
          focus: "Aumentar ligeiramente o tempo total",
          description:
            "Pedais de até 2h em ritmo confortável, natação progressiva e corrida com 1 treino um pouco mais longo (40–50 min).",
        },
        {
          week: 5,
          title: "Semana 5 – Intensidade moderada",
          focus: "Trabalhar ritmo de prova",
          description:
            "Séries moderadas na natação, treinos de bike com blocos em zona de limiar e corrida com tiros curtos controlados.",
        },
        {
          week: 6,
          title: "Semana 6 – Bricks mais longos",
          focus: "Simular fadiga de prova",
          description:
            "Brick principal: 1h30 bike + 20–25 min corrida em ritmo confortável. Restante da semana com foco em técnica e recuperação.",
        },
        {
          week: 7,
          title: "Semana 7 – Carga alta",
          focus: "Maior carga combinada do ciclo",
          description:
            "3 sessões fortes ao longo da semana (uma em cada modalidade) com ênfase em manter técnica sob fadiga.",
        },
        {
          week: 8,
          title: "Semana 8 – Descarga ativa",
          focus: "Baixar volume mantendo a frequência",
          description:
            "Redução de 30–40% do volume, mantendo alguma intensidade curta. Ideal para absorver a carga das semanas anteriores.",
        },
        {
          week: 9,
          title: "Semana 9 – Simulação de prova",
          focus: "Testar estratégia",
          description:
            "Treino contínuo somando as três modalidades em volume próximo ao da prova-alvo (por exemplo 70–80% da distância).",
        },
        {
          week: 10,
          title: "Semana 10 – Ajustes finos",
          focus: "Trabalhar pontos fracos",
          description:
            "Ênfase na modalidade mais fraca do atleta (ex.: mais técnica de natação ou economia de corrida).",
        },
        {
          week: 11,
          title: "Semana 11 – Taper",
          focus: "Reduzir volume e manter confiança",
          description:
            "Sessões curtas com pequenos estímulos em ritmo de prova. Muito foco em sono, nutrição e logística.",
        },
        {
          week: 12,
          title: "Semana 12 – Semana da prova",
          focus: "Chegar descansado no dia P",
          description:
            "Treinos bem leves, apenas para manter a sensação de movimento. Revisar transições, material e estratégia de prova.",
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // CORRIDA PARA BEGINNERS
  // ---------------------------------------------------------------------------
  {
    slug: "beginners-running",
    name: "Corrida para Beginners",
    title: "Corrida para Beginners",
    shortDescription:
      "Perfeito para quem está começando do zero ou voltando depois de muito tempo parado.",
    longDescription:
      "Combina caminhada, trote leve e pequenos blocos de corrida contínua para chegar aos 5 km com segurança, respeitando o ritmo atual de cada atleta.",
    challengeId: null,
    twelveWeekPlan: {
      volumeLabel: "Volume alvo: 3 sessões semanais até correr 30–35 min contínuos",
      weeks: [
        {
          week: 1,
          title: "Semana 1 – Início do movimento",
          focus: "Sair do zero com segurança",
          description:
            "3 sessões de 20–30 minutos com blocos de caminhada + trote bem leve (ex.: 1 min corrida / 4 min caminhada).",
        },
        {
          week: 2,
          title: "Semana 2 – Criar hábito",
          focus: "Manter frequência 3x na semana",
          description:
            "Mesma estrutura da semana 1, mas com um pouco mais de blocos de trote (ex.: 2 min corrida / 3 min caminhada).",
        },
        {
          week: 3,
          title: "Semana 3 – Progredir devagar",
          focus: "Aumentar tempo de trote",
          description:
            "Blocos de 3 min corrida / 2 min caminhada, totalizando 25–30 minutos. Ritmo confortável, sem preocupação com pace.",
        },
        {
          week: 4,
          title: "Semana 4 – Primeiros blocos contínuos",
          focus: "Diminuir as caminhadas",
          description:
            "1 treino com 10–12 minutos contínuos bem lentos + outros 2 treinos com intervalos 4/1 (corrida/caminhada).",
        },
        {
          week: 5,
          title: "Semana 5 – Consolidação",
          focus: "Chegar a 15 minutos contínuos",
          description:
            "Até 2 treinos com 15 minutos de corrida contínua, mais 1 treino intervalado leve. Atenção a dores e sono.",
        },
        {
          week: 6,
          title: "Semana 6 – Subindo o tempo",
          focus: "Chegar perto de 20 minutos contínuos",
          description:
            "1 treino de 18–20 minutos contínuos + 2 treinos mais curtos com intervalos fáceis.",
        },
        {
          week: 7,
          title: "Semana 7 – Ajuste e consistência",
          focus: "Manter 3 sessões semanais",
          description:
            "Volume semelhante à semana 6, priorizando sensação boa ao terminar os treinos. Nada de forçar ritmo.",
        },
        {
          week: 8,
          title: "Semana 8 – 25 minutos",
          focus: "Aproximar de 5 km em tempo",
          description:
            "1 treino de 22–25 minutos contínuos, outros 2 treinos mais leves apenas para manter o corpo ativo.",
        },
        {
          week: 9,
          title: "Semana 9 – 30 minutos",
          focus: "Chegar a 30 minutos de corrida contínua",
          description:
            "1 treino de 30 minutos bem confortáveis + 2 sessões curtas opcionais (15–20 min) de trote leve.",
        },
        {
          week: 10,
          title: "Semana 10 – Estabilizar",
          focus: "Repetir 30 minutos com facilidade",
          description:
            "Até 2 treinos de 30 minutos na semana, em ritmo de conversa, podendo alternar pequenos trechos de caminhada se necessário.",
        },
        {
          week: 11,
          title: "Semana 11 – Simulação de 5 km",
          focus: "Testar distância aproximada",
          description:
            "1 treino em que o atleta tenta completar o equivalente a 4–5 km no seu ritmo natural, sem pressão de tempo.",
        },
        {
          week: 12,
          title: "Semana 12 – Confiança para seguir",
          focus: "Consolidar rotina de corrida",
          description:
            "Treinos leves repetindo 25–30 minutos contínuos. Objetivo é terminar o ciclo sentindo que correr faz parte da rotina semanal.",
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // RUNNING & WEIGHT LOSS
  // ---------------------------------------------------------------------------
  {
    slug: "weight-loss-running",
    name: "Running & Weight Loss",
    title: "Running & Weight Loss",
    shortDescription:
      "Foco em constância, intensidade controlada e aumento de gasto calórico.",
    longDescription:
      "Grupo voltado para quem quer emagrecer usando corrida e caminhada como ferramentas principais, sempre respeitando o nível atual e histórico de lesões.",
    challengeId: null,
    twelveWeekPlan: {
      volumeLabel: "Volume alvo: 3–5 sessões por semana combinando corrida, caminhada e rotina ativa",
      weeks: [
        {
          week: 1,
          title: "Semana 1 – Ativação geral",
          focus: "Colocar o corpo em movimento",
          description:
            "3 sessões de 30 minutos de caminhada rápida + 1 dia extra opcional de atividade leve (bike, dança, etc.).",
        },
        {
          week: 2,
          title: "Semana 2 – Introduzir trote leve",
          focus: "Começar a alternar corrida e caminhada",
          description:
            "Blocos de 1–2 min de corrida leve + 3–4 min de caminhada em 3 sessões semanais.",
        },
        {
          week: 3,
          title: "Semana 3 – Frequência",
          focus: "Chegar a 4 sessões ativas",
          description:
            "2 treinos intervalados de corrida/caminhada + 2 sessões apenas de caminhada rápida ou outra atividade aeróbia.",
        },
        {
          week: 4,
          title: "Semana 4 – Ajustes de ritmo",
          focus: "Manter intensidade moderada",
          description:
            "Blocos 3/2 (corrida/caminhada) com duração total de 30–35 minutos. Um dia com foco em subir escadas ou subidas leves.",
        },
        {
          week: 5,
          title: "Semana 5 – Aumento de gasto calórico",
          focus: "Mais minutos totais na semana",
          description:
            "4–5 sessões curtas (25–40 min) somando no mínimo 150 minutos ativos na semana.",
        },
        {
          week: 6,
          title: "Semana 6 – Semana foco em passos",
          focus: "Trazer movimento para o dia a dia",
          description:
            "Meta de passos diários (ex.: 8–10 mil) + 3 sessões de corrida/caminhada. Reforço no hábito de estacionar mais longe e usar escadas.",
        },
        {
          week: 7,
          title: "Semana 7 – Intervalados moderados",
          focus: "Melhorar condicionamento",
          description:
            "Treinos com blocos de 4–5 min corrida / 2 min caminhada, mantendo sempre sensação controlada de esforço.",
        },
        {
          week: 8,
          title: "Semana 8 – Consolidação",
          focus: "Manter volume sem exagerar",
          description:
            "Repetir estrutura da semana 7, com atenção a sono, hidratação e alimentação. Ajustar calorias junto com profissional, se possível.",
        },
        {
          week: 9,
          title: "Semana 9 – Pequeno desafio pessoal",
          focus: "Fazer algo 10–15% mais desafiador",
          description:
            "1 treino um pouco mais longo (40–45 min) + 3–4 sessões regulares. Manter intensidade moderada.",
        },
        {
          week: 10,
          title: "Semana 10 – Refino de rotina",
          focus: "Transformar em estilo de vida",
          description:
            "Planejar treinos da semana junto com horários de refeição e sono. Volume semelhante às semanas anteriores.",
        },
        {
          week: 11,
          title: "Semana 11 – Semana de manutenção",
          focus: "Evitar queda de motivação",
          description:
            "Volume ligeiramente menor (–10/15%) mas com mesma frequência, para dar sensação de leveza sem perder o hábito.",
        },
        {
          week: 12,
          title: "Semana 12 – Fechamento de ciclo",
          focus: "Rever resultados e definir próximos passos",
          description:
            "Treinos parecidos com as semanas 8–9. Recomendação de registrar medidas, roupas e sensação geral para comparar com o início.",
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // PERFORMANCE 5K
  // ---------------------------------------------------------------------------
  {
    slug: "performance-5k",
    name: "Performance 5K",
    title: "Performance 5K",
    shortDescription:
      "Grupo ideal para quem já corre 5 km e quer ficar mais rápido.",
    longDescription:
      "Treinos com foco em ritmo, tiros, intervalados e controle de carga para melhorar tempo em provas de 5 km sem perder consistência.",
    challengeId: null,
    twelveWeekPlan: {
      volumeLabel: "Volume alvo: 25–40 km/semana para corredores intermediários",
      weeks: [
        {
          week: 1,
          title: "Semana 1 – Base com toques de velocidade",
          focus: "Manter volume moderado",
          description:
            "2 rodagens leves + 1 treino de strides (acelerações curtas) após corrida fácil. Longão de 8–10 km no fim de semana.",
        },
        {
          week: 2,
          title: "Semana 2 – Intervalados leves",
          focus: "Começar a trabalhar VO2 sem exagero",
          description:
            "Séries como 8×400 m ou blocos de 2–3 min forte / 2 min leve, sempre com boa recuperação entre os treinos.",
        },
        {
          week: 3,
          title: "Semana 3 – Ritmo de prova",
          focus: "Conhecer o pace alvo",
          description:
            "1 treino em ritmo de prova (ex.: 3×1,5 km em pace de 5k) + rodagens leves e fortalecimento.",
        },
        {
          week: 4,
          title: "Semana 4 – Semana de ajuste",
          focus: "Evitar acúmulo de fadiga",
          description:
            "Volume 10–15% menor, mantendo apenas um treino de intensidade moderada e mais foco em técnica e mobilidade.",
        },
        {
          week: 5,
          title: "Semana 5 – Blocos fortes",
          focus: "Subir a régua da intensidade",
          description:
            "Séries como 5×800 m ou 4×1000 m em ritmo ligeiramente mais rápido que o pace de prova.",
        },
        {
          week: 6,
          title: "Semana 6 – Longo com progressão",
          focus: "Trabalhar resistência de ritmo",
          description:
            "Longão de 12–14 km com parte final em ritmo um pouco abaixo do ritmo de prova. Rodagens leves nos outros dias.",
        },
        {
          week: 7,
          title: "Semana 7 – Ponto alto de intensidade",
          focus: "Maior carga de intervalados",
          description:
            "Dois treinos fortes na semana (intervalados + tempo run curto) com bastante atenção à recuperação.",
        },
        {
          week: 8,
          title: "Semana 8 – Descarga",
          focus: "Baixar volume, manter qualidade",
          description:
            "Redução de volume total, mantendo apenas 1 treino em ritmo de prova e rodagens soltas.",
        },
        {
          week: 9,
          title: "Semana 9 – Simulação de prova",
          focus: "Testar estratégia de 5 km",
          description:
            "Um treino de 4–5 km forte controlado (quase prova) ou participação em prova-treino, com aquecimento completo.",
        },
        {
          week: 10,
          title: "Semana 10 – Ajustes individuais",
          focus: "Trabalhar pontos específicos",
          description:
            "Se o atleta sente dificuldade no final da prova, incluir blocos fortes na parte final dos treinos.",
        },
        {
          week: 11,
          title: "Semana 11 – Taper para 5K",
          focus: "Chegar descansado mantendo velocidade",
          description:
            "Treinos curtos com tiros rápidos e muita recuperação. Volume cerca de 50–60% do pico.",
        },
        {
          week: 12,
          title: "Semana 12 – Semana da prova",
          focus: "Executar o plano",
          description:
            "Prova alvo de 5 km ou simulação oficial. Restante da semana com trotes muito leves e alongamentos.",
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // PERFORMANCE 10K
  // ---------------------------------------------------------------------------
  {
    slug: "performance-10k",
    name: "Performance 10K",
    title: "Performance 10K",
    shortDescription:
      "Para atletas que já correm 8–10 km e querem evoluir tempo e resistência.",
    longDescription:
      "Estrutura de treinos intervalados, tempo run e rodagens em diferentes intensidades, ajudando a bater recordes pessoais nos 10 km.",
    challengeId: null,
    twelveWeekPlan: {
      volumeLabel: "Volume alvo: 30–50 km/semana para quem busca recorde pessoal nos 10 km",
      weeks: [
        {
          week: 1,
          title: "Semana 1 – Base controlada",
          focus: "Criar rotina com 4 treinos semanais",
          description:
            "2 rodagens fáceis, 1 treino de strides e 1 longo de 10–12 km.",
        },
        {
          week: 2,
          title: "Semana 2 – Intervalados moderados",
          focus: "Trabalhar VO2 em doses leves",
          description:
            "Séries de 6–8×600 m ou blocos de 3 min forte / 2 min leve. Restante da semana em ritmo confortável.",
        },
        {
          week: 3,
          title: "Semana 3 – Tempo run",
          focus: "Sustentar ritmo forte contínuo",
          description:
            "1 treino de 20–25 minutos em ritmo de limiar (entre 10k e meia maratona) + longo de 12–14 km.",
        },
        {
          week: 4,
          title: "Semana 4 – Descarga parcial",
          focus: "Reduzir fadiga acumulada",
          description:
            "Volume total 20% menor, mantendo apenas um treino de intensidade moderada na semana.",
        },
        {
          week: 5,
          title: "Semana 5 – Intervalados em ritmo de prova",
          focus: "Conhecer pace alvo de 10 km",
          description:
            "Séries como 5×1 km em pace de prova com boa recuperação, + rodagens leves.",
        },
        {
          week: 6,
          title: "Semana 6 – Longo progressivo",
          focus: "Aumentar resistência de ritmo",
          description:
            "Longo de 14–16 km com parte final mais forte. Treinos fáceis entre os dias de carga.",
        },
        {
          week: 7,
          title: "Semana 7 – Pico de carga",
          focus: "Maior combinação de volume + intensidade",
          description:
            "Dois treinos intensos (intervalados + tempo run) e longo moderado, respeitando sinais de cansaço.",
        },
        {
          week: 8,
          title: "Semana 8 – Semana de recuperação ativa",
          focus: "Permitir supercompensação",
          description:
            "Volume 30% menor, mantendo um treino curto em ritmo de prova e o restante em rodagem leve.",
        },
        {
          week: 9,
          title: "Semana 9 – Simulação forte",
          focus: "Chegar perto de uma prova real",
          description:
            "Treino de 8–10 km em esforço forte controlado ou participação em prova-treino para ajustar estratégia.",
        },
        {
          week: 10,
          title: "Semana 10 – Ajustes individuais",
          focus: "Equalizar pontos fracos",
          description:
            "Treinos direcionados (subidas, ritmo final, etc.) conforme feedback das semanas anteriores.",
        },
        {
          week: 11,
          title: "Semana 11 – Taper de 10K",
          focus: "Diminuir volume, manter intensidade curta",
          description:
            "Intervalados curtos e rápidos com muita recuperação, rodagens de manutenção e alongamentos.",
        },
        {
          week: 12,
          title: "Semana 12 – Semana da prova",
          focus: "Executar o melhor 10 km",
          description:
            "Prova alvo na metade ou final da semana. Demais dias com trotes leves e foco em descanso, nutrição e hidratação.",
        },
      ],
    },
  },
];

// Helper opcional – usado em algumas páginas
export function getGroupBySlug(
  slug: TrainingGroupSlug
): TrainingGroup | undefined {
  return trainingGroups.find((g) => g.slug === slug);
}
