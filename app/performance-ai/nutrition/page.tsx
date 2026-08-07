"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";
import MealReviewModal, {
  type MealAnalysisResult,
} from "./components/MealReviewModal";

import PerformanceAiBackButton from "@/components/performance-ai/PerformanceAiBackButton";
type MealRow = {
  id: string;
  meal_text: string;
  eaten_at: string;
  meal_type: string | null;
  protein_level: string | null;
  quality_level: string | null;
  ai_notes: string | null;
};

type UploadedMealImage = {
  id: string;
  storage_path: string;
  original_filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
};

type AnalyzeMealResponse = {
  success?: boolean;
  imageId?: string;
  storagePath?: string;
  analysis?: MealAnalysisResult;
  error?: string;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function localDateValue(date: Date): string {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
}

function localTimeValue(date: Date): string {
  return `${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function createConsumedAt(
  date: string,
  time: string
): string {
  const parsed = new Date(`${date}T${time}:00`);

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}

function formatMealDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatFileSize(
  sizeBytes: number | null | undefined
): string {
  if (!sizeBytes) {
    return "";
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(
    2
  )} MB`;
}

function buildMealText(
  analysis: MealAnalysisResult
): string {
  const foodNames = analysis.foods
    .map((food) => food.name.trim())
    .filter(Boolean);

  if (foodNames.length > 0) {
    return foodNames.join(", ");
  }

  return (
    analysis.meal_name.trim() ||
    "Refeição analisada"
  );
}

export default function NutritionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedDate = searchParams.get("date");
  const supabase = useMemo(
    () => supabaseBrowser,
    []
  );

  const now = useMemo(() => new Date(), []);

  const [loading, setLoading] =
    useState(true);

  const [userId, setUserId] =
    useState<string | null>(null);

  const [profileId, setProfileId] =
    useState<string | null>(null);

  const [meals, setMeals] =
    useState<MealRow[]>([]);

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [
    imagePreviewUrl,
    setImagePreviewUrl,
  ] = useState<string | null>(null);

  const [
    uploadedImage,
    setUploadedImage,
  ] = useState<UploadedMealImage | null>(
    null
  );

  const [mealDate, setMealDate] =
    useState(localDateValue(now));

  const [mealTime, setMealTime] =
    useState(localTimeValue(now));

  const [entryMode, setEntryMode] =
    useState<"photo" | "manual">("photo");

  const [manualMealText, setManualMealText] =
    useState("");

  const [notes, setNotes] = useState("");

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [removingImage, setRemovingImage] =
    useState(false);

  const [analyzingMeal, setAnalyzingMeal] =
    useState(false);

  const [savingMeal, setSavingMeal] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [analysis, setAnalysis] =
    useState<MealAnalysisResult | null>(null);

  const [reviewOpen, setReviewOpen] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    if (!requestedDate) {
      return;
    }

    const validDate =
      /^\d{4}-\d{2}-\d{2}$/.test(requestedDate);

    if (!validDate) {
      return;
    }

    const [year, month, day] = requestedDate
      .split("-")
      .map(Number);

    const parsedDate = new Date(
      year,
      month - 1,
      day
    );

    const dateIsValid =
      parsedDate.getFullYear() === year &&
      parsedDate.getMonth() === month - 1 &&
      parsedDate.getDate() === day;

    if (dateIsValid) {
      setMealDate(requestedDate);
    }
  }, [requestedDate]);

  async function loadMeals(
    currentUserId: string
  ): Promise<void> {
    const { data, error } = await supabase
      .from("performance_ai_meals")
      .select(
        "id, meal_text, eaten_at, meal_type, protein_level, quality_level, ai_notes"
      )
      .eq("user_id", currentUserId)
      .order("eaten_at", {
        ascending: false,
      })
      .limit(10);

    if (error) {
      setErrorMessage(
        "Não foi possível carregar o histórico de refeições."
      );
      return;
    }

    setMeals((data ?? []) as MealRow[]);
  }

  useEffect(() => {
    async function loadPage(): Promise<void> {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } =
        await supabase
          .from("performance_ai_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

      setProfileId(profile?.id ?? null);

      await loadMeals(user.id);
      setLoading(false);
    }

    void loadPage();
  }, [router, supabase]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(
          imagePreviewUrl
        );
      }
    };
  }, [imagePreviewUrl]);

  function clearMessages(): void {
    setMessage(null);
    setErrorMessage(null);
  }

  function clearLocalImage(): void {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(
        imagePreviewUrl
      );
    }

    setSelectedImage(null);
    setImagePreviewUrl(null);
  }

  function resetForm(): void {
    clearLocalImage();
    setUploadedImage(null);
    setAnalysis(null);
    setReviewOpen(false);
    setNotes("");
    setManualMealText("");

    const currentDate = new Date();

    if (
      requestedDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
    ) {
      setMealDate(requestedDate);
    } else {
      setMealDate(localDateValue(currentDate));
    }

    setMealTime(localTimeValue(currentDate));
  }

  async function handleSaveManualMeal(): Promise<void> {
    clearMessages();

    if (!userId) {
      setErrorMessage("Usuário não identificado.");
      return;
    }

    if (!mealDate || !mealTime) {
      setErrorMessage(
        "Informe a data e o horário da refeição."
      );
      return;
    }

    const mealText = manualMealText.trim();

    if (!mealText) {
      setErrorMessage(
        "Digite o que você comeu."
      );
      return;
    }

    setSavingMeal(true);

    try {
      const eatenAt = createConsumedAt(
        mealDate,
        mealTime
      );

      const { data: mealRow, error } =
        await supabase
          .from("performance_ai_meals")
          .insert({
            user_id: userId,
            profile_id: profileId,
            meal_text: mealText,
            eaten_at: eatenAt,
            meal_type: null,
            protein_level: null,
            quality_level: null,
            ai_notes: notes.trim() || null,
          })
          .select(
            "id, meal_text, eaten_at, meal_type, protein_level, quality_level, ai_notes"
          )
          .single();

      if (error || !mealRow) {
        throw new Error(
          error?.message ??
            "Não foi possível salvar a refeição."
        );
      }

      setMeals((current) => [
        mealRow as MealRow,
        ...current,
      ]);

      setMessage("Refeição salva com sucesso.");
      resetForm();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a refeição."
      );
    } finally {
      setSavingMeal(false);
    }
  }

  function handleSelectImage(
    event: ChangeEvent<HTMLInputElement>
  ): void {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    clearMessages();

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];

    if (
      !allowedMimeTypes.includes(file.type)
    ) {
      setErrorMessage(
        "Escolha uma imagem JPEG, PNG, WEBP, HEIC ou HEIF."
      );
      return;
    }

    const maximumSizeBytes =
      10 * 1024 * 1024;

    if (file.size > maximumSizeBytes) {
      setErrorMessage(
        "A imagem deve ter no máximo 10 MB."
      );
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(
        imagePreviewUrl
      );
    }

    setSelectedImage(file);

    setImagePreviewUrl(
      URL.createObjectURL(file)
    );

    setAnalysis(null);
    setReviewOpen(false);
  }

  async function handleUploadImage(): Promise<
    UploadedMealImage | null
  > {
    clearMessages();

    if (!userId) {
      setErrorMessage(
        "Faça login novamente para enviar a foto."
      );
      return null;
    }

    if (uploadedImage) {
      return uploadedImage;
    }

    if (!selectedImage) {
      setErrorMessage(
        "Tire uma foto ou escolha uma imagem."
      );
      return null;
    }

    setUploadingImage(true);

    try {
      const originalExtension =
        selectedImage.name
          .split(".")
          .pop()
          ?.toLowerCase() ?? "";

      const extensionByMimeType: Record<
        string,
        string
      > = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/heic": "heic",
        "image/heif": "heif",
      };

      const safeExtension =
        extensionByMimeType[
          selectedImage.type
        ] ||
        originalExtension ||
        "jpg";

      const fileName = `${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;

      const storagePath = `${userId}/${fileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("meal-images")
          .upload(
            storagePath,
            selectedImage,
            {
              cacheControl: "3600",
              contentType:
                selectedImage.type,
              upsert: false,
            }
          );

      if (uploadError) {
        throw new Error(
          `Não foi possível enviar a foto: ${uploadError.message}`
        );
      }

      const {
        data: imageRow,
        error: imageRowError,
      } = await supabase
        .from(
          "performance_ai_meal_images"
        )
        .insert({
          user_id: userId,
          meal_id: null,
          storage_path: storagePath,
          original_filename:
            selectedImage.name,
          mime_type:
            selectedImage.type,
          size_bytes:
            selectedImage.size,
        })
        .select(
          "id, storage_path, original_filename, mime_type, size_bytes"
        )
        .single();

      if (imageRowError || !imageRow) {
        await supabase.storage
          .from("meal-images")
          .remove([storagePath]);

        throw new Error(
          imageRowError?.message ??
            "Não foi possível registrar a imagem."
        );
      }

      const uploaded =
        imageRow as UploadedMealImage;

      setUploadedImage(uploaded);
      setMessage(
        "Foto enviada com segurança."
      );

      return uploaded;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a foto."
      );

      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleRemoveImage(): Promise<void> {
    clearMessages();

    if (!uploadedImage) {
      clearLocalImage();
      setAnalysis(null);
      setReviewOpen(false);
      return;
    }

    if (!userId) {
      setErrorMessage(
        "Faça login novamente para remover a foto."
      );
      return;
    }

    setRemovingImage(true);

    try {
      const { error: rowError } =
        await supabase
          .from(
            "performance_ai_meal_images"
          )
          .delete()
          .eq("id", uploadedImage.id)
          .eq("user_id", userId);

      if (rowError) {
        throw rowError;
      }

      const { error: storageError } =
        await supabase.storage
          .from("meal-images")
          .remove([
            uploadedImage.storage_path,
          ]);

      if (storageError) {
        throw storageError;
      }

      setUploadedImage(null);
      clearLocalImage();
      setAnalysis(null);
      setReviewOpen(false);
      setMessage("Foto removida.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível remover a foto."
      );
    } finally {
      setRemovingImage(false);
    }
  }

  async function handleAnalyzeMeal(): Promise<void> {
    clearMessages();

    if (!mealDate || !mealTime) {
      setErrorMessage(
        "Informe a data e o horário da refeição."
      );
      return;
    }

    if (!selectedImage && !uploadedImage) {
      setErrorMessage(
        "Selecione uma foto da refeição."
      );
      return;
    }

    setAnalyzingMeal(true);

    try {
      const image =
        uploadedImage ??
        (await handleUploadImage());

      if (!image) {
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (
        sessionError ||
        !session?.access_token
      ) {
        throw new Error(
          "Sua sessão expirou. Faça login novamente."
        );
      }

      const response = await fetch(
        "/api/performance-ai/analyze-meal",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            storagePath:
              image.storage_path,
            mimeType:
              image.mime_type ??
              selectedImage?.type ??
              "image/jpeg",
            mealType: "",
            notes: notes.trim(),
          }),
        }
      );

      const result =
        (await response.json()) as AnalyzeMealResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.analysis
      ) {
        throw new Error(
          result.error ??
            "Não foi possível analisar a refeição."
        );
      }

      const consumedAt =
        createConsumedAt(
          mealDate,
          mealTime
        );

      const resultWithDate: MealAnalysisResult =
        {
          ...result.analysis,
          meal_type: "",
          consumed_at: consumedAt,
        };

      setAnalysis(resultWithDate);
      setReviewOpen(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível analisar a refeição."
      );
    } finally {
      setAnalyzingMeal(false);
    }
  }

  async function handleSaveAnalysis(
    reviewedAnalysis: MealAnalysisResult
  ): Promise<void> {
    clearMessages();

    if (!userId) {
      setErrorMessage(
        "Faça login novamente para salvar a refeição."
      );
      return;
    }

    if (!uploadedImage) {
      setErrorMessage(
        "A imagem da refeição não foi encontrada."
      );
      return;
    }

    setSavingMeal(true);

    try {
      const eatenAt =
        reviewedAnalysis.consumed_at ??
        createConsumedAt(
          mealDate,
          mealTime
        );

      const mealText =
        buildMealText(reviewedAnalysis);

      const { data: mealRow, error: mealError } =
        await supabase
          .from("performance_ai_meals")
          .insert({
            user_id: userId,
            profile_id: profileId,
            meal_text: mealText,
            eaten_at: eatenAt,
            meal_type: null,
            protein_level: null,
            quality_level: null,
            ai_notes:
              reviewedAnalysis.summary ||
              null,
          })
          .select(
            "id, meal_text, eaten_at, meal_type, protein_level, quality_level, ai_notes"
          )
          .single();

      if (mealError || !mealRow) {
        throw new Error(
          mealError?.message ??
            "Não foi possível salvar a refeição."
        );
      }

      const { error: analysisError } =
        await supabase
          .from(
            "performance_ai_meal_analysis"
          )
          .insert({
            user_id: userId,
            meal_id: mealRow.id,
            meal_name:
              reviewedAnalysis.meal_name ||
              null,
            summary:
              reviewedAnalysis.summary ||
              null,
            total_calories:
              reviewedAnalysis.totals
                .calories,
            total_protein_g:
              reviewedAnalysis.totals
                .protein_g,
            total_carbs_g:
              reviewedAnalysis.totals
                .carbs_g,
            total_fat_g:
              reviewedAnalysis.totals
                .fat_g,
            total_fiber_g:
              reviewedAnalysis.totals
                .fiber_g,
            total_sugar_g:
              reviewedAnalysis.totals
                .sugar_g,
            total_sodium_mg:
              reviewedAnalysis.totals
                .sodium_mg,
            overall_confidence:
              reviewedAnalysis.overall_confidence,
            portion_estimation_note:
              reviewedAnalysis.portion_estimation_note ||
              null,
            nutrition_insights:
              reviewedAnalysis.nutrition_insights,
            raw_ai_response:
              reviewedAnalysis,
          });

      if (analysisError) {
        await supabase
          .from("performance_ai_meals")
          .delete()
          .eq("id", mealRow.id)
          .eq("user_id", userId);

        throw analysisError;
      }

      if (
        reviewedAnalysis.foods.length > 0
      ) {
        const foodRows =
          reviewedAnalysis.foods.map(
            (food, index) => ({
              user_id: userId,
              meal_id: mealRow.id,
              food_name: food.name,
              serving_description:
                food.serving_description ||
                null,
              estimated_grams:
                food.estimated_grams,
              calories: food.calories,
              protein_g: food.protein_g,
              carbs_g: food.carbs_g,
              fat_g: food.fat_g,
              fiber_g: food.fiber_g,
              sugar_g: food.sugar_g,
              sodium_mg: food.sodium_mg,
              confidence:
                food.confidence,
              display_order: index,
            })
          );

        const { error: itemsError } =
          await supabase
            .from(
              "performance_ai_meal_items"
            )
            .insert(foodRows);

        if (itemsError) {
          throw itemsError;
        }
      }

      const { error: imageUpdateError } =
        await supabase
          .from(
            "performance_ai_meal_images"
          )
          .update({
            meal_id: mealRow.id,
          })
          .eq("id", uploadedImage.id)
          .eq("user_id", userId);

      if (imageUpdateError) {
        throw imageUpdateError;
      }

      setMeals((current) => [
        mealRow as MealRow,
        ...current,
      ]);

      setMessage(
        "Refeição salva com sucesso."
      );

      resetForm();
    } catch (error: unknown) {
      let detailedMessage =
        "Não foi possível salvar a refeição.";

      if (
        error &&
        typeof error === "object"
      ) {
        const supabaseError = error as {
          message?: unknown;
          details?: unknown;
          hint?: unknown;
          code?: unknown;
        };

        const messageParts = [
          typeof supabaseError.message === "string"
            ? supabaseError.message
            : null,
          typeof supabaseError.details === "string"
            ? supabaseError.details
            : null,
          typeof supabaseError.hint === "string"
            ? supabaseError.hint
            : null,
          typeof supabaseError.code === "string"
            ? `Código: ${supabaseError.code}`
            : null,
        ].filter(
          (value): value is string =>
            Boolean(value)
        );

        if (messageParts.length > 0) {
          detailedMessage =
            messageParts.join(" ");
        } else {
          try {
            const properties =
              Object.getOwnPropertyNames(
                error
              );

            const errorDetails =
              properties.reduce<
                Record<string, unknown>
              >((result, property) => {
                result[property] = (
                  error as Record<
                    string,
                    unknown
                  >
                )[property];

                return result;
              }, {});

            const serialized =
              JSON.stringify(errorDetails);

            if (
              serialized &&
              serialized !== "{}"
            ) {
              detailedMessage =
                serialized;
            }
          } catch {
            detailedMessage =
              "O Supabase recusou o registro, mas não retornou uma mensagem legível.";
          }
        }
      } else if (
        typeof error === "string"
      ) {
        detailedMessage = error;
      }

      setErrorMessage(detailedMessage);
    } finally {
      setSavingMeal(false);
    }
  }

  async function handleDeleteMeal(
    mealId: string
  ): Promise<void> {
    if (!userId) {
      return;
    }

    clearMessages();
    setDeletingId(mealId);

    try {
      const { error } = await supabase
        .from("performance_ai_meals")
        .delete()
        .eq("id", mealId)
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      setMeals((current) =>
        current.filter(
          (meal) => meal.id !== mealId
        )
      );

      setMessage("Refeição removida.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível remover a refeição."
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={pageGlowStyle} />

        <div style={containerStyle}>
          <p style={loadingStyle}>
            Carregando alimentação...
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main style={pageStyle}>
        <div style={pageGlowStyle} />

        <div style={containerStyle}>
          <header style={topBarStyle}>
            <PerformanceAiBackButton href="/performance-ai" />

            <div style={sectionLabelStyle}>
              Health Intelligence
            </div>
          </header>

          <section style={heroStyle}>
            <div style={heroEyebrowStyle}>
              Nutrição
            </div>

            <h1 style={heroTitleStyle}>
              Registre sua alimentação
            </h1>

            <p style={heroDescriptionStyle}>
              Adicione uma refeição por foto ou manualmente e acompanhe sua alimentação ao longo do dia.
            </p>

            <div style={statusBadgeStyle}>
              <span style={statusDotStyle} />
              Foto e registro manual disponíveis
            </div>
          </section>

          <section style={mainSectionStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <div style={panelEyebrowStyle}>
                  Nova refeição
                </div>

                <h2 style={panelTitleStyle}>
                  Data e horário
                </h2>

                <p style={panelDescriptionStyle}>
                  Informe quando a refeição
                  foi consumida. Não é
                  necessário classificá-la
                  como café, almoço ou jantar.
                </p>
              </div>
            </div>

            <div style={dateTimeGridStyle}>
              <label style={fieldStyle}>
                <span style={fieldLabelStyle}>
                  Data
                </span>

                <input
                  type="date"
                  value={mealDate}
                  onChange={(event) =>
                    setMealDate(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={fieldLabelStyle}>
                  Horário
                </span>

                <input
                  type="time"
                  value={mealTime}
                  onChange={(event) =>
                    setMealTime(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </label>
            </div>
          </section>

          <section style={mainSectionStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <div style={panelEyebrowStyle}>
                  Registro
                </div>

                <h2 style={panelTitleStyle}>
                  Como deseja registrar?
                </h2>

                <p style={panelDescriptionStyle}>
                  Envie uma foto para análise automática
                  ou descreva manualmente o que consumiu.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setEntryMode("photo")}
                style={{
                  ...secondaryButtonStyle,
                  minHeight: 46,
                  borderColor:
                    entryMode === "photo"
                      ? "rgba(212,175,55,0.75)"
                      : "rgba(255,255,255,0.12)",
                  color:
                    entryMode === "photo"
                      ? "#F1D36B"
                      : "#ffffff",
                }}
              >
                Foto
              </button>

              <button
                type="button"
                onClick={() => setEntryMode("manual")}
                style={{
                  ...secondaryButtonStyle,
                  minHeight: 46,
                  borderColor:
                    entryMode === "manual"
                      ? "rgba(212,175,55,0.75)"
                      : "rgba(255,255,255,0.12)",
                  color:
                    entryMode === "manual"
                      ? "#F1D36B"
                      : "#ffffff",
                }}
              >
                Manual
              </button>
            </div>
          </section>

          {entryMode === "manual" && (
            <section style={mainSectionStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <div style={panelEyebrowStyle}>
                    Registro manual
                  </div>

                  <h2 style={panelTitleStyle}>
                    O que você comeu?
                  </h2>

                  <p style={panelDescriptionStyle}>
                    Descreva os alimentos e as quantidades
                    que conseguir lembrar.
                  </p>
                </div>
              </div>

              <textarea
                value={manualMealText}
                onChange={(event) =>
                  setManualMealText(event.target.value)
                }
                rows={6}
                style={textareaStyle}
              />

              <button
                type="button"
                onClick={() =>
                  void handleSaveManualMeal()
                }
                disabled={
                  savingMeal ||
                  !manualMealText.trim() ||
                  !mealDate ||
                  !mealTime
                }
                style={{
                  ...primaryButtonStyle,
                  width: "100%",
                  marginTop: 18,
                  opacity:
                    savingMeal ||
                    !manualMealText.trim() ||
                    !mealDate ||
                    !mealTime
                      ? 0.5
                      : 1,
                  cursor:
                    savingMeal ||
                    !manualMealText.trim() ||
                    !mealDate ||
                    !mealTime
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {savingMeal
                  ? "Salvando..."
                  : "Salvar refeição"}
              </button>
            </section>
          )}

          <section
            style={{
              ...mainSectionStyle,
              display:
                entryMode === "photo"
                  ? "block"
                  : "none",
            }}
          >
            <div style={sectionHeaderStyle}>
              <div>
                <div style={panelEyebrowStyle}>
                  Foto
                </div>

                <h2 style={panelTitleStyle}>
                  Foto da refeição
                </h2>

                <p style={panelDescriptionStyle}>
                  Tire uma foto usando a
                  câmera ou escolha uma imagem
                  existente. O arquivo ficará
                  armazenado de forma privada.
                </p>
              </div>
            </div>

            {!imagePreviewUrl ? (
              <div style={uploadAreaStyle}>
                <div style={uploadLabelStyle}>
                  Leitura automática
                </div>

                <div style={uploadTitleStyle}>
                  Selecione a imagem da refeição
                </div>

                <p style={uploadDescriptionStyle}>
                  Use a câmera do celular ou
                  escolha uma imagem da galeria.
                </p>

                <div style={uploadButtonsStyle}>
                  <label style={selectButtonStyle}>
                    Tirar foto

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      capture="environment"
                      onChange={
                        handleSelectImage
                      }
                      style={hiddenInputStyle}
                    />
                  </label>

                  <label style={secondaryButtonStyle}>
                    Escolher imagem

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      onChange={
                        handleSelectImage
                      }
                      style={hiddenInputStyle}
                    />
                  </label>
                </div>

                <div style={formatsStyle}>
                  JPG, PNG, WEBP, HEIC ou HEIF
                  · máximo de 10 MB
                </div>
              </div>
            ) : (
              <div style={selectedImageStyle}>
                <div style={imagePreviewWrapStyle}>
                  <img
                    src={imagePreviewUrl}
                    alt="Refeição selecionada"
                    style={imagePreviewStyle}
                  />
                </div>

                <div style={imageDetailsStyle}>
                  <div>
                    <div style={fileStatusStyle}>
                      {uploadedImage
                        ? "Imagem enviada"
                        : "Imagem selecionada"}
                    </div>

                    <div style={fileNameStyle}>
                      {selectedImage?.name ??
                        uploadedImage?.original_filename ??
                        "Imagem da refeição"}
                    </div>

                    <div style={fileMetadataStyle}>
                      {formatFileSize(
                        selectedImage?.size ??
                          uploadedImage?.size_bytes
                      )}
                    </div>
                  </div>

                  {!uploadedImage && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleUploadImage()
                      }
                      disabled={
                        uploadingImage
                      }
                      style={{
                        ...primaryButtonStyle,
                        opacity:
                          uploadingImage
                            ? 0.6
                            : 1,
                      }}
                    >
                      {uploadingImage
                        ? "Enviando..."
                        : "Enviar foto"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      void handleRemoveImage()
                    }
                    disabled={
                      removingImage ||
                      uploadingImage ||
                      analyzingMeal
                    }
                    style={removeButtonStyle}
                  >
                    {removingImage
                      ? "Removendo..."
                      : "Remover imagem"}
                  </button>
                </div>
              </div>
            )}
          </section>

          <section style={mainSectionStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <div style={panelEyebrowStyle}>
                  Opcional
                </div>

                <h2 style={panelTitleStyle}>
                  Observações
                </h2>

                <p style={panelDescriptionStyle}>
                  Acrescente informações que
                  não estejam visíveis na
                  imagem, como molhos,
                  ingredientes ou modo de
                  preparo.
                </p>
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={4}
              placeholder="Ex.: o frango foi preparado com azeite e o molho estava separado."
              style={textareaStyle}
            />
          </section>

          <section
            style={{
              ...analysisSectionStyle,
              display:
                entryMode === "photo"
                  ? "block"
                  : "none",
            }}
          >
            <div style={sectionHeaderStyle}>
              <div>
                <div style={panelEyebrowStyle}>
                  Coach IA
                </div>

                <h2 style={panelTitleStyle}>
                  Identificar alimentos e porções
                </h2>

                <p style={panelDescriptionStyle}>
                  A inteligência artificial
                  estimará os alimentos,
                  quantidades e valores
                  nutricionais. Tudo poderá ser
                  revisado antes de salvar.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleAnalyzeMeal()
              }
              disabled={
                analyzingMeal ||
                uploadingImage ||
                !imagePreviewUrl
              }
              style={{
                ...analyzeButtonStyle,
                opacity:
                  analyzingMeal ||
                  uploadingImage ||
                  !imagePreviewUrl
                    ? 0.5
                    : 1,
                cursor:
                  analyzingMeal ||
                  uploadingImage ||
                  !imagePreviewUrl
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {analyzingMeal
                ? "Analisando refeição..."
                : "Analisar refeição com IA"}
            </button>

            <p style={analysisHelperStyle}>
              A leitura pode levar alguns
              segundos. As porções são
              estimativas visuais e devem ser
              revisadas.
            </p>
          </section>

          {message && (
            <div
              role="status"
              style={successMessageStyle}
            >
              {message}
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              style={errorMessageStyle}
            >
              {errorMessage}
            </div>
          )}

          <section style={historySectionStyle}>
            <div style={historyHeaderStyle}>
              <div>
                <div style={panelEyebrowStyle}>
                  Acompanhamento
                </div>

                <h2 style={panelTitleStyle}>
                  Últimas refeições
                </h2>

                <p style={panelDescriptionStyle}>
                  Suas 10 refeições mais recentes.
                </p>
              </div>

              <Link
                href="/performance-ai/nutrition/history"
                style={historyCountStyle}
              >
                Ver histórico →
              </Link>
            </div>

            {meals.length === 0 ? (
              <div style={emptyHistoryStyle}>
                <div>
                  <div style={emptyHistoryTitleStyle}>
                    Nenhuma refeição salva
                  </div>

                  <p style={emptyHistoryTextStyle}>
                    Depois de analisar e
                    confirmar uma refeição, ela
                    aparecerá aqui.
                  </p>
                </div>
              </div>
            ) : (
              <div style={historyListStyle}>
                {meals.map((meal) => (
                  <article
                    key={meal.id}
                    style={historyRowStyle}
                  >
                    <div style={historyContentStyle}>
                      <div style={historyDateStyle}>
                        {formatMealDate(
                          meal.eaten_at
                        )}
                      </div>

                      <p style={historyMealTextStyle}>
                        {meal.meal_text}
                      </p>

                      {meal.ai_notes && (
                        <p style={historyNotesStyle}>
                          {meal.ai_notes}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void handleDeleteMeal(
                          meal.id
                        )
                      }
                      disabled={
                        deletingId === meal.id
                      }
                      style={historyDeleteButtonStyle}
                    >
                      {deletingId === meal.id
                        ? "Removendo..."
                        : "Excluir"}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section style={disclaimerStyle}>
            <div style={disclaimerTitleStyle}>
              Informação nutricional
            </div>

            <p style={disclaimerTextStyle}>
              Os alimentos, porções e valores
              nutricionais são estimativas
              geradas a partir da imagem e das
              informações fornecidas. Revise
              todos os dados antes de salvar.
              Esta ferramenta não substitui
              avaliação de nutricionista ou
              profissional de saúde.
            </p>
          </section>
        </div>
      </main>

      <MealReviewModal
        open={reviewOpen}
        analysis={analysis}
        saving={savingMeal}
        onClose={() =>
          setReviewOpen(false)
        }
        onSave={handleSaveAnalysis}
      />

      <BottomNavbar />
    </>
  );
}

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  overflow: "hidden",
  background: "#080808",
  color: "#f4f4f5",
  fontFamily:
    "Montserrat, Arial, Helvetica, sans-serif",
};

const pageGlowStyle: CSSProperties = {
  position: "absolute",
  top: -260,
  left: "50%",
  width: 720,
  height: 520,
  transform: "translateX(-50%)",
  borderRadius: "50%",
  background:
    "radial-gradient(circle, rgba(212,175,55,0.09) 0%, rgba(255,241,168,0) 70%)",
  pointerEvents: "none",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(100%, 920px)",
  margin: "0 auto",
  padding:
    "max(16px, env(safe-area-inset-top)) clamp(16px, 4vw, 32px) max(110px, env(safe-area-inset-bottom))",
  boxSizing: "border-box",
};

const loadingStyle: CSSProperties = {
  margin: 0,
  paddingTop: 40,
  color: "#9898a1",
  fontSize: 14,
};

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 16,
  paddingBottom: 18,
  borderBottom:
    "1px solid rgba(255,255,255,0.09)",
};

const backLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 9,
  color: "#d4d4d8",
  fontSize: 13,
  fontWeight: 650,
  textDecoration: "none",
};

const sectionLabelStyle: CSSProperties = {
  color: "#6f6f78",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.5,
  textTransform: "uppercase",
};

const heroStyle: CSSProperties = {
  padding: "34px 0 30px",
};

const heroEyebrowStyle: CSSProperties = {
  color: "#D4AF37",
  fontSize: 11,
  fontWeight: 750,
  letterSpacing: 1.8,
  textTransform: "uppercase",
};

const heroTitleStyle: CSSProperties = {
  maxWidth: 720,
  margin: "10px 0 0",
  color: "#ffffff",
  fontSize: "clamp(36px, 7vw, 54px)",
  lineHeight: 1.04,
  fontWeight: 400,
  letterSpacing: "-0.045em",
};

const heroDescriptionStyle: CSSProperties = {
  maxWidth: 620,
  margin: "14px 0 0",
  color: "rgba(255,255,255,0.52)",
  fontSize: 14,
  lineHeight: 1.7,
};

const statusBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 9,
  marginTop: 18,
  padding: "9px 12px",
  border:
    "1px solid rgba(212,175,55,0.22)",
  background:
    "rgba(212,175,55,0.04)",
  color: "#D4AF37",
  fontSize: 11,
  fontWeight: 650,
};

const statusDotStyle: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  background: "#D4AF37",
  boxShadow:
    "0 0 14px rgba(212,175,55,0.45)",
};

const mainSectionStyle: CSSProperties = {
  padding: "26px 0",
  borderTop:
    "1px solid rgba(255,255,255,0.07)",
};

const analysisSectionStyle: CSSProperties = {
  ...mainSectionStyle,
  borderBottom:
    "1px solid rgba(255,255,255,0.09)",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 24,
};

const panelEyebrowStyle: CSSProperties = {
  color: "#D4AF37",
  fontSize: 10,
  fontWeight: 750,
  letterSpacing: 1.5,
  textTransform: "uppercase",
};

const panelTitleStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#ffffff",
  fontSize: "clamp(21px, 4vw, 27px)",
  lineHeight: 1.2,
  fontWeight: 400,
  letterSpacing: "-0.025em",
};

const panelDescriptionStyle: CSSProperties = {
  maxWidth: 650,
  margin: "8px 0 0",
  color: "rgba(255,255,255,0.46)",
  fontSize: 12,
  lineHeight: 1.65,
};

const dateTimeGridStyle: CSSProperties = {
  marginTop: 20,
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  gap: 18,
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: 9,
};

const fieldLabelStyle: CSSProperties = {
  color: "#a1a1aa",
  fontSize: 10,
  fontWeight: 750,
  letterSpacing: 1,
  textTransform: "uppercase",
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: 50,
  boxSizing: "border-box",
  padding: "11px 14px",
  border:
    "1px solid rgba(255,255,255,0.11)",
  borderRadius: 12,
  outline: "none",
  background: "rgba(255,255,255,0.035)",
  color: "#ffffff",
  colorScheme: "dark",
  fontFamily: "inherit",
  fontSize: 13,
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: 112,
  marginTop: 20,
  boxSizing: "border-box",
  resize: "vertical",
  padding: 15,
  border:
    "1px solid rgba(255,255,255,0.11)",
  borderRadius: 12,
  outline: "none",
  background: "rgba(255,255,255,0.035)",
  color: "#ffffff",
  fontFamily: "inherit",
  fontSize: 13,
  lineHeight: 1.65,
};

const uploadAreaStyle: CSSProperties = {
  display: "flex",
  minHeight: 230,
  marginTop: 22,
  padding: "26px 20px",
  border:
    "1px dashed rgba(212,175,55,0.28)",
  borderRadius: 16,
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  boxSizing: "border-box",
  background:
    "rgba(212,175,55,0.025)",
};

const uploadLabelStyle: CSSProperties = {
  color: "#D4AF37",
  fontSize: 10,
  fontWeight: 750,
  letterSpacing: 1.4,
  textTransform: "uppercase",
};

const uploadTitleStyle: CSSProperties = {
  marginTop: 14,
  color: "#f4f4f5",
  fontSize:
    "clamp(20px, 4vw, 27px)",
  lineHeight: 1.2,
  fontWeight: 750,
  letterSpacing: "-0.025em",
};

const uploadDescriptionStyle: CSSProperties = {
  maxWidth: 590,
  margin: "13px auto 0",
  color: "#85858e",
  fontSize: 13,
  lineHeight: 1.65,
};

const uploadButtonsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "stretch",
  flexWrap: "wrap",
  gap: 14,
  marginTop: 18,
};

const selectButtonStyle: CSSProperties = {
  width: 180,
  minHeight: 50,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  padding: "0 18px",
  border: "1px solid #D4AF37",
  borderRadius: 12,
  background:
    "linear-gradient(145deg, #E0BE52, #D4AF37)",
  color: "#111111",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1,
  textAlign: "center",
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  width: 180,
  minHeight: 50,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  padding: "0 18px",
  border:
    "1px solid rgba(212,175,55,0.38)",
  borderRadius: 12,
  background: "rgba(212,175,55,0.035)",
  color: "#F1D36B",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 650,
  lineHeight: 1,
  textAlign: "center",
  cursor: "pointer",
};

const hiddenInputStyle: CSSProperties = {
  display: "none",
};

const formatsStyle: CSSProperties = {
  marginTop: 14,
  color: "#66666f",
  fontSize: 11,
};

const selectedImageStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  gap: 28,
  marginTop: 34,
  paddingTop: 30,
  borderTop:
    "1px solid rgba(255,255,255,0.09)",
};

const imagePreviewWrapStyle: CSSProperties = {
  minHeight: 320,
  overflow: "hidden",
  border:
    "1px solid rgba(255,255,255,0.12)",
  background: "#000000",
};

const imagePreviewStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: 320,
  maxHeight: 500,
  display: "block",
  objectFit: "cover",
};

const imageDetailsStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 16,
};

const fileStatusStyle: CSSProperties = {
  color: "#D4AF37",
  fontSize: 10,
  fontWeight: 750,
  letterSpacing: 1.2,
  textTransform: "uppercase",
};

const fileNameStyle: CSSProperties = {
  marginTop: 10,
  color: "#f4f4f5",
  fontSize: 15,
  fontWeight: 700,
  overflowWrap: "anywhere",
};

const fileMetadataStyle: CSSProperties = {
  marginTop: 7,
  color: "#707079",
  fontSize: 11,
};

const primaryButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: 50,
  padding: "12px 18px",
  border: "1px solid #D4AF37",
  borderRadius: 12,
  background:
    "linear-gradient(145deg, #E0BE52, #D4AF37)",
  color: "#111111",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const removeButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: 44,
  padding: "11px 16px",
  border:
    "1px solid rgba(255,255,255,0.12)",
  background: "transparent",
  color: "#a1a1aa",
  fontFamily: "inherit",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
};

const analyzeButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: 52,
  marginTop: 22,
  padding: "13px 20px",
  border: "1px solid #D4AF37",
  borderRadius: 12,
  background:
    "linear-gradient(145deg, #E0BE52, #D4AF37)",
  color: "#111111",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 700,
};

const analysisHelperStyle: CSSProperties = {
  margin: "12px 0 0",
  color: "#707079",
  fontSize: 11,
  lineHeight: 1.6,
  textAlign: "center",
};

const successMessageStyle: CSSProperties = {
  marginTop: 20,
  padding: "14px 16px",
  border:
    "1px solid rgba(134,239,172,0.28)",
  background:
    "rgba(34,197,94,0.09)",
  color: "#bbf7d0",
  fontSize: 13,
  lineHeight: 1.6,
};

const errorMessageStyle: CSSProperties = {
  marginTop: 20,
  padding: "14px 16px",
  border:
    "1px solid rgba(252,165,165,0.28)",
  background:
    "rgba(239,68,68,0.09)",
  color: "#fecaca",
  fontSize: 13,
  lineHeight: 1.6,
};

const historySectionStyle: CSSProperties = {
  marginTop:
    "clamp(40px, 7vw, 72px)",
  padding:
    "clamp(28px, 5vw, 42px) 0",
  borderTop:
    "1px solid rgba(255,255,255,0.09)",
};

const historyHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: 20,
  marginBottom: 28,
};

const historyCountStyle: CSSProperties = {
  padding: "8px 12px",
  border:
    "1px solid rgba(212,175,55,0.20)",
  background:
    "rgba(212,175,55,0.04)",
  color: "#D4AF37",
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: "nowrap",
  textDecoration: "none",
  cursor: "pointer",
};

const historyListStyle: CSSProperties = {
  display: "grid",
};

const historyRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  flexWrap: "wrap",
  padding: "22px 0",
  borderTop:
    "1px solid rgba(255,255,255,0.08)",
};

const historyContentStyle: CSSProperties = {
  flex: "1 1 500px",
  minWidth: 0,
};

const historyDateStyle: CSSProperties = {
  color: "#D4AF37",
  fontSize: 11,
  fontWeight: 750,
  textTransform: "capitalize",
};

const historyMealTextStyle: CSSProperties = {
  margin: "9px 0 0",
  color: "#f4f4f5",
  fontSize: 15,
  fontWeight: 700,
  lineHeight: 1.55,
};

const historyNotesStyle: CSSProperties = {
  maxWidth: 760,
  margin: "8px 0 0",
  color: "#85858e",
  fontSize: 12,
  lineHeight: 1.65,
};

const historyDeleteButtonStyle: CSSProperties = {
  padding: 0,
  border: 0,
  background: "transparent",
  color: "#a1a1aa",
  fontFamily: "inherit",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
};

const emptyHistoryStyle: CSSProperties = {
  padding: "26px 0",
  borderTop:
    "1px dashed rgba(255,255,255,0.12)",
};

const emptyHistoryTitleStyle: CSSProperties = {
  color: "#f4f4f5",
  fontSize: 14,
  fontWeight: 750,
};

const emptyHistoryTextStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#85858e",
  fontSize: 12,
  lineHeight: 1.6,
};

const disclaimerStyle: CSSProperties = {
  marginTop: 32,
  padding: "22px 24px",
  borderLeft:
    "2px solid rgba(212,175,55,0.65)",
  background:
    "rgba(255,255,255,0.025)",
};

const disclaimerTitleStyle: CSSProperties = {
  color: "#d9d9dd",
  fontSize: 12,
  fontWeight: 750,
};

const disclaimerTextStyle: CSSProperties = {
  maxWidth: 820,
  margin: "9px 0 0",
  color: "#777780",
  fontSize: 12,
  lineHeight: 1.7,
};


















