// Persistance locale (localStorage) de la journée en cours et des modèles
// réutilisables (repas / plats enregistrés).
//
// Ce module ne contient que des fonctions PURES de (dé)sérialisation, testables
// sans DOM : le composant s'occupe des lectures/écritures localStorage, ici on
// se contente de convertir vers/depuis des chaînes JSON en validant la forme.
//
// Les types d'édition (id numérique pour les clés React) vivent ici afin d'être
// partagés entre le composant et la couche de persistance.

// --- Types d'édition (journée en cours) ---
export interface EIngredient { id: number; foodId: string; grams: number }
export interface EDish { id: number; name: string; ingredients: EIngredient[] }
export interface EMeal { id: number; name: string; dishes: EDish[] }

// --- Modèles enregistrés : même structure, sans les ids d'édition (regénérés
// à l'insertion pour éviter toute collision de clés React). ---
export interface SavedIngredient { foodId: string; grams: number }
export interface SavedDish { name: string; ingredients: SavedIngredient[] }
export interface SavedMeal { name: string; dishes: SavedDish[] }

// Clés localStorage (préfixe applicatif commun).
export const DAY_KEY = "nutricalc:day";
export const SAVED_MEALS_KEY = "nutricalc:savedMeals";
export const SAVED_DISHES_KEY = "nutricalc:savedDishes";

// --- Garde-fous de validation ---
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === "string";

// Retire les entrées invalides d'un tableau parsé (parseurs → null si malformé).
function compact<T>(items: unknown[], parse: (v: unknown) => T | null): T[] {
  return items.map(parse).filter((x): x is T => x !== null);
}

// --- Parseurs « journée » (les ids sont requis) ---
function parseEIngredient(v: unknown): EIngredient | null {
  if (!isRecord(v) || !isNum(v.id) || !isStr(v.foodId) || !isNum(v.grams)) return null;
  return { id: v.id, foodId: v.foodId, grams: v.grams };
}
function parseEDish(v: unknown): EDish | null {
  if (!isRecord(v) || !isNum(v.id) || !isStr(v.name) || !Array.isArray(v.ingredients)) return null;
  return { id: v.id, name: v.name, ingredients: compact(v.ingredients, parseEIngredient) };
}
function parseEMeal(v: unknown): EMeal | null {
  if (!isRecord(v) || !isNum(v.id) || !isStr(v.name) || !Array.isArray(v.dishes)) return null;
  return { id: v.id, name: v.name, dishes: compact(v.dishes, parseEDish) };
}

// --- Parseurs « modèles » (sans ids) ---
function parseSavedIngredient(v: unknown): SavedIngredient | null {
  if (!isRecord(v) || !isStr(v.foodId) || !isNum(v.grams)) return null;
  return { foodId: v.foodId, grams: v.grams };
}
function parseSavedDish(v: unknown): SavedDish | null {
  if (!isRecord(v) || !isStr(v.name) || !Array.isArray(v.ingredients)) return null;
  return { name: v.name, ingredients: compact(v.ingredients, parseSavedIngredient) };
}
function parseSavedMeal(v: unknown): SavedMeal | null {
  if (!isRecord(v) || !isStr(v.name) || !Array.isArray(v.dishes)) return null;
  return { name: v.name, dishes: compact(v.dishes, parseSavedDish) };
}

// Parse générique d'un tableau JSON : `[]` si absent, JSON invalide ou forme
// inattendue (les entrées malformées sont simplement ignorées).
function parseArray<T>(raw: string | null, parse: (v: unknown) => T | null): T[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return compact(data, parse);
  } catch {
    return [];
  }
}

// --- Journée en cours ---
export function serializeDay(meals: EMeal[]): string {
  return JSON.stringify(meals);
}
export function deserializeDay(raw: string | null): EMeal[] {
  return parseArray(raw, parseEMeal);
}

// Prochain id libre = max des ids restaurés + 1 (≥ 1), pour ne jamais réutiliser
// une clé React déjà présente dans la journée restaurée.
export function nextIdFrom(meals: EMeal[]): number {
  let max = 0;
  for (const m of meals) {
    max = Math.max(max, m.id);
    for (const d of m.dishes) {
      max = Math.max(max, d.id);
      for (const i of d.ingredients) max = Math.max(max, i.id);
    }
  }
  return max + 1;
}

// --- Modèles enregistrés ---
export function serializeSaved(items: SavedMeal[] | SavedDish[]): string {
  return JSON.stringify(items);
}
export function deserializeSavedMeals(raw: string | null): SavedMeal[] {
  return parseArray(raw, parseSavedMeal);
}
export function deserializeSavedDishes(raw: string | null): SavedDish[] {
  return parseArray(raw, parseSavedDish);
}

// --- Conversions édition ↔ modèle ---
export function toSavedDish(d: EDish): SavedDish {
  return { name: d.name, ingredients: d.ingredients.map((i) => ({ foodId: i.foodId, grams: i.grams })) };
}
export function toSavedMeal(m: EMeal): SavedMeal {
  return { name: m.name, dishes: m.dishes.map(toSavedDish) };
}

// Insertion d'un modèle : régénère des ids frais via l'allocateur fourni.
export function fromSavedDish(t: SavedDish, id: () => number): EDish {
  return {
    id: id(),
    name: t.name,
    ingredients: t.ingredients.map((i) => ({ id: id(), foodId: i.foodId, grams: i.grams })),
  };
}
export function fromSavedMeal(t: SavedMeal, id: () => number): EMeal {
  return { id: id(), name: t.name, dishes: t.dishes.map((d) => fromSavedDish(d, id)) };
}
