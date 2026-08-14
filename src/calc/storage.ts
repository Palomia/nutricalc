// Persistance locale (localStorage) de la journée en cours et des modèles
// réutilisables (repas / plats enregistrés).
//
// Ce module ne contient que des fonctions PURES de (dé)sérialisation, testables
// sans DOM : le composant s'occupe des lectures/écritures localStorage, ici on
// se contente de convertir vers/depuis des chaînes JSON en validant la forme.
//
// Les types d'édition (id numérique pour les clés React) vivent ici afin d'être
// partagés entre le composant et la couche de persistance.

import { isUnit, type Unit } from "./units";
import type { AminoAcidKey } from "./macros";
import type { AminoAcidProfile, Food, FoodCategory } from "./food";
import { FOOD_CATEGORIES } from "./food";

// --- Types d'édition (journée en cours) ---
// Un ingrédient porte une `quantity` dans une `unit` ménagère (cf. `units.ts`) ;
// la conversion en grammes (pour les calculs) se fait à l'agrégation.
export interface EIngredient { id: number; foodId: string; quantity: number; unit: Unit }
export interface EDish { id: number; name: string; ingredients: EIngredient[] }
export interface EMeal { id: number; name: string; dishes: EDish[] }

// --- Modèles enregistrés : même structure, sans les ids d'édition (regénérés
// à l'insertion pour éviter toute collision de clés React). ---
export interface SavedIngredient { foodId: string; quantity: number; unit: Unit }
export interface SavedDish { name: string; ingredients: SavedIngredient[] }
export interface SavedMeal { name: string; dishes: SavedDish[] }

// Clés localStorage (préfixe applicatif commun).
export const DAY_KEY = "nutricalc:day";
export const SAVED_MEALS_KEY = "nutricalc:savedMeals";
export const SAVED_DISHES_KEY = "nutricalc:savedDishes";
// Registre des aliments sélectionnés : chaque `foodId` référencé par la journée
// ou la bibliothèque doit y avoir sa fiche `Food` (macros + profil d'AAE), pour
// résoudre la journée SANS recharger les 4,5 Mo de foods.fr.json au démarrage.
export const FOOD_REGISTRY_KEY = "nutricalc:foodRegistry";

// --- Garde-fous de validation ---
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === "string";

// Retire les entrées invalides d'un tableau parsé (parseurs → null si malformé).
function compact<T>(items: unknown[], parse: (v: unknown) => T | null): T[] {
  return items.map(parse).filter((x): x is T => x !== null);
}

// Résout la quantité + l'unité d'un ingrédient, avec MIGRATION ascendante :
// - nouveau format : { quantity, unit } (unité connue) ;
// - format hérité : uniquement { grams } (données déjà en localStorage avant
//   l'introduction des unités) → converti en { quantity: grams, unit: "gramme" }.
// Renvoie null si aucune quantité exploitable n'est présente.
function parseQuantityUnit(v: Record<string, unknown>): { quantity: number; unit: Unit } | null {
  if (isNum(v.quantity) && isUnit(v.unit)) return { quantity: v.quantity, unit: v.unit };
  if (isNum(v.grams)) return { quantity: v.grams, unit: "gramme" };
  return null;
}

// --- Parseurs « journée » (les ids sont requis) ---
function parseEIngredient(v: unknown): EIngredient | null {
  if (!isRecord(v) || !isNum(v.id) || !isStr(v.foodId)) return null;
  const qu = parseQuantityUnit(v);
  if (!qu) return null;
  return { id: v.id, foodId: v.foodId, quantity: qu.quantity, unit: qu.unit };
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
  if (!isRecord(v) || !isStr(v.foodId)) return null;
  const qu = parseQuantityUnit(v);
  if (!qu) return null;
  return { foodId: v.foodId, quantity: qu.quantity, unit: qu.unit };
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
  return { name: d.name, ingredients: d.ingredients.map((i) => ({ foodId: i.foodId, quantity: i.quantity, unit: i.unit })) };
}
export function toSavedMeal(m: EMeal): SavedMeal {
  return { name: m.name, dishes: m.dishes.map(toSavedDish) };
}

// --- Registre des aliments sélectionnés (persistance des fiches `Food`) ---

// Les 9 clés du profil d'AAE (mg/g de protéine), pour valider `aaProfile`.
const AA_KEYS: AminoAcidKey[] = [
  "histidine", "isoleucine", "leucine", "lysine", "sulfur",
  "aromatic", "threonine", "tryptophan", "valine",
];

const isBool = (v: unknown): v is boolean => typeof v === "boolean";

// Valide un profil d'AAE : objet dont les 9 clés sont des nombres finis.
function parseAaProfile(v: unknown): AminoAcidProfile | undefined {
  if (!isRecord(v)) return undefined;
  const out = {} as AminoAcidProfile;
  for (const k of AA_KEYS) {
    if (!isNum(v[k])) return undefined;
    out[k] = v[k] as number;
  }
  return out;
}

// Parse une fiche `Food` persistée (garde-fous stricts : une entrée corrompue
// est écartée plutôt que de fausser un calcul). `aaProfile` reste optionnel.
export function parseFood(v: unknown): Food | null {
  if (!isRecord(v)) return null;
  if (!isStr(v.id) || !isStr(v.name) || !isStr(v.category)) return null;
  if (!FOOD_CATEGORIES.includes(v.category as FoodCategory)) return null;
  if (!isNum(v.kcalPer100g) || !isNum(v.proteinPer100g)) return null;
  if (!isNum(v.lipidPer100g) || !isNum(v.carbPer100g)) return null;
  if (!isBool(v.vegetarian) || !isBool(v.vegan) || !isBool(v.unprocessed)) return null;
  const food: Food = {
    id: v.id,
    name: v.name,
    category: v.category as FoodCategory,
    kcalPer100g: v.kcalPer100g,
    proteinPer100g: v.proteinPer100g,
    lipidPer100g: v.lipidPer100g,
    carbPer100g: v.carbPer100g,
    vegetarian: v.vegetarian,
    vegan: v.vegan,
    unprocessed: v.unprocessed,
  };
  const aa = parseAaProfile(v.aaProfile);
  if (aa) food.aaProfile = aa;
  if (isStr(v.nameEn)) food.nameEn = v.nameEn;
  if (isNum(v.fdcId)) food.fdcId = v.fdcId;
  if (isBool(v.dietUncertain)) food.dietUncertain = v.dietUncertain;
  return food;
}

// Sérialise le registre (tableau de fiches) — l'ordre n'a pas d'importance.
export function serializeRegistry(foods: Food[]): string {
  return JSON.stringify(foods);
}

// Restaure le registre : tableau de fiches `Food` valides (entrées corrompues
// ignorées). `[]` si absent / JSON invalide.
export function deserializeRegistry(raw: string | null): Food[] {
  return parseArray(raw, parseFood);
}

// Insertion d'un modèle : régénère des ids frais via l'allocateur fourni.
export function fromSavedDish(t: SavedDish, id: () => number): EDish {
  return {
    id: id(),
    name: t.name,
    ingredients: t.ingredients.map((i) => ({ id: id(), foodId: i.foodId, quantity: i.quantity, unit: i.unit })),
  };
}
export function fromSavedMeal(t: SavedMeal, id: () => number): EMeal {
  return { id: id(), name: t.name, dishes: t.dishes.map((d) => fromSavedDish(d, id)) };
}
