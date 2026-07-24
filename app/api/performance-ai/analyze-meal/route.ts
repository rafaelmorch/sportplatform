import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type AnalyzeMealBody = {
  storagePath?: string;
  mimeType?: string;
  mealType?: string;
  notes?: string;
};

type MealFoodItem = {
  name: string;
  estimated_grams: number | null;
  serving_description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  confidence: number;
};

type MealAnalysis = {
  meal_name: string;
  meal_type: string;
  summary: string;
  foods: MealFoodItem[];
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
    sodium_mg: number;
  };
  overall_confidence: number;
  portion_estimation_note: string;
  nutrition_insights: string[];
  attention_points: string[];
  disclaimer: string;
};

function finiteNumber(
  value: unknown,
  fallback = 0
): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number(value);

  return Number.isFinite(parsed)
    ? Math.max(0, parsed)
    : fallback;
}

function nullableFiniteNumber(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    typeof value === "number"
      ? value
      : Number(value);

  return Number.isFinite(parsed)
    ? Math.max(0, parsed)
    : null;
}

function confidenceNumber(value: unknown): number {
  return Math.min(
    1,
    Math.max(0, finiteNumber(value, 0))
  );
}

function textValue(
  value: unknown,
  fallback = ""
): string {
  return typeof value === "string"
    ? value.trim()
    : fallback;
}

function textArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string"
    )
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function normalizeAnalysis(
  raw: unknown,
  fallbackMealType: string
): MealAnalysis {
  const source =
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const rawFoods = Array.isArray(source.foods)
    ? source.foods
    : [];

  const foods: MealFoodItem[] = rawFoods
    .filter(
      (food) =>
        food &&
        typeof food === "object" &&
        !Array.isArray(food)
    )
    .map((food) => {
      const item = food as Record<
        string,
        unknown
      >;

      return {
        name:
          textValue(item.name) ||
          "Alimento não identificado",
        estimated_grams:
          nullableFiniteNumber(
            item.estimated_grams
          ),
        serving_description:
          textValue(
            item.serving_description
          ),
        calories: finiteNumber(
          item.calories
        ),
        protein_g: finiteNumber(
          item.protein_g
        ),
        carbs_g: finiteNumber(
          item.carbs_g
        ),
        fat_g: finiteNumber(item.fat_g),
        fiber_g: finiteNumber(
          item.fiber_g
        ),
        sugar_g: finiteNumber(
          item.sugar_g
        ),
        sodium_mg: finiteNumber(
          item.sodium_mg
        ),
        confidence: confidenceNumber(
          item.confidence
        ),
      };
    })
    .slice(0, 30);

  const calculatedTotals = foods.reduce(
    (totals, food) => ({
      calories:
        totals.calories + food.calories,
      protein_g:
        totals.protein_g +
        food.protein_g,
      carbs_g:
        totals.carbs_g + food.carbs_g,
      fat_g:
        totals.fat_g + food.fat_g,
      fiber_g:
        totals.fiber_g + food.fiber_g,
      sugar_g:
        totals.sugar_g + food.sugar_g,
      sodium_mg:
        totals.sodium_mg +
        food.sodium_mg,
    }),
    {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 0,
    }
  );

  return {
    meal_name:
      textValue(source.meal_name) ||
      "Refeição analisada",
    meal_type:
      textValue(source.meal_type) ||
      fallbackMealType ||
      "other",
    summary: textValue(source.summary),
    foods,
    totals: {
      calories: Math.round(
        calculatedTotals.calories
      ),
      protein_g: Number(
        calculatedTotals.protein_g.toFixed(
          1
        )
      ),
      carbs_g: Number(
        calculatedTotals.carbs_g.toFixed(
          1
        )
      ),
      fat_g: Number(
        calculatedTotals.fat_g.toFixed(1)
      ),
      fiber_g: Number(
        calculatedTotals.fiber_g.toFixed(
          1
        )
      ),
      sugar_g: Number(
        calculatedTotals.sugar_g.toFixed(
          1
        )
      ),
      sodium_mg: Math.round(
        calculatedTotals.sodium_mg
      ),
    },
    overall_confidence:
      confidenceNumber(
        source.overall_confidence
      ),
    portion_estimation_note:
      textValue(
        source.portion_estimation_note
      ),
    nutrition_insights: textArray(
      source.nutrition_insights
    ),
    attention_points: textArray(
      source.attention_points
    ),
    disclaimer:
      textValue(source.disclaimer) ||
      "As quantidades são estimativas visuais e devem ser revisadas pelo usuário.",
  };
}

function extractOutputText(
  data: Record<string, any>
): string {
  if (
    typeof data.output_text === "string"
  ) {
    return data.output_text;
  }

  const output = Array.isArray(data.output)
    ? data.output
    : [];

  for (const item of output) {
    const content = Array.isArray(
      item?.content
    )
      ? item.content
      : [];

    for (const part of content) {
      if (
        typeof part?.text === "string"
      ) {
        return part.text;
      }
    }
  }

  return "";
}

function allowedMimeType(
  value: string
): boolean {
  return [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ].includes(value);
}

export async function POST(req: Request) {
  try {
    const apiKey =
      process.env.OPENAI_API_KEY;

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY não configurada.",
        },
        { status: 500 }
      );
    }

    if (
      !supabaseUrl ||
      !supabaseAnonKey
    ) {
      return NextResponse.json(
        {
          error:
            "Variáveis do Supabase não configuradas.",
        },
        { status: 500 }
      );
    }

    const authorization =
      req.headers.get("authorization");

    if (
      !authorization?.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Sessão de usuário não encontrada.",
        },
        { status: 401 }
      );
    }

    const accessToken =
      authorization.slice(7).trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Token de acesso inválido.",
        },
        { status: 401 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser(
      accessToken
    );

    const user = userData.user;

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "Sessão inválida ou expirada.",
        },
        { status: 401 }
      );
    }

    const body =
      (await req.json()) as AnalyzeMealBody;

    const storagePath =
      body.storagePath?.trim();

    const requestedMimeType =
      body.mimeType?.trim().toLowerCase();

    const mealType =
      body.mealType?.trim() || "other";

    const notes =
      body.notes?.trim() || "";

    if (!storagePath) {
      return NextResponse.json(
        {
          error:
            "O caminho da imagem é obrigatório.",
        },
        { status: 400 }
      );
    }

    const expectedPrefix =
      `${user.id}/`;

    if (
      !storagePath.startsWith(
        expectedPrefix
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Você não tem acesso a esta imagem.",
        },
        { status: 403 }
      );
    }

    const {
      data: imageRecord,
      error: imageRecordError,
    } = await supabase
      .from(
        "performance_ai_meal_images"
      )
      .select(
        "id, user_id, storage_path, mime_type, size_bytes"
      )
      .eq("user_id", user.id)
      .eq("storage_path", storagePath)
      .maybeSingle();

    if (
      imageRecordError ||
      !imageRecord
    ) {
      return NextResponse.json(
        {
          error:
            "O registro da imagem não foi encontrado.",
        },
        { status: 404 }
      );
    }

    const {
      data: imageBlob,
      error: downloadError,
    } = await supabase.storage
      .from("meal-images")
      .download(storagePath);

    if (
      downloadError ||
      !imageBlob
    ) {
      return NextResponse.json(
        {
          error:
            downloadError?.message ||
            "Não foi possível acessar a imagem.",
        },
        { status: 404 }
      );
    }

    const mimeType =
      requestedMimeType ||
      imageRecord.mime_type ||
      imageBlob.type ||
      "image/jpeg";

    if (!allowedMimeType(mimeType)) {
      return NextResponse.json(
        {
          error:
            "Formato de imagem não aceito para análise.",
        },
        { status: 400 }
      );
    }

    const maximumBytes =
      10 * 1024 * 1024;

    if (imageBlob.size > maximumBytes) {
      return NextResponse.json(
        {
          error:
            "A imagem excede o limite de 10 MB.",
        },
        { status: 400 }
      );
    }

    const imageBuffer =
      Buffer.from(
        await imageBlob.arrayBuffer()
      );

    const imageDataUrl =
      `data:${mimeType};base64,${imageBuffer.toString(
        "base64"
      )}`;

    const prompt = `
Você é um assistente especializado em análise visual de refeições e nutrição esportiva.

Analise somente os alimentos e bebidas que estiverem visíveis na imagem.

Tipo de refeição informado pelo usuário:
${mealType}

Observações do usuário:
${notes || "Nenhuma observação."}

Responda SOMENTE em JSON válido.
Não use markdown.
Não escreva nenhum texto fora do JSON.

Formato obrigatório:

{
  "meal_name": "",
  "meal_type": "${mealType}",
  "summary": "",
  "foods": [
    {
      "name": "",
      "estimated_grams": null,
      "serving_description": "",
      "calories": 0,
      "protein_g": 0,
      "carbs_g": 0,
      "fat_g": 0,
      "fiber_g": 0,
      "sugar_g": 0,
      "sodium_mg": 0,
      "confidence": 0
    }
  ],
  "totals": {
    "calories": 0,
    "protein_g": 0,
    "carbs_g": 0,
    "fat_g": 0,
    "fiber_g": 0,
    "sugar_g": 0,
    "sodium_mg": 0
  },
  "overall_confidence": 0,
  "portion_estimation_note": "",
  "nutrition_insights": [],
  "attention_points": [],
  "disclaimer": ""
}

Regras obrigatórias:

- Identifique cada alimento como um item separado.
- Não invente alimentos que não estejam visíveis.
- Considere molhos, óleos, temperos calóricos e bebidas apenas quando estiverem visíveis ou forem claramente indicados pelo usuário.
- estimated_grams deve ser um número ou null.
- Os macronutrientes e calorias devem ser estimativas realistas para a porção visual.
- confidence e overall_confidence devem variar entre 0 e 1.
- Quando houver dúvida entre alimentos, use o nome mais genérico e reduza a confiança.
- Não dê diagnóstico médico.
- Não trate a estimativa visual como medição exata.
- Use frases curtas e claras.
- totals deve representar a soma dos itens.
- O disclaimer deve informar que o usuário precisa revisar os alimentos e as porções antes de salvar.
`;

    const openAIResponse =
      await fetch(
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
            input: [
              {
                role: "user",
                content: [
                  {
                    type: "input_text",
                    text: prompt,
                  },
                  {
                    type: "input_image",
                    image_url:
                      imageDataUrl,
                    detail: "high",
                  },
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

    const openAIData =
      (await openAIResponse.json()) as Record<
        string,
        any
      >;

    if (!openAIResponse.ok) {
      return NextResponse.json(
        {
          error:
            openAIData?.error
              ?.message ||
            "Não foi possível analisar a refeição.",
        },
        {
          status:
            openAIResponse.status,
        }
      );
    }

    const outputText =
      extractOutputText(openAIData);

    if (!outputText) {
      return NextResponse.json(
        {
          error:
            "A IA não retornou dados da refeição.",
        },
        { status: 502 }
      );
    }

    let parsed: unknown;

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

    const analysis =
      normalizeAnalysis(
        parsed,
        mealType
      );

    if (
      analysis.foods.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Nenhum alimento pôde ser identificado. Tente uma foto mais clara e próxima do prato.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      imageId: imageRecord.id,
      storagePath,
      analysis,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao analisar a refeição.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
