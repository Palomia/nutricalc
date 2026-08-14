// Accès à la base d'aliments UNIQUE `data/foods.fr.json` (tâche #14).
//
// Chargement PARESSEUX : la base (7 793 aliments, ~4,5 Mo) n'est JAMAIS dans le
// bundle principal. Elle est importée dynamiquement (`import()`) → Vite en fait
// un chunk asynchrone séparé, téléchargé au PREMIER usage (première recherche
// d'ingrédient). Le résultat est mémoïsé : un seul chargement par session.
//
// Ce module expose :
//   - `loadFoodsFr()` : charge + convertit + indexe (mémoïsé) ;
//   - `searchFoodsFr()` : recherche par sous-chaîne (insensible casse/accents),
//     bornée, respectant un filtre de régime TOLÉRANT ;
//   - `normalize()` / `matchesDiet()` : utilitaires purs (testables sans réseau).
import type { AminoAcidProfile, Food, FoodCategory } from "./food";

// Forme brute d'une entrée de foods.fr.json (cf. data/README.md §foods.fr.json).
interface RawFrFood {
  id: string;
  fdc_id: number;
  name: string;
  name_en: string;
  category: string;
  category_usda: string;
  kcalPer100g: number;
  proteinPer100g: number;
  lipidPer100g: number;
  carbPer100g: number;
  aaProfile?: AminoAcidProfile;
  vegetarian: boolean;
  vegan: boolean;
  unprocessed: boolean;
  flags?: string[];
}
interface RawFrDb {
  foods: RawFrFood[];
}

// Conversion entrée brute → `Food` de l'app (profil d'AAE inline conservé tel
// quel ; `diet_uncertain` remonté en booléen dédié).
function toFood(r: RawFrFood): Food {
  return {
    id: r.id,
    name: r.name,
    category: r.category as FoodCategory,
    kcalPer100g: r.kcalPer100g,
    proteinPer100g: r.proteinPer100g,
    lipidPer100g: r.lipidPer100g,
    carbPer100g: r.carbPer100g,
    aaProfile: r.aaProfile,
    vegetarian: r.vegetarian,
    vegan: r.vegan,
    unprocessed: r.unprocessed,
    nameEn: r.name_en,
    fdcId: r.fdc_id,
    dietUncertain: Array.isArray(r.flags) && r.flags.includes("diet_uncertain"),
  };
}

export interface FoodsFrIndex {
  all: Food[];
  byId: Map<string, Food>;
}

// Cache mémoïsé (une fois chargé) + promesse en vol (évite les chargements
// concurrents si plusieurs recherches partent avant la fin du premier fetch).
let cache: FoodsFrIndex | null = null;
let inflight: Promise<FoodsFrIndex> | null = null;

export function loadFoodsFr(): Promise<FoodsFrIndex> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = import("../../data/foods.fr.json")
      .then((mod) => {
        const db = ((mod as { default?: unknown }).default ?? mod) as RawFrDb;
        const all = (db.foods ?? []).map(toFood);
        const byId = new Map(all.map((f) => [f.id, f]));
        cache = { all, byId };
        return cache;
      })
      .catch((err) => {
        // On réarme la possibilité de recharger en cas d'échec réseau.
        inflight = null;
        throw err;
      });
  }
  return inflight;
}

// Renvoie l'index déjà chargé s'il l'est, sinon `null` (accès synchrone
// opportuniste, sans déclencher de chargement).
export function loadedFoodsFr(): FoodsFrIndex | null {
  return cache;
}

// Normalisation pour la recherche : minuscules + suppression des accents
// (décomposition NFD puis retrait des diacritiques). Pure.
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export interface DietFilter {
  vegetarian?: boolean;
  vegan?: boolean;
  unprocessed?: boolean;
}

// Filtre de régime TOLÉRANT pour la recherche : un aliment au régime INCERTAIN
// (`dietUncertain`, déduit d'une catégorie hétérogène) n'est PAS masqué par les
// filtres végétarien/vegan — l'UI le signale plutôt « régime incertain ». Le
// critère « non transformé » reste strict (drapeau best-effort, pas un régime).
export function matchesDiet(f: Food, filter: DietFilter): boolean {
  const uncertain = f.dietUncertain === true;
  if (filter.vegan && !f.vegan && !uncertain) return false;
  if (filter.vegetarian && !f.vegetarian && !uncertain) return false;
  if (filter.unprocessed && !f.unprocessed) return false;
  return true;
}

// Score de pertinence d'un résultat de recherche (plus grand = mieux classé) :
// un nom qui COMMENCE par la requête prime, puis les noms courts (moins de
// bruit), enfin l'ordre alphabétique implicite (stable).
function relevance(normalizedName: string, q: string): number {
  if (normalizedName === q) return 1000;
  if (normalizedName.startsWith(q)) return 500 - Math.min(normalizedName.length, 200);
  return 100 - Math.min(normalizedName.length, 200) / 10;
}

export const SEARCH_LIMIT = 40;

// Recherche par saisie sur les 7 793 aliments FR. Tous les MOTS de la requête
// doivent apparaître (sous-chaîne, insensible casse/accents). Résultats bornés
// à `limit`. Requête vide → premiers aliments du pool filtré (aperçu).
export async function searchFoodsFr(
  query: string,
  filter: DietFilter = {},
  limit = SEARCH_LIMIT,
): Promise<Food[]> {
  const { all } = await loadFoodsFr();
  const pool = all.filter((f) => matchesDiet(f, filter));
  const q = normalize(query.trim());
  if (!q) return pool.slice(0, limit);
  const words = q.split(/\s+/);
  const hits: { food: Food; score: number }[] = [];
  for (const f of pool) {
    const n = normalize(f.name);
    if (words.every((w) => n.includes(w))) {
      hits.push({ food: f, score: relevance(n, q) });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit).map((h) => h.food);
}
