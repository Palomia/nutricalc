// Combos d'ajout rapide au niveau d'un plat : matières grasses de cuisson
// (tâche #10) et vinaigrette (tâche #11).
//
// Logique PURE et testable : chaque combo se résout en une liste d'ingrédients
// {foodId, grams}. Le MealPlanner injecte ensuite ces ingrédients via son
// mécanisme d'ajout habituel (ids frais, persistance automatique). Les `foodId`
// référencent des aliments présents dans `FOODS_BY_ID` (cf. food.ts).

// Un ingrédient de combo, avant attribution d'un id d'édition par le composant.
export interface ComboIngredient {
  foodId: string;
  grams: number;
}

// Modes de cuisson proposés. « À sec » n'ajoute aucune matière grasse.
export type CookingMethod = "beurre" | "huile-olive" | "sec";

// Libellés affichés dans le menu « Cuisson » (ordre d'affichage inclus).
export const COOKING_METHODS: { method: CookingMethod; label: string }[] = [
  { method: "beurre", label: "Beurre" },
  { method: "huile-olive", label: "Huile d'olive" },
  { method: "sec", label: "À sec" },
];

// Quantité par défaut réaliste d'une matière grasse de cuisson (en grammes).
export const COOKING_FAT_GRAMS = 10;

// Ingrédients ajoutés pour une cuisson donnée. « À sec » = aucun ingrédient.
export function cookingIngredients(method: CookingMethod): ComboIngredient[] {
  switch (method) {
    case "beurre":
      return [{ foodId: "beurre", grams: COOKING_FAT_GRAMS }];
    case "huile-olive":
      return [{ foodId: "huile-olive", grams: COOKING_FAT_GRAMS }];
    case "sec":
      return [];
  }
}

// Vinaigrette préréglée : huile d'olive + vinaigre + moutarde.
export const VINAIGRETTE: ComboIngredient[] = [
  { foodId: "huile-olive", grams: 10 },
  { foodId: "vinaigre", grams: 5 },
  { foodId: "moutarde", grams: 5 },
];
