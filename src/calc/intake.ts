// Apport réel saisi : journée → repas → plats → ingrédients.
//
// Un ingrédient référence un aliment (macros pour 100 g, cf. `food.ts`) et une
// quantité en grammes. Les macros réelles se dérivent par simple règle de trois.
// Rien n'est persisté (comme le reste de l'app) : la journée vit en mémoire.
import { KCAL_PER_G } from "./macros";
import type { Food } from "./food";

export interface Ingredient {
  food: Food;
  grams: number;
}

export interface Dish {
  name: string;
  ingredients: Ingredient[];
}

export interface Meal {
  name: string;
  dishes: Dish[];
}

export interface Day {
  meals: Meal[];
}

// Macros agrégées d'un ensemble d'aliments (grammes de macro + énergie).
export interface MacroIntake {
  proteinG: number;
  lipidG: number;
  carbG: number;
  kcal: number;
}

const EMPTY: MacroIntake = { proteinG: 0, lipidG: 0, carbG: 0, kcal: 0 };

function add(a: MacroIntake, b: MacroIntake): MacroIntake {
  return {
    proteinG: a.proteinG + b.proteinG,
    lipidG: a.lipidG + b.lipidG,
    carbG: a.carbG + b.carbG,
    kcal: a.kcal + b.kcal,
  };
}

function sum(items: MacroIntake[]): MacroIntake {
  return items.reduce(add, EMPTY);
}

// Macros d'un ingrédient : règle de trois sur la quantité, à partir des valeurs
// pour 100 g. L'énergie suit celle de l'aliment (CIQUAL) plutôt qu'un recalcul
// depuis les macros, pour rester fidèle à la source.
export function ingredientMacros(i: Ingredient): MacroIntake {
  const factor = i.grams / 100;
  return {
    proteinG: i.food.proteinPer100g * factor,
    lipidG: i.food.lipidPer100g * factor,
    carbG: i.food.carbPer100g * factor,
    kcal: i.food.kcalPer100g * factor,
  };
}

export function dishMacros(d: Dish): MacroIntake {
  return sum(d.ingredients.map(ingredientMacros));
}

export function mealMacros(m: Meal): MacroIntake {
  return sum(m.dishes.map(dishMacros));
}

export function dayMacros(day: Day): MacroIntake {
  return sum(day.meals.map(mealMacros));
}

// Énergie recalculée depuis les macros (contrôle de cohérence avec `kcal`).
export function kcalFromMacros(m: MacroIntake): number {
  return (
    m.proteinG * KCAL_PER_G.protein +
    m.lipidG * KCAL_PER_G.lipid +
    m.carbG * KCAL_PER_G.carb
  );
}
