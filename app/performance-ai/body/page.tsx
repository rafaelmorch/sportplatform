"use client";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";

import { useRef, useState } from "react";
import BackButton from "@/components/BackButton";
import usePerformanceData from "@/hooks/usePerformanceData";
import { supabaseBrowser } from "@/lib/supabase-browser";

function formatValue(
  value: number | null | undefined,
  suffix = "",
  decimals = 1
): string {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return `${Number(value).toFixed(decimals)}${suffix}`;
}

function formatDate(
  date: string | null | undefined
): string {
  if (!date) {
    return "Data não informada";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Data não informada";
  }

  return parsedDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimelineDate(
  date: string | null | undefined
): string {
  if (!date) {
    return "Data não informada";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Data não informada";
  }

  const today = new Date();

  const isToday =
    parsedDate.getFullYear() === today.getFullYear() &&
    parsedDate.getMonth() === today.getMonth() &&
    parsedDate.getDate() === today.getDate();

  if (isToday) {
    return "Hoje";
  }

  return parsedDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year:
      parsedDate.getFullYear() === today.getFullYear()
        ? undefined
        : "numeric",
  });
}

function formatTimelineTime(
  date: string | null | undefined
): string {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BodyPage() {
  const {
    userId,
    loading,
    profile,
    weightLogs,
    bioimpedanceLogs,
    refresh,
  } = usePerformanceData();

  const [showWeightForm, setShowWeightForm] =
    useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [savingWeight, setSavingWeight] =
    useState(false);
  const [weightMessage, setWeightMessage] =
    useState<string | null>(null);
  const [weightError, setWeightError] =
    useState<string | null>(null);

  const [showBioForm, setShowBioForm] =
    useState(false);
  const [savingBio, setSavingBio] =
    useState(false);
  const [bioMessage, setBioMessage] =
    useState<string | null>(null);
  const [bioError, setBioError] =
    useState<string | null>(null);

  const [bioAssessmentDate, setBioAssessmentDate] =
    useState(() => new Date().toISOString().slice(0, 10));
  const [bioWeightKg, setBioWeightKg] =
    useState("");
  const [bioBodyFat, setBioBodyFat] =
    useState("");
  const [bioMuscleMass, setBioMuscleMass] =
    useState("");
  const [bioVisceralFat, setBioVisceralFat] =
    useState("");
  const [bioWaterPercent, setBioWaterPercent] =
    useState("");
  const [bioBmr, setBioBmr] =
    useState("");
  const [bioNotes, setBioNotes] =
    useState("");

  const bioFileInputRef =
    useRef<HTMLInputElement | null>(null);

  const bioFormRef =
    useRef<HTMLFormElement | null>(null);

  const [bioDocumentFile, setBioDocumentFile] =
    useState<File | null>(null);

  const [isDraggingBioFile, setIsDraggingBioFile] =
    useState(false);

  const [bioFileError, setBioFileError] =
    useState<string | null>(null);

  const [analyzingBioDocument, setAnalyzingBioDocument] =
    useState(false);

  const [bioAnalysisReady, setBioAnalysisReady] =
    useState(false);

  const [bioAnalysisSummary, setBioAnalysisSummary] =
    useState("");

  const [
    bioPerformanceInsights,
    setBioPerformanceInsights,
  ] = useState<string[]>([]);

  const [
    bioNutritionInsights,
    setBioNutritionInsights,
  ] = useState<string[]>([]);

  const [
    bioAttentionPoints,
    setBioAttentionPoints,
  ] = useState<string[]>([]);

  const [bioDisclaimer, setBioDisclaimer] =
    useState("");

  async function handleSaveWeight(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setWeightMessage(null);
    setWeightError(null);

    if (!userId) {
      setWeightError(
        "Você precisa estar conectado para registrar o peso."
      );
      return;
    }

    const normalizedWeight = newWeight
      .trim()
      .replace(",", ".");

    const weightNumber = Number(normalizedWeight);

    if (
      !Number.isFinite(weightNumber) ||
      weightNumber < 25 ||
      weightNumber > 350
    ) {
      setWeightError(
        "Informe um peso válido entre 25 e 350 kg."
      );
      return;
    }

    setSavingWeight(true);

    try {
      const { error } = await supabaseBrowser
        .from("performance_ai_weight_logs")
        .insert({
          user_id: userId,
          weight_kg: Number(weightNumber.toFixed(1)),
        });

      if (error) {
        throw error;
      }

      await refresh();

      setNewWeight("");
      setWeightMessage("Peso registrado com sucesso.");
      setShowWeightForm(false);
    } catch (saveError: unknown) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível registrar o peso.";

      setWeightError(message);
    } finally {
      setSavingWeight(false);
    }
  }

  function clearBioAnalysisResult() {
    setBioAnalysisReady(false);
    setBioAnalysisSummary("");
    setBioPerformanceInsights([]);
    setBioNutritionInsights([]);
    setBioAttentionPoints([]);
    setBioDisclaimer("");
  }

  function normalizeInsightList(
    value: unknown
  ): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (item): item is string =>
        typeof item === "string" &&
        item.trim().length > 0
    );
  }

  function validateBioDocumentFile(
    file: File
  ): string | null {
    const acceptedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const acceptedExtensions = [
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
    ];

    const lowerFileName = file.name.toLowerCase();

    const hasAcceptedMimeType =
      acceptedMimeTypes.includes(file.type);

    const hasAcceptedExtension =
      acceptedExtensions.some((extension) =>
        lowerFileName.endsWith(extension)
      );

    if (
      !hasAcceptedMimeType &&
      !hasAcceptedExtension
    ) {
      return "Envie um arquivo PDF, JPG, PNG ou WEBP.";
    }

    const maximumFileSize = 10 * 1024 * 1024;

    if (file.size > maximumFileSize) {
      return "O arquivo deve ter no máximo 10 MB.";
    }

    return null;
  }

  function selectBioDocumentFile(
    file: File
  ) {
    setBioFileError(null);
    setBioMessage(null);
    setBioError(null);
    clearBioAnalysisResult();

    const validationError =
      validateBioDocumentFile(file);

    if (validationError) {
      setBioDocumentFile(null);
      setBioFileError(validationError);

      if (bioFileInputRef.current) {
        bioFileInputRef.current.value = "";
      }

      return;
    }

    setBioDocumentFile(file);
  }

  function handleBioFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    selectBioDocumentFile(file);
  }

  function handleBioFileDrop(
    event: React.DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    setIsDraggingBioFile(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    selectBioDocumentFile(file);
  }

  function handleRemoveBioFile() {
    setBioDocumentFile(null);
    setBioFileError(null);
    setBioMessage(null);
    setBioError(null);
    clearBioAnalysisResult();

    if (bioFileInputRef.current) {
      bioFileInputRef.current.value = "";
    }
  }

  function formatBioFileSize(
    sizeInBytes: number
  ): string {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} bytes`;
    }

    if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    }

    return `${(
      sizeInBytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  function readFileAsDataUrl(
    file: File
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result !== "string") {
          reject(
            new Error(
              "Não foi possível ler o arquivo selecionado."
            )
          );
          return;
        }

        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(
          new Error(
            "Não foi possível ler o arquivo selecionado."
          )
        );
      };

      reader.readAsDataURL(file);
    });
  }

  function formatExtractedValue(
    value: unknown
  ): string {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "";
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return "";
    }

    return String(numericValue);
  }

  async function handleAnalyzeBioDocument() {
    setBioMessage(null);
    setBioError(null);
    setBioFileError(null);

    if (!bioDocumentFile) {
      setBioFileError(
        "Selecione um PDF ou uma imagem para analisar."
      );
      return;
    }

    const validationError =
      validateBioDocumentFile(bioDocumentFile);

    if (validationError) {
      setBioFileError(validationError);
      return;
    }

    setAnalyzingBioDocument(true);

    try {
      const fileData = await readFileAsDataUrl(
        bioDocumentFile
      );

      const response = await fetch(
        "/api/performance-ai/analyze-document",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "bioimpedance",
            fileData,
            fileName: bioDocumentFile.name,
            mimeType:
              bioDocumentFile.type ||
              (bioDocumentFile.name
                .toLowerCase()
                .endsWith(".pdf")
                ? "application/pdf"
                : "image/jpeg"),
            notes: bioNotes.trim() || undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Não foi possível analisar o documento."
        );
      }

      const extractedData = result?.extractedData;

      if (
        !extractedData ||
        typeof extractedData !== "object"
      ) {
        throw new Error(
          "A IA não retornou os dados no formato esperado."
        );
      }

      if (
        typeof extractedData.assessment_date ===
          "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(
          extractedData.assessment_date
        )
      ) {
        setBioAssessmentDate(
          extractedData.assessment_date
        );
      }

      setBioWeightKg(
        formatExtractedValue(
          extractedData.weight_kg
        )
      );

      setBioBodyFat(
        formatExtractedValue(
          extractedData.body_fat_percent
        )
      );

      setBioMuscleMass(
        formatExtractedValue(
          extractedData.muscle_mass_kg
        )
      );

      setBioVisceralFat(
        formatExtractedValue(
          extractedData.visceral_fat
        )
      );

      setBioWaterPercent(
        formatExtractedValue(
          extractedData.body_water_percent
        )
      );

      setBioBmr(
        formatExtractedValue(
          extractedData.bmr
        )
      );

      setBioAnalysisSummary(
        typeof result?.summary === "string"
          ? result.summary.trim()
          : ""
      );

      setBioPerformanceInsights(
        normalizeInsightList(
          result?.performanceInsights
        )
      );

      setBioNutritionInsights(
        normalizeInsightList(
          result?.nutritionInsights
        )
      );

      setBioAttentionPoints(
        normalizeInsightList(
          result?.attentionPoints
        )
      );

      setBioDisclaimer(
        typeof result?.disclaimer === "string"
          ? result.disclaimer.trim()
          : ""
      );

      setBioAnalysisReady(true);

      setBioMessage(
        "Análise concluída. Confira os dados antes de confirmar."
      );
    } catch (analysisError: unknown) {
      const message =
        analysisError instanceof Error
          ? analysisError.message
          : "Não foi possível analisar o documento.";

      setBioError(message);
    } finally {
      setAnalyzingBioDocument(false);
    }
  }

  function parseOptionalNumber(
    value: string
  ): number | null {
    const normalized = value.trim().replace(",", ".");

    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
  }

  async function handleSaveBioimpedance(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setBioMessage(null);
    setBioError(null);

    if (!userId) {
      setBioError(
        "Você precisa estar conectado para registrar a bioimpedância."
      );
      return;
    }

    const weightValue =
      parseOptionalNumber(bioWeightKg);
    const bodyFatValue =
      parseOptionalNumber(bioBodyFat);
    const muscleMassValue =
      parseOptionalNumber(bioMuscleMass);
    const visceralFatValue =
      parseOptionalNumber(bioVisceralFat);
    const waterValue =
      parseOptionalNumber(bioWaterPercent);
    const bmrValue =
      parseOptionalNumber(bioBmr);

    const enteredValues = [
      bioWeightKg,
      bioBodyFat,
      bioMuscleMass,
      bioVisceralFat,
      bioWaterPercent,
      bioBmr,
    ].filter((value) => value.trim().length > 0);

    if (
      enteredValues.length === 0 &&
      bioNotes.trim().length === 0
    ) {
      setBioError(
        "Informe pelo menos um resultado da avaliação."
      );
      return;
    }

    if (
      bioWeightKg.trim() &&
      (weightValue === null ||
        weightValue < 25 ||
        weightValue > 350)
    ) {
      setBioError(
        "Informe um peso válido entre 25 e 350 kg."
      );
      return;
    }

    if (
      bioBodyFat.trim() &&
      (bodyFatValue === null ||
        bodyFatValue < 1 ||
        bodyFatValue > 75)
    ) {
      setBioError(
        "Informe uma gordura corporal válida entre 1% e 75%."
      );
      return;
    }

    if (
      bioMuscleMass.trim() &&
      (muscleMassValue === null ||
        muscleMassValue < 1 ||
        muscleMassValue > 200)
    ) {
      setBioError(
        "Informe uma massa muscular válida."
      );
      return;
    }

    if (
      bioVisceralFat.trim() &&
      (visceralFatValue === null ||
        visceralFatValue < 0 ||
        visceralFatValue > 100)
    ) {
      setBioError(
        "Informe um nível de gordura visceral válido."
      );
      return;
    }

    if (
      bioWaterPercent.trim() &&
      (waterValue === null ||
        waterValue < 1 ||
        waterValue > 85)
    ) {
      setBioError(
        "Informe uma porcentagem de água corporal válida."
      );
      return;
    }

    if (
      bioBmr.trim() &&
      (bmrValue === null ||
        bmrValue < 500 ||
        bmrValue > 6000)
    ) {
      setBioError(
        "Informe um metabolismo basal válido."
      );
      return;
    }

    setSavingBio(true);

    try {
      const { error } = await supabaseBrowser
        .from("performance_ai_bioimpedance")
        .insert({
          user_id: userId,
          assessment_date:
            bioAssessmentDate || null,
          weight_kg: weightValue,
          body_fat_percent: bodyFatValue,
          muscle_mass_kg: muscleMassValue,
          visceral_fat: visceralFatValue,
          body_water_percent: waterValue,
          bmr: bmrValue,
          notes: bioNotes.trim() || null,
        });

      if (error) {
        throw error;
      }

      await refresh();

      setBioAssessmentDate(
        new Date().toISOString().slice(0, 10)
      );
      setBioWeightKg("");
      setBioBodyFat("");
      setBioMuscleMass("");
      setBioVisceralFat("");
      setBioWaterPercent("");
      setBioBmr("");
      setBioNotes("");
      setBioDocumentFile(null);
      clearBioAnalysisResult();

      if (bioFileInputRef.current) {
        bioFileInputRef.current.value = "";
      }

      setShowBioForm(false);
      setBioMessage(
        "Bioimpedância registrada com sucesso."
      );
    } catch (saveError: unknown) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível registrar a bioimpedância.";

      setBioError(message);
    } finally {
      setSavingBio(false);
    }
  }

  const chronologicalWeights = [...weightLogs].reverse();

  const currentWeight =
    weightLogs.length > 0
      ? Number(weightLogs[0].weight_kg)
      : null;

  const initialWeight =
    chronologicalWeights.length > 0
      ? Number(chronologicalWeights[0].weight_kg)
      : null;

  const weightVariation =
    currentWeight !== null && initialWeight !== null
      ? currentWeight - initialWeight
      : null;

  const heightCm =
    profile?.height_cm !== null &&
    profile?.height_cm !== undefined
      ? Number(profile.height_cm)
      : null;

  const bmi =
    heightCm && currentWeight
      ? currentWeight / Math.pow(heightCm / 100, 2)
      : null;

  const latestBio =
    bioimpedanceLogs.length > 0
      ? bioimpedanceLogs[0]
      : null;

  const variationLabel =
    weightVariation === null
      ? "Sem dados suficientes"
      : weightVariation < -0.1
        ? "Peso em redução"
        : weightVariation > 0.1
          ? "Peso em aumento"
          : "Peso estável";

  const variationColor =
    weightVariation === null
      ? "#85858e"
      : weightVariation < -0.1
        ? "#86efac"
        : weightVariation > 0.1
          ? "#fde68a"
          : "#fff1a8";

  const summaryCards = [
    {
      label: "Peso atual",
      value: formatValue(currentWeight, " kg"),
      detail:
        weightLogs.length > 0
          ? `Atualizado em ${formatDate(
              weightLogs[0].created_at
            )}`
          : "Nenhuma pesagem registrada",
    },
    {
      label: "Peso inicial",
      value: formatValue(initialWeight, " kg"),
      detail:
        chronologicalWeights.length > 0
          ? `Primeiro registro em ${formatDate(
              chronologicalWeights[0].created_at
            )}`
          : "Nenhuma pesagem registrada",
    },
    {
      label: "Variação total",
      value:
        weightVariation === null
          ? "—"
          : `${
              weightVariation > 0 ? "+" : ""
            }${weightVariation.toFixed(1)} kg`,
      detail: variationLabel,
      accent: variationColor,
    },
    {
      label: "IMC atual",
      value: formatValue(bmi, "", 1),
      detail: heightCm
        ? `Altura cadastrada: ${heightCm} cm`
        : "Cadastre sua altura para calcular",
    },
  ];

  const latestBioMetrics = latestBio
    ? [
        {
          label: "Gordura corporal",
          value: formatValue(
            latestBio.body_fat_percent,
            "%"
          ),
        },
        {
          label: "Massa muscular",
          value: formatValue(
            latestBio.muscle_mass_kg,
            " kg"
          ),
        },
        {
          label: "Água corporal",
          value: formatValue(
            latestBio.body_water_percent,
            "%"
          ),
        },
        {
          label: "Gordura visceral",
          value: formatValue(
            latestBio.visceral_fat,
            "",
            1
          ),
        },
        {
          label: "Metabolismo basal",
          value: formatValue(
            latestBio.bmr,
            " kcal",
            0
          ),
        },
        {
          label: "Peso avaliado",
          value: formatValue(
            latestBio.weight_kg,
            " kg"
          ),
        },
      ]
    : [];

  const chartWidth = 900;
  const chartHeight = 270;
  const chartPaddingX = 42;
  const chartPaddingY = 34;

  const chartWeights = chronologicalWeights
    .map((item) => Number(item.weight_kg))
    .filter((value) => Number.isFinite(value));

  const minWeight =
    chartWeights.length > 0
      ? Math.min(...chartWeights)
      : 0;

  const maxWeight =
    chartWeights.length > 0
      ? Math.max(...chartWeights)
      : 0;

  const chartRange = Math.max(
    maxWeight - minWeight,
    1
  );

  const chartPoints = chronologicalWeights.map(
    (item, index) => {
      const weight = Number(item.weight_kg);

      const x =
        chronologicalWeights.length === 1
          ? chartWidth / 2
          : chartPaddingX +
            (index /
              (chronologicalWeights.length - 1)) *
              (chartWidth - chartPaddingX * 2);

      const normalized =
        (weight - minWeight) / chartRange;

      const y =
        chartHeight -
        chartPaddingY -
        normalized *
          (chartHeight - chartPaddingY * 2);

      return {
        id: item.id,
        x,
        y,
        weight,
        date: item.created_at,
      };
    }
  );

  const chartLine = chartPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingWrapperStyle}>
          <div className="body-loading-spinner" />
        </div>

        <style jsx>{`
          .body-loading-spinner {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 3px solid
              rgba(255, 255, 255, 0.1);
            border-top-color: #fff1a8;
            animation: body-spin 0.8s linear infinite;
          }

          @keyframes body-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <BackButton />

      <section style={pageContainerStyle}>
        <header style={headerStyle}>
          <div style={headerTextStyle}>
            <div style={eyebrowStyle}>
              Performance AI
            </div>

            <h1 style={titleStyle}>
              Evolução corporal
            </h1>

            <p style={subtitleStyle}>
              Acompanhe seu peso, sua composição corporal
              e as mudanças registradas ao longo do tempo.
            </p>
          </div>

          <div style={headerActionsStyle}>
            <div style={statusPanelStyle}>
              <div style={statusLabelStyle}>
                Tendência atual
              </div>

              <div
                style={{
                  ...statusValueStyle,
                  color: variationColor,
                }}
              >
                {variationLabel}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowWeightForm((current) => !current);
                setShowBioForm(false);
                setWeightMessage(null);
                setWeightError(null);
                setBioMessage(null);
                setBioError(null);
              }}
              style={registerWeightButtonStyle}
            >
              {showWeightForm
                ? "Fechar"
                : "Registrar peso"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowBioForm((current) => !current);
                setShowWeightForm(false);
                setWeightMessage(null);
                setWeightError(null);
                setBioMessage(null);
                setBioError(null);
              }}
              style={registerBioButtonStyle}
            >
              {showBioForm
                ? "Fechar"
                : "Registrar bioimpedância"}
            </button>
          </div>
        </header>

        {showWeightForm && (
          <section style={weightFormPanelStyle}>
            <div style={weightFormHeaderStyle}>
              <div>
                <div style={sectionEyebrowStyle}>
                  Nova medição
                </div>

                <h2 style={weightFormTitleStyle}>
                  Registrar peso
                </h2>

                <p style={sectionDescriptionStyle}>
                  A data e o horário serão registrados
                  automaticamente.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSaveWeight}
              style={weightFormStyle}
            >
              <label style={weightFieldStyle}>
                <span style={weightInputLabelStyle}>
                  Peso em quilogramas
                </span>

                <div style={weightInputWrapperStyle}>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={newWeight}
                    onChange={(event) =>
                      setNewWeight(event.target.value)
                    }
                    placeholder="Ex.: 82,5"
                    disabled={savingWeight}
                    style={weightInputStyle}
                  />

                  <span style={weightUnitStyle}>
                    kg
                  </span>
                </div>
              </label>

              <button
                type="submit"
                disabled={
                  savingWeight ||
                  newWeight.trim().length === 0
                }
                style={{
                  ...saveWeightButtonStyle,
                  opacity:
                    savingWeight ||
                    newWeight.trim().length === 0
                      ? 0.5
                      : 1,
                  cursor:
                    savingWeight ||
                    newWeight.trim().length === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {savingWeight
                  ? "Salvando..."
                  : "Salvar medição"}
              </button>
            </form>
          </section>
        )}

        {showBioForm && (
          <section style={bioFormPanelStyle}>
            <div style={weightFormHeaderStyle}>
              <div>
                <div style={sectionEyebrowStyle}>
                  Composição corporal
                </div>

                <h2 style={weightFormTitleStyle}>
                  Registrar bioimpedância
                </h2>

                <p style={sectionDescriptionStyle}>
                  Preencha os resultados disponíveis no laudo.
                  Campos não informados podem permanecer vazios.
                </p>
              </div>
            </div>

            <div
              onDragEnter={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsDraggingBioFile(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsDraggingBioFile(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsDraggingBioFile(false);
              }}
              onDrop={handleBioFileDrop}
              style={{
                ...bioUploadAreaStyle,
                borderColor: isDraggingBioFile
                  ? "rgba(255,255,255,0.65)"
                  : "rgba(255,255,255,0.18)",
                background: isDraggingBioFile
                  ? "rgba(255,255,255,0.075)"
                  : "rgba(255,255,255,0.025)",
              }}
            >
              <input
                ref={bioFileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                onChange={handleBioFileChange}
                style={hiddenFileInputStyle}
              />

              {!bioDocumentFile ? (
                <>
                  <div style={bioUploadLabelStyle}>
                    Leitura automática
                  </div>

                  <div style={bioUploadTitleStyle}>
                    Envie o laudo da bioimpedância
                  </div>

                  <p style={bioUploadDescriptionStyle}>
                    Selecione um PDF ou uma imagem do laudo.
                    No computador, você também pode arrastar o
                    arquivo para esta área.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      bioFileInputRef.current?.click()
                    }
                    style={bioSelectFileButtonStyle}
                  >
                    Selecionar PDF ou imagem
                  </button>

                  <div style={bioUploadFormatsStyle}>
                    PDF, JPG, PNG ou WEBP · máximo de 10 MB
                  </div>
                </>
              ) : (
                <div style={bioSelectedFileStyle}>
                  <div style={bioSelectedFileHeaderStyle}>
                    <div style={bioSelectedFileInfoStyle}>
                      <div style={bioFileTypeBadgeStyle}>
                        {bioDocumentFile.type ===
                          "application/pdf" ||
                        bioDocumentFile.name
                          .toLowerCase()
                          .endsWith(".pdf")
                          ? "PDF"
                          : "IMG"}
                      </div>

                      <div style={bioFileTextAreaStyle}>
                        <div style={bioFileNameStyle}>
                          {bioDocumentFile.name}
                        </div>

                        <div style={bioFileMetadataStyle}>
                          {formatBioFileSize(
                            bioDocumentFile.size
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveBioFile}
                      disabled={analyzingBioDocument}
                      style={{
                        ...bioRemoveFileButtonStyle,
                        opacity: analyzingBioDocument
                          ? 0.45
                          : 1,
                        cursor: analyzingBioDocument
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                      Remover
                    </button>
                  </div>

                  <div style={bioFileReadyStyle}>
                    Arquivo pronto para análise
                  </div>

                  <button
                    type="button"
                    onClick={handleAnalyzeBioDocument}
                    disabled={analyzingBioDocument}
                    style={{
                      ...bioAnalyzeButtonStyle,
                      opacity: analyzingBioDocument
                        ? 0.55
                        : 1,
                      cursor: analyzingBioDocument
                        ? "not-allowed"
                        : "pointer",
                    }}
                  >
                    {analyzingBioDocument
                      ? "Analisando documento..."
                      : "Analisar com IA"}
                  </button>

                  <div style={bioNextStepTextStyle}>
                    {analyzingBioDocument
                      ? "A leitura pode levar alguns segundos."
                      : "Os campos abaixo serão preenchidos automaticamente."}
                  </div>
                </div>
              )}
            </div>

            {bioFileError && (
              <div style={bioUploadErrorStyle}>
                {bioFileError}
              </div>
            )}

            {bioAnalysisReady && (
              <section style={bioReviewPanelStyle}>
                <div style={bioReviewEyebrowStyle}>
                  Resultado da IA
                </div>

                <div style={bioReviewHeaderStyle}>
                  <div>
                    <h3 style={bioReviewTitleStyle}>
                      Confira os dados encontrados
                    </h3>

                    <p style={bioReviewDescriptionStyle}>
                      Revise os valores abaixo. Você pode
                      corrigir qualquer campo manualmente antes
                      de confirmar.
                    </p>
                  </div>

                  <div style={bioReviewStatusStyle}>
                    Análise concluída
                  </div>
                </div>

                <div style={bioReviewMetricsStyle}>
                  <div style={bioReviewMetricStyle}>
                    <span style={bioReviewMetricLabelStyle}>
                      Data
                    </span>

                    <strong style={bioReviewMetricValueStyle}>
                      {bioAssessmentDate
                        ? formatDate(bioAssessmentDate)
                        : "Não encontrada"}
                    </strong>
                  </div>

                  <div style={bioReviewMetricStyle}>
                    <span style={bioReviewMetricLabelStyle}>
                      Peso
                    </span>

                    <strong style={bioReviewMetricValueStyle}>
                      {bioWeightKg
                        ? `${bioWeightKg} kg`
                        : "Não encontrado"}
                    </strong>
                  </div>

                  <div style={bioReviewMetricStyle}>
                    <span style={bioReviewMetricLabelStyle}>
                      Gordura corporal
                    </span>

                    <strong style={bioReviewMetricValueStyle}>
                      {bioBodyFat
                        ? `${bioBodyFat}%`
                        : "Não encontrada"}
                    </strong>
                  </div>

                  <div style={bioReviewMetricStyle}>
                    <span style={bioReviewMetricLabelStyle}>
                      Massa muscular
                    </span>

                    <strong style={bioReviewMetricValueStyle}>
                      {bioMuscleMass
                        ? `${bioMuscleMass} kg`
                        : "Não encontrada"}
                    </strong>
                  </div>

                  <div style={bioReviewMetricStyle}>
                    <span style={bioReviewMetricLabelStyle}>
                      Água corporal
                    </span>

                    <strong style={bioReviewMetricValueStyle}>
                      {bioWaterPercent
                        ? `${bioWaterPercent}%`
                        : "Não encontrada"}
                    </strong>
                  </div>

                  <div style={bioReviewMetricStyle}>
                    <span style={bioReviewMetricLabelStyle}>
                      Gordura visceral
                    </span>

                    <strong style={bioReviewMetricValueStyle}>
                      {bioVisceralFat ||
                        "Não encontrada"}
                    </strong>
                  </div>

                  <div style={bioReviewMetricStyle}>
                    <span style={bioReviewMetricLabelStyle}>
                      Metabolismo basal
                    </span>

                    <strong style={bioReviewMetricValueStyle}>
                      {bioBmr
                        ? `${bioBmr} kcal`
                        : "Não encontrado"}
                    </strong>
                  </div>
                </div>

                {bioAnalysisSummary && (
                  <div style={bioReviewTextSectionStyle}>
                    <div style={bioReviewSectionLabelStyle}>
                      Resumo
                    </div>

                    <p style={bioReviewBodyTextStyle}>
                      {bioAnalysisSummary}
                    </p>
                  </div>
                )}

                {bioPerformanceInsights.length > 0 && (
                  <div style={bioReviewTextSectionStyle}>
                    <div style={bioReviewSectionLabelStyle}>
                      Performance
                    </div>

                    <div style={bioReviewListStyle}>
                      {bioPerformanceInsights.map(
                        (insight, index) => (
                          <div
                            key={`performance-${index}`}
                            style={bioReviewListItemStyle}
                          >
                            <span
                              style={bioReviewBulletStyle}
                            />

                            <span>{insight}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {bioNutritionInsights.length > 0 && (
                  <div style={bioReviewTextSectionStyle}>
                    <div style={bioReviewSectionLabelStyle}>
                      Nutrição
                    </div>

                    <div style={bioReviewListStyle}>
                      {bioNutritionInsights.map(
                        (insight, index) => (
                          <div
                            key={`nutrition-${index}`}
                            style={bioReviewListItemStyle}
                          >
                            <span
                              style={bioReviewBulletStyle}
                            />

                            <span>{insight}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {bioAttentionPoints.length > 0 && (
                  <div style={bioAttentionSectionStyle}>
                    <div style={bioAttentionLabelStyle}>
                      Pontos de atenção
                    </div>

                    <div style={bioReviewListStyle}>
                      {bioAttentionPoints.map(
                        (point, index) => (
                          <div
                            key={`attention-${index}`}
                            style={bioReviewListItemStyle}
                          >
                            <span
                              style={bioAttentionBulletStyle}
                            />

                            <span>{point}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {bioDisclaimer && (
                  <p style={bioDisclaimerStyle}>
                    {bioDisclaimer}
                  </p>
                )}

                <button
                  type="button"
                  disabled={savingBio}
                  onClick={() =>
                    bioFormRef.current?.requestSubmit()
                  }
                  style={{
                    ...bioConfirmButtonStyle,
                    opacity: savingBio ? 0.5 : 1,
                    cursor: savingBio
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {savingBio
                    ? "Salvando..."
                    : "Confirmar e salvar"}
                </button>
              </section>
            )}

            <div style={bioManualDividerStyle}>
              <span style={bioManualDividerLineStyle} />

              <span style={bioManualDividerTextStyle}>
                ou digite manualmente
              </span>

              <span style={bioManualDividerLineStyle} />
            </div>

            <form
              ref={bioFormRef}
              onSubmit={handleSaveBioimpedance}
              style={bioFormStyle}
            >
              <label style={weightFieldStyle}>
                <span style={weightInputLabelStyle}>
                  Data da avaliação
                </span>

                <input
                  type="date"
                  value={bioAssessmentDate}
                  onChange={(event) =>
                    setBioAssessmentDate(
                      event.target.value
                    )
                  }
                  disabled={savingBio}
                  style={bioInputStyle}
                />
              </label>

              <label style={weightFieldStyle}>
                <span style={weightInputLabelStyle}>
                  Peso
                </span>

                <div style={weightInputWrapperStyle}>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={bioWeightKg}
                    onChange={(event) =>
                      setBioWeightKg(
                        event.target.value
                      )
                    }
                    placeholder="Ex.: 82,5"
                    disabled={savingBio}
                    style={weightInputStyle}
                  />

                  <span style={weightUnitStyle}>
                    kg
                  </span>
                </div>
              </label>

              <label style={weightFieldStyle}>
                <span style={weightInputLabelStyle}>
                  Gordura corporal
                </span>

                <div style={weightInputWrapperStyle}>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={bioBodyFat}
                    onChange={(event) =>
                      setBioBodyFat(
                        event.target.value
                      )
                    }
                    placeholder="Ex.: 18,7"
                    disabled={savingBio}
                    style={weightInputStyle}
                  />

                  <span style={weightUnitStyle}>
                    %
                  </span>
                </div>
              </label>

              <label style={weightFieldStyle}>
                <span style={weightInputLabelStyle}>
                  Massa muscular
                </span>

                <div style={weightInputWrapperStyle}>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={bioMuscleMass}
                    onChange={(event) =>
                      setBioMuscleMass(
                        event.target.value
                      )
                    }
                    placeholder="Ex.: 38,2"
                    disabled={savingBio}
                    style={weightInputStyle}
                  />

                  <span style={weightUnitStyle}>
                    kg
                  </span>
                </div>
              </label>

              <label style={weightFieldStyle}>
                <span style={weightInputLabelStyle}>
                  Gordura visceral
                </span>

                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={bioVisceralFat}
                  onChange={(event) =>
                    setBioVisceralFat(
                      event.target.value
                    )
                  }
                  placeholder="Ex.: 6"
                  disabled={savingBio}
                  style={bioInputStyle}
                />
              </label>

              <label style={weightFieldStyle}>
                <span style={weightInputLabelStyle}>
                  Água corporal
                </span>

                <div style={weightInputWrapperStyle}>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={bioWaterPercent}
                    onChange={(event) =>
                      setBioWaterPercent(
                        event.target.value
                      )
                    }
                    placeholder="Ex.: 58,1"
                    disabled={savingBio}
                    style={weightInputStyle}
                  />

                  <span style={weightUnitStyle}>
                    %
                  </span>
                </div>
              </label>

              <label style={weightFieldStyle}>
                <span style={weightInputLabelStyle}>
                  Metabolismo basal
                </span>

                <div style={weightInputWrapperStyle}>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={bioBmr}
                    onChange={(event) =>
                      setBioBmr(
                        event.target.value
                      )
                    }
                    placeholder="Ex.: 1834"
                    disabled={savingBio}
                    style={weightInputStyle}
                  />

                  <span style={bioBmrUnitStyle}>
                    kcal
                  </span>
                </div>
              </label>

              <label style={bioNotesFieldStyle}>
                <span style={weightInputLabelStyle}>
                  Observações
                </span>

                <textarea
                  value={bioNotes}
                  onChange={(event) =>
                    setBioNotes(event.target.value)
                  }
                  placeholder="Informações adicionais do laudo ou da avaliação."
                  disabled={savingBio}
                  rows={4}
                  style={bioTextareaStyle}
                />
              </label>

              <div style={bioSaveAreaStyle}>
                <button
                  type="submit"
                  disabled={savingBio}
                  style={{
                    ...saveWeightButtonStyle,
                    opacity: savingBio ? 0.5 : 1,
                    cursor: savingBio
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {savingBio
                    ? "Salvando..."
                    : "Salvar avaliação"}
                </button>
              </div>
            </form>
          </section>
        )}

        {bioMessage && (
          <div style={successMessageStyle}>
            {bioMessage}
          </div>
        )}

        {bioError && (
          <div style={errorMessageStyle}>
            {bioError}
          </div>
        )}

        {weightMessage && (
          <div style={successMessageStyle}>
            {weightMessage}
          </div>
        )}

        {weightError && (
          <div style={errorMessageStyle}>
            {weightError}
          </div>
        )}

        <section style={summaryGridStyle}>
          {summaryCards.map((card) => (
            <article
              key={card.label}
              style={summaryCardStyle}
            >
              <div style={cardLabelStyle}>
                {card.label}
              </div>

              <div
                style={{
                  ...cardValueStyle,
                  color: card.accent || "#f4f4f5",
                }}
              >
                {card.value}
              </div>

              <div style={cardDetailStyle}>
                {card.detail}
              </div>
            </article>
          ))}
        </section>

        <section style={sectionPanelStyle}>
          <div style={sectionHeaderStyle}>
            <div style={{ minWidth: 0 }}>
              <div style={sectionEyebrowStyle}>
                Histórico
              </div>

              <h2 style={sectionTitleStyle}>
                Evolução do peso
              </h2>

              <p style={sectionDescriptionStyle}>
                {weightLogs.length}{" "}
                {weightLogs.length === 1
                  ? "registro encontrado"
                  : "registros encontrados"}
              </p>
            </div>

            {weightVariation !== null && (
              <div
                style={{
                  ...variationBadgeStyle,
                  color: variationColor,
                  borderColor: `${variationColor}55`,
                }}
              >
                {weightVariation > 0 ? "+" : ""}
                {weightVariation.toFixed(1)} kg no período
              </div>
            )}
          </div>

          {chartPoints.length === 0 ? (
            <div style={emptyChartStyle}>
              Registre seu peso para visualizar a
              evolução.
            </div>
          ) : (
            <div style={chartWrapperStyle}>
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio="none"
                role="img"
                aria-label="Gráfico de evolução do peso"
                style={chartStyle}
              >
                <defs>
                  <linearGradient
                    id="weight-area-gradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#fff1a8"
                      stopOpacity="0.24"
                    />

                    <stop
                      offset="100%"
                      stopColor="#fff1a8"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                {[0.25, 0.5, 0.75].map(
                  (position) => {
                    const y = chartHeight * position;

                    return (
                      <line
                        key={position}
                        x1={chartPaddingX}
                        x2={
                          chartWidth -
                          chartPaddingX
                        }
                        y1={y}
                        y2={y}
                        stroke="rgba(255,255,255,0.07)"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  }
                )}

                {chartPoints.length > 1 && (
                  <>
                    <polygon
                      points={`${chartPaddingX},${
                        chartHeight -
                        chartPaddingY
                      } ${chartLine} ${
                        chartWidth -
                        chartPaddingX
                      },${
                        chartHeight -
                        chartPaddingY
                      }`}
                      fill="url(#weight-area-gradient)"
                    />

                    <polyline
                      points={chartLine}
                      fill="none"
                      stroke="#fff1a8"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                )}

                {chartPoints.map((point) => (
                  <g key={point.id}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="5"
                      fill="#09090b"
                      stroke="#fff1a8"
                      strokeWidth="3"
                      vectorEffect="non-scaling-stroke"
                    />

                    <title>
                      {`${point.weight.toFixed(
                        1
                      )} kg — ${formatDate(
                        point.date
                      )}`}
                    </title>
                  </g>
                ))}
              </svg>

              <div style={chartDatesStyle}>
                <span>
                  {formatDate(
                    chronologicalWeights[0]?.created_at
                  )}
                </span>

                <span style={{ textAlign: "right" }}>
                  {formatDate(
                    chronologicalWeights[
                      chronologicalWeights.length - 1
                    ]?.created_at
                  )}
                </span>
              </div>
            </div>
          )}
        </section>

        <section style={contentGridStyle}>
          <article style={sectionPanelStyle}>
            <div style={timelineHeaderStyle}>
              <div>
                <div style={sectionEyebrowStyle}>
                  Registros
                </div>

                <h2 style={sectionTitleStyle}>
                  Timeline corporal
                </h2>

                <p style={sectionDescriptionStyle}>
                  Evolução entre cada medição registrada.
                </p>
              </div>

              {weightLogs.length > 0 && (
                <div style={timelineCountStyle}>
                  {weightLogs.length}{" "}
                  {weightLogs.length === 1
                    ? "medição"
                    : "medições"}
                </div>
              )}
            </div>

            {weightLogs.length === 0 ? (
              <p style={emptyTextStyle}>
                Nenhuma pesagem registrada.
              </p>
            ) : (
              <div style={timelineStyle}>
                {weightLogs
                  .slice(0, 10)
                  .map((item, index) => {
                    const currentValue = Number(
                      item.weight_kg
                    );

                    const olderItem =
                      weightLogs[index + 1];

                    const olderValue = olderItem
                      ? Number(olderItem.weight_kg)
                      : null;

                    const difference =
                      olderValue !== null &&
                      Number.isFinite(olderValue)
                        ? Number(
                            (
                              currentValue -
                              olderValue
                            ).toFixed(1)
                          )
                        : null;

                    const differenceColor =
                      difference === null
                        ? "#6f6f78"
                        : difference < 0
                          ? "#86efac"
                          : difference > 0
                            ? "#fde68a"
                            : "#a1a1aa";

                    const differenceText =
                      difference === null
                        ? "Primeira medição"
                        : difference < 0
                          ? `${difference.toFixed(
                              1
                            )} kg desde a anterior`
                          : difference > 0
                            ? `+${difference.toFixed(
                                1
                              )} kg desde a anterior`
                            : "Sem alteração";

                    const direction =
                      difference === null
                        ? "Início"
                        : difference < 0
                          ? "Redução"
                          : difference > 0
                            ? "Aumento"
                            : "Estável";

                    return (
                      <div
                        key={item.id}
                        style={timelineItemStyle}
                      >
                        <div
                          style={timelineRailStyle}
                          aria-hidden="true"
                        >
                          <div
                            style={{
                              ...timelineDotStyle,
                              borderColor:
                                index === 0
                                  ? "#fff1a8"
                                  : "rgba(255,255,255,0.24)",
                              background:
                                index === 0
                                  ? "#fff1a8"
                                  : "#101010",
                              boxShadow:
                                index === 0
                                  ? "0 0 0 5px rgba(255,241,168,0.08)"
                                  : "none",
                            }}
                          />

                          {index <
                            Math.min(
                              weightLogs.length,
                              10
                            ) -
                              1 && (
                            <div
                              style={
                                timelineLineStyle
                              }
                            />
                          )}
                        </div>

                        <div
                          style={timelineContentStyle}
                        >
                          <div
                            style={
                              timelineTopRowStyle
                            }
                          >
                            <div>
                              <div
                                style={
                                  timelineDateStyle
                                }
                              >
                                {formatTimelineDate(
                                  item.created_at
                                )}
                              </div>

                              <div
                                style={
                                  timelineTimeStyle
                                }
                              >
                                {formatTimelineTime(
                                  item.created_at
                                )}
                              </div>
                            </div>

                            <div
                              style={
                                timelineWeightStyle
                              }
                            >
                              {currentValue.toFixed(
                                1
                              )}{" "}
                              <span
                                style={
                                  timelineUnitStyle
                                }
                              >
                                kg
                              </span>
                            </div>
                          </div>

                          <div
                            style={
                              timelineBottomRowStyle
                            }
                          >
                            <span
                              style={{
                                ...timelineChangeStyle,
                                color:
                                  differenceColor,
                              }}
                            >
                              {differenceText}
                            </span>

                            <span
                              style={{
                                ...timelineDirectionStyle,
                                color:
                                  differenceColor,
                                borderColor: `${differenceColor}40`,
                              }}
                            >
                              {direction}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </article>

          <article style={sectionPanelStyle}>
            <div style={sectionHeaderStyle}>
              <div style={{ minWidth: 0 }}>
                <div style={sectionEyebrowStyle}>
                  Composição corporal
                </div>

                <h2 style={sectionTitleStyle}>
                  Última bioimpedância
                </h2>

                <p style={sectionDescriptionStyle}>
                  {latestBio
                    ? formatDate(
                        latestBio.assessment_date ||
                          latestBio.created_at
                      )
                    : "Nenhuma avaliação registrada"}
                </p>
              </div>

              {latestBio && (
                <div style={currentBadgeStyle}>
                  Atual
                </div>
              )}
            </div>

            {latestBioMetrics.length === 0 ? (
              <p style={emptyTextStyle}>
                Nenhuma avaliação corporal registrada.
              </p>
            ) : (
              <div style={bioMetricsGridStyle}>
                {latestBioMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    style={bioMetricCardStyle}
                  >
                    <div style={bioMetricLabelStyle}>
                      {metric.label}
                    </div>

                    <div style={bioMetricValueStyle}>
                      {metric.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {latestBio?.notes && (
              <div style={notesStyle}>
                {latestBio.notes}
              </div>
            )}
          </article>
        </section>

        {bioimpedanceLogs.length > 1 && (
          <section style={sectionPanelStyle}>
            <div style={sectionEyebrowStyle}>
              Histórico
            </div>

            <h2 style={sectionTitleStyle}>
              Avaliações anteriores
            </h2>

            <div style={previousBioGridStyle}>
              {bioimpedanceLogs
                .slice(1)
                .map((item) => (
                  <article
                    key={item.id}
                    style={previousBioCardStyle}
                  >
                    <div style={previousBioDateStyle}>
                      {formatDate(
                        item.assessment_date ||
                          item.created_at
                      )}
                    </div>

                    <div style={previousBioValuesStyle}>
                      <div style={previousMetricStyle}>
                        <span
                          style={
                            previousMetricLabelStyle
                          }
                        >
                          Peso
                        </span>

                        <strong
                          style={
                            previousMetricValueStyle
                          }
                        >
                          {formatValue(
                            item.weight_kg,
                            " kg"
                          )}
                        </strong>
                      </div>

                      <div style={previousMetricStyle}>
                        <span
                          style={
                            previousMetricLabelStyle
                          }
                        >
                          Gordura
                        </span>

                        <strong
                          style={
                            previousMetricValueStyle
                          }
                        >
                          {formatValue(
                            item.body_fat_percent,
                            "%"
                          )}
                        </strong>
                      </div>

                      <div style={previousMetricStyle}>
                        <span
                          style={
                            previousMetricLabelStyle
                          }
                        >
                          Músculo
                        </span>

                        <strong
                          style={
                            previousMetricValueStyle
                          }
                        >
                          {formatValue(
                            item.muscle_mass_kg,
                            " kg"
                          )}
                        </strong>
                      </div>

                      <div style={previousMetricStyle}>
                        <span
                          style={
                            previousMetricLabelStyle
                          }
                        >
                          Água
                        </span>

                        <strong
                          style={
                            previousMetricValueStyle
                          }
                        >
                          {formatValue(
                            item.body_water_percent,
                            "%"
                          )}
                        </strong>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at 50% -120px, rgba(212,175,55,0.13) 0%, rgba(212,175,55,0.035) 24%, rgba(9,9,11,0) 48%), linear-gradient(180deg, #09090b 0%, #050506 55%, #000000 100%)",
  color: "#f4f4f5",
  fontFamily: "Montserrat, sans-serif",
  boxSizing: "border-box",
};

const pageContainerStyle: React.CSSProperties = {
  width: "min(100%, 1120px)",
  margin: "0 auto",
  padding:
    "clamp(44px, 7vw, 76px) clamp(16px, 5vw, 64px) clamp(100px, 12vw, 140px)",
  boxSizing: "border-box",
};

const loadingWrapperStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const headerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 310px), 1fr))",
  gap: "clamp(26px, 6vw, 70px)",
  alignItems: "end",
  marginBottom: "clamp(30px, 5vw, 52px)",
  minWidth: 0,
};

const headerTextStyle: React.CSSProperties = {
  minWidth: 0,
  maxWidth: 720,
};

const eyebrowStyle: React.CSSProperties = {
  color: "#fff1a8",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.8,
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  margin: "14px 0 0",
  color: "#f4f4f5",
  fontSize: "clamp(34px, 7vw, 64px)",
  lineHeight: 1.02,
  fontWeight: 800,
  letterSpacing: "-0.045em",
  overflowWrap: "anywhere",
};

const subtitleStyle: React.CSSProperties = {
  maxWidth: 680,
  margin: "20px 0 0",
  color: "#a1a1aa",
  fontSize: "clamp(14px, 2vw, 17px)",
  lineHeight: 1.75,
};

const headerActionsStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "grid",
  gap: 20,
  alignContent: "end",
};

const registerWeightButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 50,
  border: "1px solid rgba(255,241,168,0.78)",
  borderRadius: 0,
  background: "#fff1a8",
  color: "#111111",
  padding: "14px 18px",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.2,
  cursor: "pointer",
  boxSizing: "border-box",
};

const registerBioButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 50,
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 0,
  background: "rgba(255,255,255,0.035)",
  color: "#f4f4f5",
  padding: "14px 18px",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.2,
  cursor: "pointer",
  boxSizing: "border-box",
};

const bioFormPanelStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  marginBottom: "clamp(22px, 4vw, 36px)",
  padding: "clamp(22px, 4vw, 34px)",
  border: "1px solid rgba(255,255,255,0.13)",
  background:
    "linear-gradient(145deg, rgba(23,23,25,0.98) 0%, rgba(12,12,14,0.99) 100%)",
  boxShadow:
    "0 16px 36px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
  boxSizing: "border-box",
};

const bioUploadAreaStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  marginTop: 28,
  padding: "clamp(24px, 5vw, 42px)",
  border: "1px dashed rgba(255,255,255,0.18)",
  transition:
    "border-color 160ms ease, background 160ms ease",
  textAlign: "center",
  boxSizing: "border-box",
};

const hiddenFileInputStyle: React.CSSProperties = {
  display: "none",
};

const bioUploadLabelStyle: React.CSSProperties = {
  marginBottom: 12,
  color: "#85858e",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.5,
  textTransform: "uppercase",
};

const bioUploadTitleStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "clamp(18px, 3vw, 24px)",
  fontWeight: 700,
  letterSpacing: -0.4,
};

const bioUploadDescriptionStyle: React.CSSProperties = {
  maxWidth: 560,
  margin: "12px auto 22px",
  color: "#9b9ba3",
  fontSize: 13,
  lineHeight: 1.7,
};

const bioSelectFileButtonStyle: React.CSSProperties = {
  minHeight: 48,
  border: "1px solid rgba(255,255,255,0.9)",
  borderRadius: 0,
  background: "#ffffff",
  color: "#09090b",
  padding: "13px 20px",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.3,
  cursor: "pointer",
};

const bioUploadFormatsStyle: React.CSSProperties = {
  marginTop: 14,
  color: "#66666e",
  fontSize: 10,
  fontWeight: 600,
};

const bioSelectedFileStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 680,
  margin: "0 auto",
  textAlign: "left",
};

const bioSelectedFileHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};

const bioSelectedFileInfoStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  minWidth: 0,
  flex: "1 1 260px",
};

const bioFileTypeBadgeStyle: React.CSSProperties = {
  display: "grid",
  placeItems: "center",
  width: 52,
  height: 52,
  flexShrink: 0,
  border: "1px solid rgba(255,255,255,0.17)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.8,
};

const bioFileTextAreaStyle: React.CSSProperties = {
  minWidth: 0,
};

const bioFileNameStyle: React.CSSProperties = {
  overflow: "hidden",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 700,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const bioFileMetadataStyle: React.CSSProperties = {
  marginTop: 5,
  color: "#777780",
  fontSize: 11,
  fontWeight: 500,
};

const bioRemoveFileButtonStyle: React.CSSProperties = {
  border: 0,
  background: "transparent",
  color: "#a1a1aa",
  padding: "8px 0",
  fontFamily: "inherit",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
};

const bioFileReadyStyle: React.CSSProperties = {
  marginTop: 24,
  paddingTop: 18,
  borderTop: "1px solid rgba(255,255,255,0.1)",
  color: "#a1a1aa",
  fontSize: 11,
  fontWeight: 600,
};

const bioAnalyzeButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 50,
  marginTop: 16,
  border: "1px solid rgba(255,255,255,0.9)",
  borderRadius: 0,
  background: "#ffffff",
  color: "#09090b",
  padding: "14px 18px",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.3,
  transition:
    "opacity 160ms ease, background 160ms ease",
};

const bioNextStepTextStyle: React.CSSProperties = {
  marginTop: 10,
  color: "#606068",
  fontSize: 10,
  textAlign: "center",
};

const bioUploadErrorStyle: React.CSSProperties = {
  marginTop: 12,
  padding: "12px 14px",
  border: "1px solid rgba(239,68,68,0.3)",
  background: "rgba(239,68,68,0.08)",
  color: "#fca5a5",
  fontSize: 12,
  fontWeight: 600,
};

const bioReviewPanelStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  marginTop: 20,
  padding: "clamp(22px, 4vw, 32px)",
  border: "1px solid rgba(255,255,255,0.18)",
  background:
    "linear-gradient(145deg, rgba(27,27,30,0.98) 0%, rgba(15,15,17,0.99) 100%)",
  boxShadow:
    "0 18px 42px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.05)",
  boxSizing: "border-box",
};

const bioReviewEyebrowStyle: React.CSSProperties = {
  marginBottom: 10,
  color: "#85858e",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1.5,
  textTransform: "uppercase",
};

const bioReviewHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 18,
  flexWrap: "wrap",
};

const bioReviewTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#ffffff",
  fontSize: "clamp(19px, 3vw, 25px)",
  fontWeight: 700,
  letterSpacing: -0.5,
};

const bioReviewDescriptionStyle: React.CSSProperties = {
  maxWidth: 620,
  margin: "10px 0 0",
  color: "#96969f",
  fontSize: 12,
  lineHeight: 1.7,
};

const bioReviewStatusStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.045)",
  color: "#d4d4d8",
  padding: "8px 11px",
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: 0.8,
  textTransform: "uppercase",
};

const bioReviewMetricsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
  gap: 1,
  marginTop: 26,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.1)",
};

const bioReviewMetricStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  minHeight: 92,
  padding: 16,
  background: "#121214",
  boxSizing: "border-box",
};

const bioReviewMetricLabelStyle: React.CSSProperties = {
  color: "#74747c",
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: 0.9,
  textTransform: "uppercase",
};

const bioReviewMetricValueStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 700,
  overflowWrap: "anywhere",
};

const bioReviewTextSectionStyle: React.CSSProperties = {
  marginTop: 22,
  paddingTop: 20,
  borderTop: "1px solid rgba(255,255,255,0.1)",
};

const bioReviewSectionLabelStyle: React.CSSProperties = {
  marginBottom: 10,
  color: "#8f8f98",
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: 1.1,
  textTransform: "uppercase",
};

const bioReviewBodyTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#d0d0d4",
  fontSize: 12,
  lineHeight: 1.75,
};

const bioReviewListStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const bioReviewListItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  color: "#d0d0d4",
  fontSize: 12,
  lineHeight: 1.7,
};

const bioReviewBulletStyle: React.CSSProperties = {
  width: 5,
  height: 5,
  marginTop: 8,
  flexShrink: 0,
  background: "#a1a1aa",
};

const bioAttentionSectionStyle: React.CSSProperties = {
  marginTop: 22,
  padding: 18,
  border: "1px solid rgba(245,158,11,0.24)",
  background: "rgba(245,158,11,0.055)",
};

const bioAttentionLabelStyle: React.CSSProperties = {
  marginBottom: 10,
  color: "#fbbf24",
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: 1.1,
  textTransform: "uppercase",
};

const bioAttentionBulletStyle: React.CSSProperties = {
  width: 5,
  height: 5,
  marginTop: 8,
  flexShrink: 0,
  background: "#fbbf24",
};

const bioDisclaimerStyle: React.CSSProperties = {
  margin: "20px 0 0",
  color: "#686871",
  fontSize: 10,
  lineHeight: 1.65,
};

const bioConfirmButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 52,
  marginTop: 24,
  border: "1px solid #ffffff",
  borderRadius: 0,
  background: "#ffffff",
  color: "#09090b",
  padding: "14px 18px",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.35,
};

const bioManualDividerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  width: "100%",
  margin: "28px 0 0",
};

const bioManualDividerLineStyle: React.CSSProperties = {
  height: 1,
  flex: 1,
  background: "rgba(255,255,255,0.1)",
};

const bioManualDividerTextStyle: React.CSSProperties = {
  color: "#686870",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 1.1,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const bioFormStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 18,
  alignItems: "end",
  marginTop: 28,
  width: "100%",
  minWidth: 0,
};

const bioInputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: 52,
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 0,
  outline: "none",
  background: "#111111",
  color: "#ffffff",
  padding: "0 16px",
  fontFamily: "inherit",
  fontSize: 15,
  fontWeight: 600,
  boxSizing: "border-box",
  colorScheme: "dark",
};

const bioBmrUnitStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  right: 14,
  transform: "translateY(-50%)",
  color: "#85858e",
  fontSize: 10,
  fontWeight: 600,
  pointerEvents: "none",
};

const bioNotesFieldStyle: React.CSSProperties = {
  display: "grid",
  gridColumn: "1 / -1",
  gap: 9,
  minWidth: 0,
};

const bioTextareaStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: 112,
  resize: "vertical",
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 0,
  outline: "none",
  background: "#111111",
  color: "#ffffff",
  padding: 15,
  fontFamily: "inherit",
  fontSize: 14,
  lineHeight: 1.6,
  boxSizing: "border-box",
};

const bioSaveAreaStyle: React.CSSProperties = {
  gridColumn: "1 / -1",
  display: "flex",
  justifyContent: "flex-end",
  width: "100%",
  minWidth: 0,
};

const weightFormPanelStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  marginBottom: "clamp(22px, 4vw, 36px)",
  padding: "clamp(22px, 4vw, 34px)",
  border: "1px solid rgba(255,241,168,0.28)",
  background:
    "linear-gradient(145deg, rgba(28,27,22,0.96) 0%, rgba(15,15,17,0.98) 100%)",
  boxShadow:
    "0 16px 36px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
  boxSizing: "border-box",
};

const weightFormHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
};

const weightFormTitleStyle: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#f4f4f5",
  fontSize: "clamp(22px, 4vw, 30px)",
  lineHeight: 1.2,
  fontWeight: 700,
  letterSpacing: "-0.025em",
};

const weightFormStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  gap: 16,
  alignItems: "end",
  marginTop: 26,
  width: "100%",
  minWidth: 0,
};

const weightFieldStyle: React.CSSProperties = {
  display: "grid",
  gap: 9,
  minWidth: 0,
};

const weightInputLabelStyle: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.4,
};

const weightInputWrapperStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  minWidth: 0,
};

const weightInputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: 52,
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 0,
  outline: "none",
  background: "#111111",
  color: "#ffffff",
  padding: "0 58px 0 16px",
  fontFamily: "inherit",
  fontSize: 16,
  fontWeight: 600,
  boxSizing: "border-box",
};

const weightUnitStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  right: 16,
  transform: "translateY(-50%)",
  color: "#85858e",
  fontSize: 12,
  fontWeight: 600,
  pointerEvents: "none",
};

const saveWeightButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 52,
  border: "1px solid rgba(255,241,168,0.78)",
  borderRadius: 0,
  background: "#fff1a8",
  color: "#111111",
  padding: "14px 18px",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 700,
  boxSizing: "border-box",
};

const successMessageStyle: React.CSSProperties = {
  width: "100%",
  marginBottom: 20,
  padding: "13px 15px",
  border: "1px solid rgba(134,239,172,0.35)",
  background: "rgba(20,83,45,0.18)",
  color: "#bbf7d0",
  fontSize: 13,
  lineHeight: 1.6,
  boxSizing: "border-box",
};

const errorMessageStyle: React.CSSProperties = {
  width: "100%",
  marginBottom: 20,
  padding: "13px 15px",
  border: "1px solid rgba(248,113,113,0.35)",
  background: "rgba(127,29,29,0.14)",
  color: "#fecaca",
  fontSize: 13,
  lineHeight: 1.6,
  boxSizing: "border-box",
};

const statusPanelStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  padding: "20px 0 4px",
  borderTop: "1px solid rgba(255,255,255,0.12)",
  boxSizing: "border-box",
};

const statusLabelStyle: React.CSSProperties = {
  color: "#85858e",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 1.2,
  textTransform: "uppercase",
};

const statusValueStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: "clamp(16px, 3vw, 21px)",
  fontWeight: 700,
  lineHeight: 1.35,
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 1,
  width: "100%",
  minWidth: 0,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.09)",
  background: "rgba(255,255,255,0.09)",
  marginBottom: "clamp(22px, 4vw, 36px)",
  boxSizing: "border-box",
};

const summaryCardStyle: React.CSSProperties = {
  minWidth: 0,
  minHeight: 156,
  padding: "clamp(20px, 3vw, 28px)",
  background: "#101010",
  boxSizing: "border-box",
};

const cardLabelStyle: React.CSSProperties = {
  color: "#85858e",
  fontSize: 12,
  fontWeight: 600,
};

const cardValueStyle: React.CSSProperties = {
  marginTop: 20,
  fontSize: "clamp(25px, 5vw, 34px)",
  lineHeight: 1,
  fontWeight: 800,
  letterSpacing: "-0.035em",
  overflowWrap: "anywhere",
};

const cardDetailStyle: React.CSSProperties = {
  marginTop: 14,
  color: "#6f6f78",
  fontSize: 12,
  lineHeight: 1.55,
  overflowWrap: "anywhere",
};

const sectionPanelStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  padding: "clamp(22px, 4vw, 34px)",
  border: "1px solid rgba(255,255,255,0.09)",
  background:
    "linear-gradient(145deg, rgba(24,24,27,0.88) 0%, rgba(15,15,17,0.96) 100%)",
  boxShadow:
    "0 14px 30px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.04)",
  boxSizing: "border-box",
  overflow: "hidden",
  marginBottom: "clamp(22px, 4vw, 36px)",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: 18,
  minWidth: 0,
};

const sectionEyebrowStyle: React.CSSProperties = {
  color: "#fff1a8",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.6,
  textTransform: "uppercase",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#f4f4f5",
  fontSize: "clamp(21px, 4vw, 28px)",
  lineHeight: 1.2,
  fontWeight: 700,
  letterSpacing: "-0.025em",
  overflowWrap: "anywhere",
};

const sectionDescriptionStyle: React.CSSProperties = {
  margin: "9px 0 0",
  color: "#85858e",
  fontSize: 13,
  lineHeight: 1.6,
};

const variationBadgeStyle: React.CSSProperties = {
  maxWidth: "100%",
  padding: "9px 12px",
  border: "1px solid",
  background: "rgba(255,241,168,0.04)",
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1.4,
  boxSizing: "border-box",
  overflowWrap: "anywhere",
};

const currentBadgeStyle: React.CSSProperties = {
  color: "#fff1a8",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.2,
  textTransform: "uppercase",
};

const chartWrapperStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  marginTop: "clamp(26px, 5vw, 42px)",
  overflow: "hidden",
};

const chartStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: "100%",
  height: "clamp(210px, 35vw, 300px)",
  overflow: "visible",
};

const chartDatesStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  gap: 12,
  marginTop: 12,
  color: "#5f5f67",
  fontSize: 10,
  lineHeight: 1.4,
};

const emptyChartStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 220,
  marginTop: 26,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  border: "1px dashed rgba(255,255,255,0.12)",
  color: "#85858e",
  textAlign: "center",
  lineHeight: 1.7,
  boxSizing: "border-box",
};

const contentGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
  gap: "clamp(22px, 4vw, 36px)",
  width: "100%",
  minWidth: 0,
};

const emptyTextStyle: React.CSSProperties = {
  margin: "22px 0 0",
  color: "#85858e",
  fontSize: 13,
  lineHeight: 1.7,
};

const timelineHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: 18,
};

const timelineCountStyle: React.CSSProperties = {
  padding: "8px 11px",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#85858e",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 0.5,
  textTransform: "uppercase",
};

const timelineStyle: React.CSSProperties = {
  display: "grid",
  marginTop: 28,
  width: "100%",
  minWidth: 0,
};

const timelineItemStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "24px minmax(0, 1fr)",
  gap: 14,
  width: "100%",
  minWidth: 0,
};

const timelineRailStyle: React.CSSProperties = {
  position: "relative",
  display: "flex",
  justifyContent: "center",
  minHeight: 116,
};

const timelineDotStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  width: 10,
  height: 10,
  marginTop: 6,
  border: "2px solid",
  borderRadius: "50%",
  boxSizing: "border-box",
  flexShrink: 0,
};

const timelineLineStyle: React.CSSProperties = {
  position: "absolute",
  zIndex: 1,
  top: 18,
  bottom: 0,
  left: "50%",
  width: 1,
  transform: "translateX(-50%)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))",
};

const timelineContentStyle: React.CSSProperties = {
  minWidth: 0,
  marginBottom: 18,
  padding: "0 0 20px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const timelineTopRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: 14,
  minWidth: 0,
};

const timelineDateStyle: React.CSSProperties = {
  color: "#f4f4f5",
  fontSize: 14,
  fontWeight: 700,
  textTransform: "capitalize",
};

const timelineTimeStyle: React.CSSProperties = {
  marginTop: 5,
  color: "#5f5f67",
  fontSize: 10,
  fontWeight: 500,
};

const timelineWeightStyle: React.CSSProperties = {
  color: "#f4f4f5",
  fontSize: "clamp(23px, 5vw, 30px)",
  lineHeight: 1,
  fontWeight: 800,
  letterSpacing: "-0.035em",
  whiteSpace: "nowrap",
};

const timelineUnitStyle: React.CSSProperties = {
  color: "#85858e",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0,
};

const timelineBottomRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 17,
};

const timelineChangeStyle: React.CSSProperties = {
  minWidth: 0,
  fontSize: 11,
  fontWeight: 600,
  lineHeight: 1.5,
  overflowWrap: "anywhere",
};

const timelineDirectionStyle: React.CSSProperties = {
  padding: "6px 9px",
  border: "1px solid",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 0.7,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const bioMetricsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 145px), 1fr))",
  gap: 1,
  marginTop: 24,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const bioMetricCardStyle: React.CSSProperties = {
  minWidth: 0,
  padding: 18,
  background: "#111111",
  boxSizing: "border-box",
};

const bioMetricLabelStyle: React.CSSProperties = {
  color: "#85858e",
  fontSize: 10,
  lineHeight: 1.5,
  textTransform: "uppercase",
  letterSpacing: 0.7,
  overflowWrap: "anywhere",
};

const bioMetricValueStyle: React.CSSProperties = {
  marginTop: 10,
  color: "#f4f4f5",
  fontSize: "clamp(16px, 3vw, 20px)",
  fontWeight: 700,
  overflowWrap: "anywhere",
};

const notesStyle: React.CSSProperties = {
  marginTop: 20,
  paddingLeft: 16,
  borderLeft: "2px solid rgba(255,241,168,0.68)",
  color: "#85858e",
  fontSize: 13,
  lineHeight: 1.7,
  overflowWrap: "anywhere",
};

const previousBioGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
  gap: 1,
  marginTop: 24,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const previousBioCardStyle: React.CSSProperties = {
  minWidth: 0,
  padding: 20,
  background: "#101010",
  boxSizing: "border-box",
};

const previousBioDateStyle: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: 11,
  fontWeight: 600,
};

const previousBioValuesStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 90px), 1fr))",
  gap: 18,
  marginTop: 20,
};

const previousMetricStyle: React.CSSProperties = {
  minWidth: 0,
};

const previousMetricLabelStyle: React.CSSProperties = {
  display: "block",
  color: "#5f5f67",
  fontSize: 9,
  letterSpacing: 0.8,
  textTransform: "uppercase",
};

const previousMetricValueStyle: React.CSSProperties = {
  display: "block",
  marginTop: 7,
  color: "#f4f4f5",
  fontSize: 14,
  fontWeight: 700,
  overflowWrap: "anywhere",
};






