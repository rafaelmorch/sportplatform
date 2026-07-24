"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

export type MealFoodItem = {
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

export type MealAnalysisResult = {
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

  /*
   * Data e horário reais em que a refeição foi consumida.
   * O campo é opcional para continuar compatível com a resposta atual da IA.
   */
  consumed_at?: string;
};

type MealReviewModalProps = {
  open: boolean;
  analysis: MealAnalysisResult | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (
    analysis: MealAnalysisResult
  ) => Promise<void> | void;
};

type NumericFoodField =
  | "estimated_grams"
  | "calories"
  | "protein_g"
  | "carbs_g"
  | "fat_g"
  | "fiber_g"
  | "sugar_g"
  | "sodium_mg";

const emptyFoodItem = (): MealFoodItem => ({
  name: "",
  estimated_grams: null,
  serving_description: "",
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: 0,
  sugar_g: 0,
  sodium_mg: 0,
  confidence: 1,
});

function safeNumber(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, parsed);
}

function roundOne(value: number): number {
  return Number(value.toFixed(1));
}

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

function parseConsumedAt(
  value?: string
): {
  date: string;
  time: string;
} {
  if (!value) {
    const now = new Date();

    return {
      date: localDateValue(now),
      time: localTimeValue(now),
    };
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    const now = new Date();

    return {
      date: localDateValue(now),
      time: localTimeValue(now),
    };
  }

  return {
    date: localDateValue(parsed),
    time: localTimeValue(parsed),
  };
}

function createConsumedAt(
  date: string,
  time: string
): string {
  const localDate = new Date(`${date}T${time}:00`);

  if (Number.isNaN(localDate.getTime())) {
    return new Date().toISOString();
  }

  return localDate.toISOString();
}

function calculateTotals(
  foods: MealFoodItem[]
): MealAnalysisResult["totals"] {
  const totals = foods.reduce(
    (accumulator, food) => ({
      calories:
        accumulator.calories +
        safeNumber(food.calories),

      protein_g:
        accumulator.protein_g +
        safeNumber(food.protein_g),

      carbs_g:
        accumulator.carbs_g +
        safeNumber(food.carbs_g),

      fat_g:
        accumulator.fat_g +
        safeNumber(food.fat_g),

      fiber_g:
        accumulator.fiber_g +
        safeNumber(food.fiber_g),

      sugar_g:
        accumulator.sugar_g +
        safeNumber(food.sugar_g),

      sodium_mg:
        accumulator.sodium_mg +
        safeNumber(food.sodium_mg),
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
    calories: Math.round(totals.calories),
    protein_g: roundOne(totals.protein_g),
    carbs_g: roundOne(totals.carbs_g),
    fat_g: roundOne(totals.fat_g),
    fiber_g: roundOne(totals.fiber_g),
    sugar_g: roundOne(totals.sugar_g),
    sodium_mg: Math.round(totals.sodium_mg),
  };
}

export default function MealReviewModal({
  open,
  analysis,
  saving = false,
  onClose,
  onSave,
}: MealReviewModalProps) {
  const [draft, setDraft] =
    useState<MealAnalysisResult | null>(null);

  const [mealDate, setMealDate] =
    useState("");

  const [mealTime, setMealTime] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    if (!open || !analysis) {
      return;
    }

    const consumedAt =
      parseConsumedAt(analysis.consumed_at);

    setMealDate(consumedAt.date);
    setMealTime(consumedAt.time);

    setDraft({
      ...analysis,
      foods: analysis.foods.map((food) => ({
        ...food,
      })),
      totals: {
        ...analysis.totals,
      },
      nutrition_insights: [
        ...analysis.nutrition_insights,
      ],
      attention_points: [
        ...analysis.attention_points,
      ],
    });

    setErrorMessage(null);
  }, [analysis, open]);

  const calculatedTotals = useMemo(
    () => calculateTotals(draft?.foods ?? []),
    [draft?.foods]
  );

  if (!open || !draft) {
    return null;
  }

  const updateFoodText = (
    index: number,
    field: "name" | "serving_description",
    value: string
  ) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        foods: current.foods.map(
          (food, foodIndex) =>
            foodIndex === index
              ? {
                  ...food,
                  [field]: value,
                }
              : food
        ),
      };
    });
  };

  const updateFoodNumber = (
    index: number,
    field: NumericFoodField,
    rawValue: string
  ) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        foods: current.foods.map(
          (food, foodIndex) => {
            if (foodIndex !== index) {
              return food;
            }

            if (
              field === "estimated_grams" &&
              rawValue.trim() === ""
            ) {
              return {
                ...food,
                estimated_grams: null,
              };
            }

            return {
              ...food,
              [field]: safeNumber(rawValue),
            };
          }
        ),
      };
    });
  };

  const removeFood = (index: number) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        foods: current.foods.filter(
          (_, foodIndex) =>
            foodIndex !== index
        ),
      };
    });
  };

  const addFood = () => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        foods: [
          ...current.foods,
          emptyFoodItem(),
        ],
      };
    });
  };

  const handleSave = async () => {
    if (!mealDate || !mealTime) {
      setErrorMessage(
        "Informe a data e o horário da refeição."
      );
      return;
    }

    const validFoods = draft.foods
      .map((food) => ({
        ...food,
        name: food.name.trim(),
        serving_description:
          food.serving_description.trim(),
        estimated_grams:
          food.estimated_grams === null
            ? null
            : safeNumber(
                food.estimated_grams
              ),
        calories: safeNumber(
          food.calories
        ),
        protein_g: safeNumber(
          food.protein_g
        ),
        carbs_g: safeNumber(
          food.carbs_g
        ),
        fat_g: safeNumber(
          food.fat_g
        ),
        fiber_g: safeNumber(
          food.fiber_g
        ),
        sugar_g: safeNumber(
          food.sugar_g
        ),
        sodium_mg: safeNumber(
          food.sodium_mg
        ),
        confidence: Math.min(
          1,
          safeNumber(food.confidence)
        ),
      }))
      .filter((food) => food.name);

    if (validFoods.length === 0) {
      setErrorMessage(
        "Adicione pelo menos um alimento antes de salvar."
      );
      return;
    }

    const finalAnalysis: MealAnalysisResult = {
      ...draft,
      meal_name:
        draft.meal_name.trim() ||
        "Refeição analisada",
      meal_type: "",
      summary: draft.summary.trim(),
      foods: validFoods,
      totals: calculateTotals(validFoods),
      consumed_at: createConsumedAt(
        mealDate,
        mealTime
      ),
    };

    setErrorMessage(null);

    await onSave(finalAnalysis);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Revisar refeição"
      style={overlayStyle}
    >
      <div style={modalStyle}>
        <header style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>
              Nutrition AI
            </p>

            <h2 style={titleStyle}>
              Revisão da refeição
            </h2>

            <p style={subtitleStyle}>
              Revise os alimentos, as porções e
              os valores nutricionais antes de
              salvar.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Fechar"
            style={closeButtonStyle}
          >
            Fechar
          </button>
        </header>

        <div style={contentStyle}>
          <section style={sectionStyle}>
            <SectionHeading
              label="Registro"
              title="Data e horário"
              description="Informe quando esta refeição foi consumida."
            />

            <div style={dateTimeGridStyle}>
              <FieldGroup label="Data">
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
              </FieldGroup>

              <FieldGroup label="Horário">
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
              </FieldGroup>
            </div>
          </section>

          <section style={sectionStyle}>
            <SectionHeading
              label="Identificação"
              title="Informações da refeição"
              description="O nome é sugerido pela análise, mas pode ser alterado."
            />

            <div style={fieldsStackStyle}>
              <FieldGroup label="Nome da refeição">
                <input
                  value={draft.meal_name}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      meal_name:
                        event.target.value,
                    })
                  }
                  style={inputStyle}
                  placeholder="Nome da refeição"
                />
              </FieldGroup>

              <FieldGroup label="Resumo da análise">
                <textarea
                  value={draft.summary}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      summary:
                        event.target.value,
                    })
                  }
                  style={textareaStyle}
                  rows={4}
                  placeholder="Resumo nutricional"
                />
              </FieldGroup>
            </div>
          </section>

          <section style={sectionStyle}>
            <div style={sectionTopRowStyle}>
              <SectionHeading
                label="Composição"
                title="Alimentos identificados"
                description={`${draft.foods.length} ${
                  draft.foods.length === 1
                    ? "alimento identificado"
                    : "alimentos identificados"
                }`}
              />

              <button
                type="button"
                onClick={addFood}
                style={textActionButtonStyle}
              >
                Adicionar alimento
              </button>
            </div>

            <div style={foodsContainerStyle}>
              {draft.foods.length === 0 ? (
                <p style={emptyTextStyle}>
                  Nenhum alimento adicionado.
                </p>
              ) : (
                draft.foods.map(
                  (food, index) => (
                    <div
                      key={`food-${index}`}
                      style={foodSectionStyle}
                    >
                      <div style={foodHeadingStyle}>
                        <div>
                          <p style={foodIndexStyle}>
                            Alimento {index + 1}
                          </p>

                          <h3 style={foodTitleStyle}>
                            {food.name.trim() ||
                              "Novo alimento"}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFood(index)
                          }
                          style={removeButtonStyle}
                        >
                          Remover
                        </button>
                      </div>

                      <div style={foodMainGridStyle}>
                        <FieldGroup label="Alimento">
                          <input
                            value={food.name}
                            onChange={(event) =>
                              updateFoodText(
                                index,
                                "name",
                                event.target.value
                              )
                            }
                            style={inputStyle}
                          />
                        </FieldGroup>

                        <FieldGroup label="Descrição da porção">
                          <input
                            value={
                              food.serving_description
                            }
                            onChange={(event) =>
                              updateFoodText(
                                index,
                                "serving_description",
                                event.target.value
                              )
                            }
                            style={inputStyle}
                            placeholder="Ex.: 1 filé médio"
                          />
                        </FieldGroup>

                        <NumberField
                          label="Quantidade"
                          unit="g"
                          value={
                            food.estimated_grams
                          }
                          onChange={(value) =>
                            updateFoodNumber(
                              index,
                              "estimated_grams",
                              value
                            )
                          }
                        />
                      </div>

                      <div style={nutrientsGridStyle}>
                        <NumberField
                          label="Calorias"
                          unit="kcal"
                          value={food.calories}
                          onChange={(value) =>
                            updateFoodNumber(
                              index,
                              "calories",
                              value
                            )
                          }
                        />

                        <NumberField
                          label="Proteína"
                          unit="g"
                          value={food.protein_g}
                          onChange={(value) =>
                            updateFoodNumber(
                              index,
                              "protein_g",
                              value
                            )
                          }
                        />

                        <NumberField
                          label="Carboidratos"
                          unit="g"
                          value={food.carbs_g}
                          onChange={(value) =>
                            updateFoodNumber(
                              index,
                              "carbs_g",
                              value
                            )
                          }
                        />

                        <NumberField
                          label="Gorduras"
                          unit="g"
                          value={food.fat_g}
                          onChange={(value) =>
                            updateFoodNumber(
                              index,
                              "fat_g",
                              value
                            )
                          }
                        />

                        <NumberField
                          label="Fibras"
                          unit="g"
                          value={food.fiber_g}
                          onChange={(value) =>
                            updateFoodNumber(
                              index,
                              "fiber_g",
                              value
                            )
                          }
                        />

                        <NumberField
                          label="Açúcar"
                          unit="g"
                          value={food.sugar_g}
                          onChange={(value) =>
                            updateFoodNumber(
                              index,
                              "sugar_g",
                              value
                            )
                          }
                        />

                        <NumberField
                          label="Sódio"
                          unit="mg"
                          value={food.sodium_mg}
                          onChange={(value) =>
                            updateFoodNumber(
                              index,
                              "sodium_mg",
                              value
                            )
                          }
                        />
                      </div>

                      <p style={confidenceTextStyle}>
                        Confiança da identificação:{" "}
                        {Math.round(
                          food.confidence * 100
                        )}
                        %
                      </p>
                    </div>
                  )
                )
              )}
            </div>
          </section>

          <section style={sectionStyle}>
            <SectionHeading
              label="Resumo nutricional"
              title="Totais da refeição"
              description="Os totais são atualizados automaticamente conforme os alimentos são alterados."
            />

            <div style={totalsListStyle}>
              <TotalLine
                label="Calorias"
                value={calculatedTotals.calories}
                unit="kcal"
              />

              <TotalLine
                label="Proteína"
                value={calculatedTotals.protein_g}
                unit="g"
              />

              <TotalLine
                label="Carboidratos"
                value={calculatedTotals.carbs_g}
                unit="g"
              />

              <TotalLine
                label="Gorduras"
                value={calculatedTotals.fat_g}
                unit="g"
              />

              <TotalLine
                label="Fibras"
                value={calculatedTotals.fiber_g}
                unit="g"
              />

              <TotalLine
                label="Açúcar"
                value={calculatedTotals.sugar_g}
                unit="g"
              />

              <TotalLine
                label="Sódio"
                value={calculatedTotals.sodium_mg}
                unit="mg"
              />
            </div>
          </section>

          {draft.portion_estimation_note && (
            <section style={sectionStyle}>
              <SectionHeading
                label="Metodologia"
                title="Estimativa das porções"
              />

              <p style={bodyTextStyle}>
                {draft.portion_estimation_note}
              </p>
            </section>
          )}

          {draft.nutrition_insights.length >
            0 && (
            <section style={sectionStyle}>
              <SectionHeading
                label="Análise"
                title="Observações nutricionais"
              />

              <div style={plainListStyle}>
                {draft.nutrition_insights.map(
                  (insight, index) => (
                    <p
                      key={`insight-${index}`}
                      style={plainListItemStyle}
                    >
                      {insight}
                    </p>
                  )
                )}
              </div>
            </section>
          )}

          {draft.attention_points.length >
            0 && (
            <section style={sectionStyle}>
              <SectionHeading
                label="Atenção"
                title="Pontos para revisão"
              />

              <div style={plainListStyle}>
                {draft.attention_points.map(
                  (point, index) => (
                    <p
                      key={`attention-${index}`}
                      style={plainListItemStyle}
                    >
                      {point}
                    </p>
                  )
                )}
              </div>
            </section>
          )}

          <section style={lastSectionStyle}>
            <p style={disclaimerStyle}>
              {draft.disclaimer ||
                "Os valores são estimativas visuais e não substituem uma avaliação nutricional profissional. Revise as porções antes de salvar."}
            </p>

            {errorMessage && (
              <p style={errorStyle}>
                {errorMessage}
              </p>
            )}
          </section>
        </div>

        <footer style={footerStyle}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={cancelButtonStyle}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              ...saveButtonStyle,
              opacity: saving ? 0.6 : 1,
              cursor: saving
                ? "not-allowed"
                : "pointer",
            }}
          >
            {saving
              ? "Salvando..."
              : "Salvar refeição"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function SectionHeading({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p style={sectionLabelStyle}>
        {label}
      </p>

      <h3 style={sectionTitleStyle}>
        {title}
      </h3>

      {description && (
        <p style={sectionDescriptionStyle}>
          {description}
        </p>
      )}
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={fieldGroupStyle}>
      <span style={fieldLabelStyle}>
        {label}
      </span>

      {children}
    </label>
  );
}

function NumberField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: number | null;
  onChange: (value: string) => void;
}) {
  return (
    <FieldGroup label={label}>
      <div style={numberFieldStyle}>
        <input
          type="number"
          min="0"
          step="0.1"
          value={value ?? ""}
          onChange={(event) =>
            onChange(event.target.value)
          }
          style={numberInputStyle}
        />

        <span style={unitStyle}>
          {unit}
        </span>
      </div>
    </FieldGroup>
  );
}

function TotalLine({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div style={totalLineStyle}>
      <span style={totalLabelStyle}>
        {label}
      </span>

      <span style={totalValueStyle}>
        {value}{" "}
        <small style={totalUnitStyle}>
          {unit}
        </small>
      </span>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  background: "rgba(0, 0, 0, 0.82)",
  backdropFilter: "blur(8px)",
};

const modalStyle: CSSProperties = {
  width: "min(920px, 100%)",
  maxHeight: "calc(100vh - 32px)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 22,
  background: "#09090b",
  color: "#ffffff",
  boxShadow: "0 30px 100px rgba(0,0,0,0.55)",
  fontFamily: "Montserrat, sans-serif",
};

const headerStyle: CSSProperties = {
  padding: "24px 26px 22px",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 24,
  borderBottom: "1px solid rgba(255,255,255,0.10)",
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  color: "#22c55e",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1.4,
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: "7px 0 0",
  fontSize: 24,
  lineHeight: 1.2,
  fontWeight: 800,
};

const subtitleStyle: CSSProperties = {
  maxWidth: 620,
  margin: "9px 0 0",
  color: "#a1a1aa",
  fontSize: 12,
  lineHeight: 1.6,
};

const closeButtonStyle: CSSProperties = {
  padding: 0,
  border: "none",
  background: "transparent",
  color: "#a1a1aa",
  fontFamily: "Montserrat, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
};

const contentStyle: CSSProperties = {
  padding: "0 26px",
  overflowY: "auto",
};

const sectionStyle: CSSProperties = {
  padding: "26px 0",
  borderBottom: "1px solid rgba(255,255,255,0.09)",
};

const lastSectionStyle: CSSProperties = {
  padding: "24px 0",
};

const sectionTopRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 20,
  flexWrap: "wrap",
};

const sectionLabelStyle: CSSProperties = {
  margin: 0,
  color: "#22c55e",
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: 1.2,
  textTransform: "uppercase",
};

const sectionTitleStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#ffffff",
  fontSize: 18,
  lineHeight: 1.3,
  fontWeight: 800,
};

const sectionDescriptionStyle: CSSProperties = {
  maxWidth: 650,
  margin: "7px 0 0",
  color: "#71717a",
  fontSize: 11,
  lineHeight: 1.55,
};

const dateTimeGridStyle: CSSProperties = {
  marginTop: 20,
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 14,
};

const fieldsStackStyle: CSSProperties = {
  marginTop: 20,
  display: "grid",
  gap: 16,
};

const fieldGroupStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: 8,
};

const fieldLabelStyle: CSSProperties = {
  color: "#a1a1aa",
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: 0.8,
  textTransform: "uppercase",
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: 44,
  boxSizing: "border-box",
  padding: "10px 12px",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  outline: "none",
  background: "#111113",
  color: "#ffffff",
  colorScheme: "dark",
  fontFamily: "Montserrat, sans-serif",
  fontSize: 12,
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 92,
  resize: "vertical",
  lineHeight: 1.55,
};

const textActionButtonStyle: CSSProperties = {
  padding: "9px 0",
  border: "none",
  background: "transparent",
  color: "#22c55e",
  fontFamily: "Montserrat, sans-serif",
  fontSize: 11,
  fontWeight: 800,
  cursor: "pointer",
};

const foodsContainerStyle: CSSProperties = {
  marginTop: 18,
};

const foodSectionStyle: CSSProperties = {
  padding: "22px 0",
  borderTop: "1px solid rgba(255,255,255,0.08)",
};

const foodHeadingStyle: CSSProperties = {
  marginBottom: 18,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 20,
};

const foodIndexStyle: CSSProperties = {
  margin: 0,
  color: "#71717a",
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: 0.8,
  textTransform: "uppercase",
};

const foodTitleStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "#ffffff",
  fontSize: 15,
  fontWeight: 800,
};

const removeButtonStyle: CSSProperties = {
  padding: 0,
  border: "none",
  background: "transparent",
  color: "#a1a1aa",
  fontFamily: "Montserrat, sans-serif",
  fontSize: 10,
  fontWeight: 700,
  cursor: "pointer",
};

const foodMainGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1.25fr) minmax(0, 1fr) minmax(120px, 0.5fr)",
  gap: 12,
};

const nutrientsGridStyle: CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(115px, 1fr))",
  gap: 12,
};

const numberFieldStyle: CSSProperties = {
  minHeight: 44,
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  background: "#111113",
};

const numberInputStyle: CSSProperties = {
  minWidth: 0,
  width: "100%",
  height: 42,
  boxSizing: "border-box",
  padding: "10px 11px",
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#ffffff",
  fontFamily: "Montserrat, sans-serif",
  fontSize: 12,
};

const unitStyle: CSSProperties = {
  padding: "0 11px",
  color: "#71717a",
  fontSize: 9,
  fontWeight: 800,
};

const confidenceTextStyle: CSSProperties = {
  margin: "14px 0 0",
  color: "#52525b",
  fontSize: 9,
  fontWeight: 700,
};

const totalsListStyle: CSSProperties = {
  marginTop: 20,
  borderTop: "1px solid rgba(255,255,255,0.08)",
};

const totalLineStyle: CSSProperties = {
  minHeight: 48,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const totalLabelStyle: CSSProperties = {
  color: "#a1a1aa",
  fontSize: 11,
  fontWeight: 600,
};

const totalValueStyle: CSSProperties = {
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 800,
};

const totalUnitStyle: CSSProperties = {
  color: "#71717a",
  fontSize: 9,
  fontWeight: 700,
};

const bodyTextStyle: CSSProperties = {
  maxWidth: 760,
  margin: "16px 0 0",
  color: "#a1a1aa",
  fontSize: 11,
  lineHeight: 1.7,
};

const plainListStyle: CSSProperties = {
  marginTop: 16,
  borderTop: "1px solid rgba(255,255,255,0.08)",
};

const plainListItemStyle: CSSProperties = {
  margin: 0,
  padding: "14px 0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  color: "#a1a1aa",
  fontSize: 11,
  lineHeight: 1.65,
};

const disclaimerStyle: CSSProperties = {
  margin: 0,
  color: "#52525b",
  fontSize: 10,
  lineHeight: 1.65,
};

const errorStyle: CSSProperties = {
  margin: "16px 0 0",
  color: "#fca5a5",
  fontSize: 11,
  fontWeight: 700,
};

const emptyTextStyle: CSSProperties = {
  margin: "20px 0 0",
  color: "#71717a",
  fontSize: 11,
};

const footerStyle: CSSProperties = {
  padding: "17px 26px",
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 12,
  borderTop: "1px solid rgba(255,255,255,0.10)",
  background: "#09090b",
};

const cancelButtonStyle: CSSProperties = {
  minHeight: 48,
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 11,
  background: "transparent",
  color: "#d4d4d8",
  fontFamily: "Montserrat, sans-serif",
  fontSize: 11,
  fontWeight: 800,
  cursor: "pointer",
};

const saveButtonStyle: CSSProperties = {
  minHeight: 48,
  border: "none",
  borderRadius: 11,
  background: "#16a34a",
  color: "#ffffff",
  fontFamily: "Montserrat, sans-serif",
  fontSize: 11,
  fontWeight: 800,
};
