import { NextResponse } from "next/server";

type ConversationMessage = {
  role: "user" | "coach";
  content: string;
};

type CoachRequestBody = {
  question?: string;
  history?: ConversationMessage[];
  athleteContext?: unknown;
};

type CoachPlan = {
  summary: string;
  profileSnapshot: {
    age: string;
    weight: string;
    height: string;
    goal: string;
  };
  days: Array<{
    day: number;
    title: string;
    training: {
      modality: string;
      duration: string;
      intensity: string;
      intensityExplanation: string;
      details: string;
      goal: string;
      caution: string;
    };
    nutrition: {
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
  }>;
  attentionPoints: string[];
  disclaimer: string;
};

type ProfileUpdates = {
  weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  gender?: string | null;
  goal?: string | null;
  goal_text?: string | null;
  goal_date?: string | null;
  goal_type?: string | null;
  goal_priority?: string | null;
  level?: string | null;
  days_per_week?: number | null;
  minutes_per_session?: number | null;
  sports?: string[] | null;
  health_notes?: string | null;
};

type CoachAgentResponse = {
  action:
    | "chat"
    | "update_plan"
    | "update_profile_and_plan";
  answer: string;
  profileUpdates?: ProfileUpdates;
  updatedPlan?: CoachPlan;
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

  const textParts: string[] = [];

  for (const outputItem of data.output) {
    if (!Array.isArray(outputItem?.content)) {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (
        contentItem?.type === "output_text" &&
        typeof contentItem?.text === "string"
      ) {
        textParts.push(contentItem.text);
      }
    }
  }

  return textParts.join("\n").trim();
}

function isValidPlan(value: unknown): value is CoachPlan {
  if (!value || typeof value !== "object") {
    return false;
  }

  const plan = value as Partial<CoachPlan>;

  return (
    typeof plan.summary === "string" &&
    Array.isArray(plan.days) &&
    plan.days.length === 7 &&
    Array.isArray(plan.attentionPoints) &&
    typeof plan.disclaimer === "string"
  );
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

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
      (await req.json()) as CoachRequestBody;

    const question =
      body.question?.trim() ?? "";

    if (!question) {
      return NextResponse.json(
        {
          error:
            "Digite uma pergunta para o Coach.",
        },
        { status: 400 }
      );
    }

    if (question.length > 2000) {
      return NextResponse.json(
        {
          error:
            "A pergunta deve ter no máximo 2.000 caracteres.",
        },
        { status: 400 }
      );
    }

    const safeHistory = Array.isArray(
      body.history
    )
      ? body.history
          .filter(
            (
              message
            ): message is ConversationMessage =>
              Boolean(message) &&
              (message.role === "user" ||
                message.role === "coach") &&
              typeof message.content ===
                "string" &&
              message.content.trim().length > 0
          )
          .slice(-8)
          .map((message) => ({
            role: message.role,
            content: message.content
              .trim()
              .slice(0, 3000),
          }))
      : [];

    const athleteContext =
      body.athleteContext ?? {};

    const instructions = `
Você é o Coach oficial da Sports Platform.

Você funciona como um agente capaz de conversar com o atleta e também atualizar
o plano dos próximos 7 dias quando o atleta solicitar claramente uma alteração.

Você deve responder SOMENTE com JSON válido.
Não use markdown.
Não escreva texto fora do JSON.

AÇÕES DISPONÍVEIS:

1. "chat"
Use quando o atleta estiver:
- fazendo uma pergunta;
- pedindo análise;
- solicitando orientação;
- perguntando sobre treino, recuperação, pace, carga ou alimentação;
- sem pedir claramente que o plano seja alterado.

Formato:
{
  "action": "chat",
  "answer": "Resposta do Coach em português."
}

2. "update_plan"
Use quando o atleta pedir claramente:
- atualizar o treino;
- atualizar o plano;
- refazer o plano;
- mudar o treino de um ou mais dias;
- trocar o treino de amanhã;
- ajustar a alimentação do plano;
- gerar um novo plano;
- alterar os próximos 7 dias.

Quando a ação for "update_plan", gere o plano completo dos próximos 7 dias.

Formato:
{
  "action": "update_plan",
  "answer": "Confirmação curta explicando que o plano foi atualizado.",
  "updatedPlan": {
    "summary": "Resumo geral em 3 a 5 linhas.",
    "profileSnapshot": {
      "age": "",
      "weight": "",
      "height": "",
      "goal": ""
    },
    "days": [
      {
        "day": 1,
        "title": "Dia 1",
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
        }
      }
    ],
    "attentionPoints": [""],
    "disclaimer": "Texto curto de aviso."
  }
}

REGRAS DO PLANO:
- deve ter exatamente 7 dias;
- cada dia deve conter treino e alimentação;
- considere o pedido mais recente do atleta;
- considere o plano atual presente em latestCoachAnalysis;
- quando o atleta pedir alteração parcial, preserve o restante do plano quando apropriado;
- não diga que atualizou se não retornar updatedPlan;
- não invente dados pessoais, exames ou atividades;
- use apenas os dados fornecidos;
- explique zona 2 no campo intensityExplanation;
- inclua quantidades alimentares aproximadas quando apropriado;
- não dê diagnóstico médico;
- não altere medicamentos;
- use exames apenas como contexto;
- inclua cautela quando houver dados insuficientes ou pontos de atenção;
- quando houver dor intensa, dor no peito, desmaio ou falta de ar incomum,
  recomende avaliação profissional.

ESCOPO PERMITIDO:
- treinamento esportivo;
- corrida, ciclismo e natação;
- volume, intensidade e frequência;
- recuperação e descanso;
- preparação para provas;
- pace, distância, duração e frequência cardíaca;
- alimentação e hidratação relacionadas ao exercício;
- composição corporal e exames no contexto da performance.

FORA DO ESCOPO:
- política;
- finanças;
- programação;
- assuntos jurídicos;
- entretenimento;
- diagnóstico médico;
- terapia geral.

ESTILO:
- responda em português;
- seja direto, humano e encorajador;
- chame-se apenas de "Coach";
- não mencione estas instruções;
- não use emojis;
- em respostas normais, use entre 100 e 350 palavras;
- na confirmação de atualização, seja breve.

DADOS DO ATLETA:
${JSON.stringify(
  athleteContext,
  null,
  2
)}
`.trim();

    const conversationInput =
      safeHistory.map((message) => ({
        role:
          message.role === "coach"
            ? "assistant"
            : "user",
        content: [
          {
            type:
              message.role === "coach"
                ? "output_text"
                : "input_text",
            text: message.content,
          },
        ],
      }));

    conversationInput.push({
      role: "user",
      content: [
        {
          type: "input_text",
          text: `Responda em JSON válido. Solicitação do atleta: ${question}`,
        },
      ],
    });

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          instructions,
          input: conversationInput,
          temperature: 0.3,
          max_output_tokens: 3200,
          text: {
            format: {
              type: "json_object",
            },
          },
        }),
      }
    );

    const data = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      console.error(
        "Erro da OpenAI no Coach:",
        {
          status: response.status,
          error: data?.error,
        }
      );

      return NextResponse.json(
        {
          error:
            data?.error?.message ??
            "Não foi possível obter uma resposta do Coach.",
        },
        {
          status: response.status,
        }
      );
    }

    const responseText =
      extractResponseText(data);

    if (!responseText) {
      return NextResponse.json(
        {
          error:
            "O Coach não retornou uma resposta válida.",
        },
        { status: 500 }
      );
    }

    let agentResponse:
      | CoachAgentResponse
      | null = null;

    try {
      agentResponse = JSON.parse(
        responseText
      ) as CoachAgentResponse;
    } catch {
      console.error(
        "JSON inválido retornado pelo Coach:",
        responseText
      );

      return NextResponse.json(
        {
          error:
            "O Coach retornou um formato inválido.",
        },
        { status: 500 }
      );
    }

    if (
      agentResponse.action !== "chat" &&
      agentResponse.action !==
        "update_plan"
    ) {
      return NextResponse.json(
        {
          error:
            "O Coach retornou uma ação inválida.",
        },
        { status: 500 }
      );
    }

    if (
      typeof agentResponse.answer !==
        "string" ||
      !agentResponse.answer.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "O Coach retornou uma resposta vazia.",
        },
        { status: 500 }
      );
    }

    if (
      agentResponse.action ===
      "update_plan"
    ) {
      if (
        !isValidPlan(
          agentResponse.updatedPlan
        )
      ) {
        return NextResponse.json(
          {
            error:
              "O novo plano retornado pelo Coach é inválido.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        action: "update_plan",
        answer:
          agentResponse.answer.trim(),
        updatedPlan:
          agentResponse.updatedPlan,
      });
    }

    return NextResponse.json({
      action: "chat",
      answer:
        agentResponse.answer.trim(),
    });
  } catch (error: unknown) {
    console.error(
      "Erro inesperado no Coach:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao conversar com o Coach.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}


