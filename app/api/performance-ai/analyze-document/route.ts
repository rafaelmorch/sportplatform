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
    const { type, fileUrl, notes } = body;

    if (!type || !fileUrl) {
      return NextResponse.json(
        { error: "type e fileUrl são obrigatórios." },
        { status: 400 }
      );
    }

    const isPdf = false;

    const prompt = `
Você é um assistente de performance esportiva.

Analise este documento enviado pelo usuário.
Tipo do documento: ${type === "bioimpedance" ? "Bioimpedância" : "Exame de sangue"}
Observações do usuário: ${notes || "Nenhuma"}

Responda SOMENTE em JSON válido.

Se for bioimpedância, tente extrair:
- peso
- percentual de gordura
- massa muscular
- gordura visceral
- água corporal
- BMR / metabolismo basal
- data da avaliação
- pontos de atenção para performance esportiva

Se for exame de sangue, tente extrair:
- hemoglobina
- ferritina
- vitamina D
- glicose
- colesterol total
- HDL
- LDL
- triglicerídeos
- TSH
- creatinina
- pontos de atenção para treino, recuperação e alimentação

Não dê diagnóstico médico.
Use linguagem simples.
Sempre recomende acompanhamento profissional quando houver alteração relevante.

Formato:
{
  "summary": "",
  "documentType": "",
  "extractedData": {},
  "performanceInsights": [],
  "nutritionInsights": [],
  "attentionPoints": [],
  "disclaimer": ""
}
`;

    const content = isPdf
      ? [
          { type: "input_file", file_url: fileUrl },
          { type: "input_text", text: prompt },
        ]
      : [
          
          { type: "input_text", text: prompt },
        ];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content,
          },
        ],
        temperature: 0.2,
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

    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao analisar documento." },
      { status: 500 }
    );
  }
}

