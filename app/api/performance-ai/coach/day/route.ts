import { NextResponse } from "next/server";

type DailyTraining = {
  modality: string;
  duration: string;
  intensity: string;
  intensityExplanation: string;
  details: string;
  goal: string;
  caution: string;
};

type DailyNutrition = {
  dailyFocus: string;
  breakfast: string;
  lunch: string;
  preWorkout: string;
  postWorkout: string;
  dinner: string;
  hydration: string;
  proteinTarget: string;
  carbTarget: string;
};

type SevenDayPlanItem = {
  planDate: string;
  training: DailyTraining;
  nutrition: DailyNutrition;
  coachAnalysis: string;
};

type SevenDayPlanResponse = {
  summary: string;
  days: SevenDayPlanItem[];
};

type PlanRequest = {
  planDate?: string;
  athleteContext?: unknown;
};

function extractResponseText(data: any): string {
  if (
    typeof data?.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text.trim();
  }

  if (!Array.isArray(data?.output)) {
    return "";
  }

  const parts: string[] = [];

  for (const item of data.output) {
    if (!Array.isArray(item?.content)) {
      continue;
    }

    for (const content of item.content) {
      if (
        content?.type === "output_text" &&
        typeof content?.text === "string"
      ) {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim();
}

function addDaysToDate(
  dateString: string,
  amount: number
): string {
  const date = new Date(
    `${dateString}T12:00:00Z`
  );

  date.setUTCDate(
    date.getUTCDate() + amount
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function expectedDates(
  startDate: string
): string[] {
  return Array.from(
    { length: 7 },
    (_, index) =>
      addDaysToDate(
        startDate,
        index
      )
  );
}

function isString(
  value: unknown
): value is string {
  return typeof value === "string";
}

function isValidTraining(
  value: unknown
): value is DailyTraining {
  if (!value || typeof value !== "object") {
    return false;
  }

  const training =
    value as Partial<DailyTraining>;

  return (
    isString(training.modality) &&
    isString(training.duration) &&
    isString(training.intensity) &&
    isString(
      training.intensityExplanation
    ) &&
    isString(training.details) &&
    isString(training.goal) &&
    isString(training.caution)
  );
}

function isValidNutrition(
  value: unknown
): value is DailyNutrition {
  if (!value || typeof value !== "object") {
    return false;
  }

  const nutrition =
    value as Partial<DailyNutrition>;

  return (
    isString(nutrition.dailyFocus) &&
    isString(nutrition.breakfast) &&
    isString(nutrition.lunch) &&
    isString(nutrition.preWorkout) &&
    isString(nutrition.postWorkout) &&
    isString(nutrition.dinner) &&
    isString(nutrition.hydration) &&
    isString(nutrition.proteinTarget) &&
    isString(nutrition.carbTarget)
  );
}

function isValidSevenDayPlan(
  value: unknown,
  startDate: string
): value is SevenDayPlanResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const plan =
    value as Partial<SevenDayPlanResponse>;

  if (
    !isString(plan.summary) ||
    !Array.isArray(plan.days) ||
    plan.days.length !== 7
  ) {
    return false;
  }

  const dates =
    expectedDates(startDate);

  return plan.days.every(
    (day, index) => {
      if (
        !day ||
        typeof day !== "object"
      ) {
        return false;
      }

      const item =
        day as Partial<SevenDayPlanItem>;

      return (
        item.planDate ===
          dates[index] &&
        isValidTraining(
          item.training
        ) &&
        isValidNutrition(
          item.nutrition
        ) &&
        isString(
          item.coachAnalysis
        )
      );
    }
  );
}

export async function POST(
  req: Request
) {
  try {
    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY não configurada.",
        },
        { status: 500 }
      );
    }

    const body =
      (await req.json()) as PlanRequest;

    const planDate =
      typeof body.planDate === "string"
        ? body.planDate.trim()
        : "";

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        planDate
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Data inicial inválida.",
        },
        { status: 400 }
      );
    }

    const dates =
      expectedDates(planDate);

    const athleteContext =
      body.athleteContext ?? {};

    const instructions = `
Você é o Coach oficial da Sports Platform.

Crie um plano COERENTE para os próximos 7 dias do atleta.

O primeiro dia é:
${dates[0]}

As datas obrigatórias são:
${dates.join(", ")}

Você deve considerar os sete dias como uma única sequência de treinamento.

Distribua adequadamente:
- carga;
- intensidade;
- recuperação;
- descanso;
- treino leve;
- alimentação;
- hidratação.

Não gere sete treinos isolados sem relação entre si.

Responda SOMENTE com JSON válido.
Não use markdown.
Não escreva nada fora do JSON.

FORMATO OBRIGATÓRIO:

{
  "summary": "",
  "days": [
    {
      "planDate": "${dates[0]}",
      "training": {
        "modality": "",
        "duration": "",
        "intensity": "",
        "intensityExplanation": "",
        "details": "",
        "goal": "",
        "caution": ""
      },
      "nutrition": {
        "dailyFocus": "",
        "breakfast": "",
        "lunch": "",
        "preWorkout": "",
        "postWorkout": "",
        "dinner": "",
        "hydration": "",
        "proteinTarget": "",
        "carbTarget": ""
      },
      "coachAnalysis": ""
    }
  ]
}

REGRAS:
- retorne exatamente 7 dias;
- use exatamente as 7 datas fornecidas, na mesma ordem;
- todos os dias devem conter training e nutrition;
- pode haver dias de descanso;
- em dia de descanso, deixe isso explícito em modality;
- o plano deve respeitar objetivo, experiência e disponibilidade do atleta;
- considere o histórico recente de treinos;
- evite aumentos bruscos de carga;
- alimentação deve acompanhar a carga de cada dia;
- inclua hidratação;
- use quantidades aproximadas quando úteis;
- explique a razão principal de cada dia em coachAnalysis;
- não invente dados do atleta;
- não diagnostique doenças;
- não prescreva medicamentos;
- use dados de saúde somente como contexto;
- escreva em português;
- não use emojis.

DADOS DO ATLETA:
${JSON.stringify(
  athleteContext,
  null,
  2
)}
`.trim();

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          instructions,
          input: [
            {
              role: "user",
              content: [
                {
                  type:
                    "input_text",
                  text:
                    `Responda em JSON válido. Crie meu plano completo de 7 dias começando em ${planDate}.`,
                },
              ],
            },
          ],
          temperature: 0.25,
          max_output_tokens: 6500,
          text: {
            format: {
              type: "json_object",
            },
          },
        }),
      }
    );

    const data =
      await response
        .json()
        .catch(() => null);

    if (!response.ok) {
      console.error(
        "Erro OpenAI no plano semanal:",
        data?.error
      );

      return NextResponse.json(
        {
          error:
            data?.error?.message ??
            "Não foi possível gerar o plano.",
        },
        {
          status:
            response.status,
        }
      );
    }

    const responseText =
      extractResponseText(data);

    if (!responseText) {
      return NextResponse.json(
        {
          error:
            "O Coach não retornou um plano.",
        },
        { status: 500 }
      );
    }

    let plan: unknown;

    try {
      plan =
        JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          error:
            "O Coach retornou um formato inválido.",
        },
        { status: 500 }
      );
    }

    if (
      !isValidSevenDayPlan(
        plan,
        planDate
      )
    ) {
      return NextResponse.json(
        {
          error:
            "O plano de 7 dias retornado está incompleto ou possui datas inválidas.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(plan);
  } catch (error: unknown) {
    console.error(
      "Erro ao gerar plano semanal:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao gerar o plano.",
      },
      { status: 500 }
    );
  }
}

