import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY não configurada." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const prompt = `
Você é um coach de performance esportiva e nutrição esportiva.

Responda SOMENTE em JSON válido.
Não use markdown.
Não use texto fora do JSON.

Regras:
- O plano deve ter exatamente 7 dias.
- Cada dia deve ter treino e alimentação específica para aquele treino.
- A alimentação deve conter exemplos e quantidades aproximadas.
- Explique termos técnicos de forma simples.
- Se usar zona 2, explique no campo intensityExplanation.
- Não dê diagnóstico médico.
- Exames de sangue estruturados devem ser usados como contexto de performance, recuperação, nutrição e saúde geral.
- Bioimpedância estruturada deve ser usada para avaliar composição corporal, hidratação, massa muscular, gordura corporal e necessidade energética.
- Ao analisar ferritina, hemoglobina, vitamina D, glicose, colesterol, HDL, LDL, triglicerídeos, TSH e creatinina, nunca dê diagnóstico médico.
- Ao analisar bioimpedância, relacione peso, gordura corporal, massa muscular, gordura visceral, água corporal e BMR com treino, recuperação e alimentação.
- Se houver dados de exames ou bioimpedância, inclua pelo menos um ponto relevante em "attentionPoints".
- Se houver exame, inclua alertas apenas como pontos de atenção, sempre sugerindo acompanhamento profissional.

Dados do usuário:
${JSON.stringify(body, null, 2)}

Formato obrigatório:
{
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
  "attentionPoints": [
    ""
  ],
  "disclaimer": "Texto curto de aviso."
}
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        temperature: 0.4,
        text: {
          format: {
            type: "json_object",
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "Erro na OpenAI." },
        { status: response.status }
      );
    }

    const text =
      data?.output_text ??
      data?.output?.[0]?.content?.[0]?.text ??
      "";

    let parsed = null;

    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "A IA retornou um formato inválido.", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json({ analysis: parsed });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Erro inesperado." },
      { status: 500 }
    );
  }
}


