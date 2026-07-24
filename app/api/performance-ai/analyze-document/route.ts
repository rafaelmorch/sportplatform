import { NextResponse } from "next/server";

type DocumentType = "blood_test" | "bioimpedance";

type AnalyzeDocumentBody = {
  type?: DocumentType;
  fileData?: string;
  fileName?: string;
  mimeType?: string;
  notes?: string;
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY não configurada." },
        { status: 500 }
      );
    }

    const body = (await req.json()) as AnalyzeDocumentBody;

    const {
      type,
      fileData,
      fileName,
      mimeType,
      notes,
    } = body;

    if (
      type !== "blood_test" &&
      type !== "bioimpedance"
    ) {
      return NextResponse.json(
        { error: "Tipo de documento inválido." },
        { status: 400 }
      );
    }

    if (!fileData || !fileName || !mimeType) {
      return NextResponse.json(
        {
          error:
            "Arquivo, nome do arquivo e tipo do arquivo são obrigatórios.",
        },
        { status: 400 }
      );
    }

    const isPdf =
      mimeType === "application/pdf" ||
      fileName.toLowerCase().endsWith(".pdf");

    const isImage = mimeType.startsWith("image/");

    if (!isPdf && !isImage) {
      return NextResponse.json(
        {
          error:
            "Formato não aceito. Envie PDF, JPG, PNG ou WEBP.",
        },
        { status: 400 }
      );
    }

    const prompt =
      type === "bioimpedance"
        ? `
Você é um assistente de performance esportiva.

Analise o documento de bioimpedância enviado pelo usuário.

Observações do usuário:
${notes?.trim() || "Nenhuma observação."}

Extraia somente informações que estejam visíveis no documento.

Responda SOMENTE em JSON válido, sem markdown e sem texto adicional.

Use exatamente este formato:

{
  "summary": "",
  "documentType": "bioimpedance",
  "extractedData": {
    "assessment_date": null,
    "weight_kg": null,
    "body_fat_percent": null,
    "muscle_mass_kg": null,
    "visceral_fat": null,
    "body_water_percent": null,
    "bmr": null
  },
  "performanceInsights": [],
  "nutritionInsights": [],
  "attentionPoints": [],
  "disclaimer": ""
}

Regras:

- Use números sem unidades dentro dos campos numéricos.
- Use assessment_date no formato YYYY-MM-DD quando a data estiver disponível.
- Não invente valores.
- Quando não encontrar um valor, use null.
- Não dê diagnóstico médico.
- Use linguagem simples nos textos.
- Recomende acompanhamento profissional quando houver alteração relevante.
`
        : `
Você é um assistente de performance esportiva.

Analise o exame de sangue enviado pelo usuário.

Observações do usuário:
${notes?.trim() || "Nenhuma observação."}

Extraia somente informações que estejam visíveis no documento.

Responda SOMENTE em JSON válido, sem markdown e sem texto adicional.

Use exatamente este formato:

{
  "summary": "",
  "documentType": "blood_test",
  "extractedData": {
    "exam_date": null,
    "hemoglobin": null,
    "ferritin": null,
    "vitamin_d": null,
    "glucose": null,
    "total_cholesterol": null,
    "hdl": null,
    "ldl": null,
    "triglycerides": null,
    "tsh": null,
    "creatinine": null
  },
  "performanceInsights": [],
  "nutritionInsights": [],
  "attentionPoints": [],
  "disclaimer": ""
}

Regras:

- Use números sem unidades dentro dos campos numéricos.
- Use exam_date no formato YYYY-MM-DD quando a data estiver disponível.
- Não invente valores.
- Quando não encontrar um valor, use null.
- Não dê diagnóstico médico.
- Use linguagem simples nos textos.
- Recomende acompanhamento profissional quando houver alteração relevante.
`;

    const documentContent = isPdf
      ? {
          type: "input_file",
          filename: fileName,
          file_data: fileData,
        }
      : {
          type: "input_image",
          image_url: fileData,
          detail: "high",
        };

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
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
              content: [
                {
                  type: "input_text",
                  text: prompt,
                },
                documentContent,
              ],
            },
          ],
          temperature: 0.1,
          text: {
            format: {
              type: "json_object",
            },
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ??
            "Não foi possível analisar o documento.",
        },
        { status: response.status }
      );
    }

    const outputText =
      data?.output_text ??
      data?.output?.[0]?.content?.[0]?.text ??
      "";

    if (!outputText) {
      return NextResponse.json(
        { error: "A IA não retornou dados do documento." },
        { status: 502 }
      );
    }

    let parsed;

    try {
      parsed = JSON.parse(outputText);
    } catch {
      return NextResponse.json(
        {
          error:
            "A resposta da IA não estava no formato esperado.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      ...parsed,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao analisar documento.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
