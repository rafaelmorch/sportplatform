// app/performance-ai/nutrition/history/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import BottomNavbar from "@/components/BottomNavbar";
import PerformanceAiBackButton from "@/components/performance-ai/PerformanceAiBackButton";
import PerformanceAiFloatingMenu from "@/components/performance-ai/PerformanceAiFloatingMenu";
import { supabaseBrowser } from "@/lib/supabase-browser";

type MealRow = {
  id: string;
  meal_text: string;
  eaten_at: string;
  meal_type: string | null;
  protein_level: string | null;
  quality_level: string | null;
  ai_notes: string | null;
};

function formatMealDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatMealTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function NutritionHistoryPage() {
  const router = useRouter();

  const supabase = useMemo(
    () => supabaseBrowser,
    []
  );

  const [loading, setLoading] =
    useState(true);

  const [meals, setMeals] =
    useState<MealRow[]>([]);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadHistory(): Promise<void> {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("performance_ai_meals")
        .select(
          "id, meal_text, eaten_at, meal_type, protein_level, quality_level, ai_notes"
        )
        .eq("user_id", user.id)
        .order("eaten_at", {
          ascending: false,
        });

      if (error) {
        setErrorMessage(
          "Não foi possível carregar seu histórico."
        );

        setLoading(false);
        return;
      }

      setMeals((data ?? []) as MealRow[]);
      setLoading(false);
    }

    void loadHistory();
  }, [router, supabase]);

  return (
    <>
      <main style={pageStyle}>
        <div style={glowStyle} />

        <div style={containerStyle}>
          <PerformanceAiBackButton href="/performance-ai/nutrition" />

          <header style={headerStyle}>
            <div style={eyebrowStyle}>
              Nutrição
            </div>

            <h1 style={titleStyle}>
              Histórico de refeições
            </h1>

            <p style={descriptionStyle}>
              Consulte todas as refeições registradas
              ao longo da sua jornada.
            </p>
          </header>

          <div style={summaryStyle}>
            <span style={summaryLabelStyle}>
              Refeições registradas
            </span>

            <span style={summaryValueStyle}>
              {meals.length}
            </span>
          </div>

          {loading ? (
            <div style={emptyStyle}>
              Carregando histórico...
            </div>
          ) : errorMessage ? (
            <div style={errorStyle}>
              {errorMessage}
            </div>
          ) : meals.length === 0 ? (
            <div style={emptyStyle}>
              Nenhuma refeição registrada ainda.
            </div>
          ) : (
            <section style={listStyle}>
              {meals.map((meal) => (
                <article
                  key={meal.id}
                  style={rowStyle}
                >
                  <div style={dateColumnStyle}>
                    <span style={dateStyle}>
                      {formatMealDate(
                        meal.eaten_at
                      )}
                    </span>

                    <span style={timeStyle}>
                      {formatMealTime(
                        meal.eaten_at
                      )}
                    </span>
                  </div>

                  <div style={mealContentStyle}>
                    <h2 style={mealTitleStyle}>
                      {meal.meal_text}
                    </h2>

                    {meal.ai_notes ? (
                      <p style={notesStyle}>
                        {meal.ai_notes}
                      </p>
                    ) : null}

                    {(meal.protein_level ||
                      meal.quality_level) && (
                      <div style={tagsStyle}>
                        {meal.protein_level ? (
                          <span style={tagStyle}>
                            Proteína{" "}
                            {meal.protein_level}
                          </span>
                        ) : null}

                        {meal.quality_level ? (
                          <span style={tagStyle}>
                            Qualidade{" "}
                            {meal.quality_level}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>

        <PerformanceAiFloatingMenu />
      </main>

      <BottomNavbar />
    </>
  );
}

const pageStyle: React.CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  overflowX: "hidden",
  background:
    "linear-gradient(180deg, #050505 0%, #080808 52%, #030303 100%)",
  color: "#ffffff",
  fontFamily: "Montserrat, sans-serif",
};

const glowStyle: React.CSSProperties = {
  position: "fixed",
  top: -180,
  left: "50%",
  width: 520,
  height: 420,
  borderRadius: "50%",
  background:
    "rgba(212,175,55,0.055)",
  filter: "blur(120px)",
  pointerEvents: "none",
  transform: "translateX(-50%)",
};

const containerStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(100%, 920px)",
  boxSizing: "border-box",
  margin: "0 auto",
  padding:
    "max(16px, env(safe-area-inset-top)) clamp(16px, 4vw, 32px) max(130px, env(safe-area-inset-bottom))",
};

const headerStyle: React.CSSProperties = {
  padding: "32px 0 28px",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#D4AF37",
  fontSize: 11,
  fontWeight: 650,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#ffffff",
  fontSize: "clamp(34px, 7vw, 52px)",
  fontWeight: 400,
  letterSpacing: "-0.045em",
  lineHeight: 1.05,
};

const descriptionStyle: React.CSSProperties = {
  maxWidth: 620,
  margin: "12px 0 0",
  color: "rgba(255,255,255,0.48)",
  fontSize: 13,
  lineHeight: 1.7,
};

const summaryStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
  padding: "18px 0",
  borderTop:
    "1px solid rgba(255,255,255,0.08)",
  borderBottom:
    "1px solid rgba(255,255,255,0.08)",
};

const summaryLabelStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.48)",
  fontSize: 12,
};

const summaryValueStyle: React.CSSProperties = {
  color: "#D4AF37",
  fontSize: 27,
  fontWeight: 400,
};

const listStyle: React.CSSProperties = {
  display: "grid",
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(92px, 130px) minmax(0, 1fr)",
  gap: "clamp(18px, 5vw, 42px)",
  padding: "25px 0",
  borderBottom:
    "1px solid rgba(255,255,255,0.075)",
};

const dateColumnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const dateStyle: React.CSSProperties = {
  color: "#D4AF37",
  fontSize: 11,
  fontWeight: 650,
  lineHeight: 1.5,
  textTransform: "capitalize",
};

const timeStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.4)",
  fontSize: 12,
};

const mealContentStyle: React.CSSProperties = {
  minWidth: 0,
};

const mealTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#ffffff",
  fontSize: 18,
  fontWeight: 400,
  lineHeight: 1.45,
};

const notesStyle: React.CSSProperties = {
  maxWidth: 680,
  margin: "8px 0 0",
  color: "rgba(255,255,255,0.46)",
  fontSize: 12,
  lineHeight: 1.65,
};

const tagsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 7,
  marginTop: 12,
};

const tagStyle: React.CSSProperties = {
  padding: "6px 9px",
  border:
    "1px solid rgba(212,175,55,0.2)",
  borderRadius: 999,
  background:
    "rgba(212,175,55,0.04)",
  color: "#D4AF37",
  fontSize: 10,
};

const emptyStyle: React.CSSProperties = {
  padding: "35px 0",
  color: "rgba(255,255,255,0.42)",
  fontSize: 13,
};

const errorStyle: React.CSSProperties = {
  marginTop: 20,
  padding: 16,
  border:
    "1px solid rgba(239,68,68,0.22)",
  borderRadius: 12,
  background:
    "rgba(239,68,68,0.07)",
  color: "#fecaca",
  fontSize: 13,
};