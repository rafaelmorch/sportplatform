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
Você é um coach de performance esportiva e nutrição.
Analise os dados abaixo e responda em português, de forma objetiva.

Dados:
${JSON.stringify(body, null, 2)}

Responda com:
1. Resumo geral
2. Sugestão de treino
3. Sugestão de alimentação
4. Pontos de atenção
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
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
      "Não foi possível gerar análise.";

    return NextResponse.json({ analysis: text });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Erro inesperado." },
      { status: 500 }
    );
  }
}
