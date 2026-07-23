type MealRow = {
  meal_text: string;
  meal_type: string | null;
  protein_level: string | null;
  quality_level: string | null;
  ai_notes: string | null;
};

export function classifyMeal(mealText: string) {
  const text = mealText.toLowerCase();

  let mealType = "refeição";

  if (
    text.includes("breakfast") ||
    text.includes("café") ||
    text.includes("cafe") ||
    text.includes("coffee") ||
    text.includes("bread") ||
    text.includes("pão") ||
    text.includes("ovo") ||
    text.includes("egg")
  ) {
    mealType = "café da manhã";
  } else if (
    text.includes("lunch") ||
    text.includes("almoço") ||
    text.includes("almoco") ||
    text.includes("rice") ||
    text.includes("arroz") ||
    text.includes("beans") ||
    text.includes("feijão") ||
    text.includes("feijao")
  ) {
    mealType = "almoço";
  } else if (
    text.includes("dinner") ||
    text.includes("jantar") ||
    text.includes("soup") ||
    text.includes("sopa")
  ) {
    mealType = "jantar";
  } else if (
    text.includes("snack") ||
    text.includes("lanche") ||
    text.includes("banana") ||
    text.includes("fruit") ||
    text.includes("fruta")
  ) {
    mealType = "lanche";
  }

  let proteinLevel = "baixa";

  if (
    text.includes("chicken") ||
    text.includes("frango") ||
    text.includes("egg") ||
    text.includes("ovo") ||
    text.includes("beef") ||
    text.includes("carne") ||
    text.includes("fish") ||
    text.includes("peixe") ||
    text.includes("turkey") ||
    text.includes("whey") ||
    text.includes("yogurt") ||
    text.includes("iogurte")
  ) {
    proteinLevel = "alta";
  } else if (
    text.includes("cheese") ||
    text.includes("queijo") ||
    text.includes("milk") ||
    text.includes("leite") ||
    text.includes("beans") ||
    text.includes("feijão") ||
    text.includes("feijao")
  ) {
    proteinLevel = "média";
  }

  let qualityLevel = "ok";

  if (
    text.includes("pizza") ||
    text.includes("burger") ||
    text.includes("hamburger") ||
    text.includes("refrigerante") ||
    text.includes("soda") ||
    text.includes("fries") ||
    text.includes("frita") ||
    text.includes("cake") ||
    text.includes("bolo") ||
    text.includes("cookie") ||
    text.includes("doce")
  ) {
    qualityLevel = "baixa";
  } else if (
    text.includes("salad") ||
    text.includes("salada") ||
    text.includes("fruit") ||
    text.includes("fruta") ||
    text.includes("rice") ||
    text.includes("arroz") ||
    text.includes("beans") ||
    text.includes("feijão") ||
    text.includes("feijao") ||
    text.includes("vegetable") ||
    text.includes("legume")
  ) {
    qualityLevel = "boa";
  }

  let aiNotes = "Refeição equilibrada.";

  if (qualityLevel === "baixa") {
    aiNotes = "Qualidade nutricional baixa. Tente adicionar proteína e reduzir ultraprocessados.";
  } else if (qualityLevel === "boa" && proteinLevel === "alta") {
    aiNotes = "Boa escolha. Essa refeição tem bom suporte de proteína para recuperação.";
  } else if (proteinLevel === "baixa") {
    aiNotes = "Considere adicionar uma fonte de proteína mais forte para apoiar performance e recuperação.";
  }

  return {
    meal_type: mealType,
    protein_level: proteinLevel,
    quality_level: qualityLevel,
    ai_notes: aiNotes,
  };
}
