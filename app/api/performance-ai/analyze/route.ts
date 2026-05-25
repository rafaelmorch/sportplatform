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

IMPORTANTE:
- Responda em português.
- Seja prático, claro e explicativo.
- Não dê diagnóstico médico.
- Se houver exames de sangue, use apenas como contexto de performance/recuperação e recomende acompanhamento profissional quando necessário.
- O treino deve considerar histórico recente do Strava, objetivo, nível, peso, idade, tempo disponível e carga recente.
- A alimentação deve considerar peso, altura, idade, gênero, objetivo e carga de treino.
- Explique termos técnicos. Exemplo: se usar "zona 2", explique o que é.

DADOS DO USUÁRIO:
${JSON.stringify(body, null, 2)}

FORMATO OBRIGATÓRIO DA RESPOSTA:

# Resumo geral
Explique em 3 a 5 linhas o estado atual do usuário.

# Plano de treino — próximos 7 dias
Para cada dia, use este formato:

## Dia 1
Treino:
- Modalidade:
- Duração:
- Intensidade:
- Explicação:
- Objetivo do treino:

Repita até Dia 7.

# Alimentação sugerida
Monte uma orientação prática com exemplos e quantidades aproximadas.

Use:
- Café da manhã
- Almoço
- Lanche / pré-treino
- Jantar / pós-treino
- Hidratação

Inclua exemplos como gramas, unidades ou porções.

# Pontos de atenção
Liste pontos sobre recuperação, carga de treino, alimentação e exames se existirem.

# Aviso
Inclua uma frase curta dizendo que isso não substitui orientação médica, nutricional ou de treinador presencial.
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
