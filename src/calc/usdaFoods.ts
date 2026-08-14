// Couche d'intégration de la base USDA SR Legacy (tâche #14).
//
// Convertit une entrée brute de `data/foods.sr_legacy.json` (valeurs pour 100 g,
// noms EN, cf. `data/README.md`) en un objet `Food` compatible avec le reste de
// l'app, PUIS charge paresseusement la base complète (~3 Mo) et mémorise les
// aliments effectivement sélectionnés pour que l'agrégation (`toDay`) les
// retrouve — y compris après rechargement.
//
// LIMITES CONNUES (MVP, documentées volontairement) :
//  - NOMS EN ANGLAIS : les libellés USDA sont en anglais. Le mapping vers des
//    libellés français (p. ex. via CIQUAL) est hors périmètre de ce MVP.
//  - RÉGIME HEURISTIQUE : l'USDA ne publie pas d'attribut de régime. On les
//    infère de façon best-effort À PARTIR DE LA CATÉGORIE USDA (viandes/poissons
//    ⇒ non végétarien ; œufs & laitages ⇒ végétarien non vegan ; végétaux nets
//    ⇒ vegan). Quand c'est incertain (boissons, plats préparés, matières grasses
//    animales possibles…), on NE PRÉTEND PAS : `vegetarian`/`vegan` restent à
//    `false` et `unprocessed` est toujours `false` (aucune revendication « brut »
//    sur cette base). Pour ne pas masquer abusivement, la recherche USDA de l'UI
//    N'APPLIQUE PAS les filtres de régime (contrairement au sélecteur curaté) :
//    tous les aliments correspondant au nom saisi restent proposés.
//  - MAPPING CATÉGORIES : correspondance best-effort des 25 catégories USDA vers
//    les 5 catégories FR, avec repli sur « Autres » (cf. `CATEGORY_MAP`).
//  - PROFIL D'AAE : seuls les aliments au profil d'acides aminés COMPLET (les 11
//    champs) et à protéines > 0 reçoivent un `aaProfileValues`. Un profil partiel
//    est ignoré (pas de profil) pour ne pas fabriquer un faux acide aminé
//    limitant à 0 % dans le moteur anabolique.
import type { AminoAcidProfile, Food, FoodCategory } from "./food";

// --- Forme brute d'une entrée USDA (sous-ensemble exploité) ---
// Un champ ABSENT signifie « valeur non fournie par l'USDA » (≠ 0), d'où les
// champs optionnels. `fiber_g`/`sugars_g` ne sont pas utilisés par l'app.
export interface UsdaRawFood {
  fdc_id: number;
  name: string;
  category: string;
  kcal?: number;
  protein_g?: number;
  fat_g?: number;
  carb_g?: number;
  fiber_g?: number;
  sugars_g?: number;
  histidine_g?: number;
  isoleucine_g?: number;
  leucine_g?: number;
  lysine_g?: number;
  methionine_g?: number;
  cystine_g?: number;
  phenylalanine_g?: number;
  tyrosine_g?: number;
  threonine_g?: number;
  tryptophan_g?: number;
  valine_g?: number;
}

// Préfixe d'id des aliments USDA : garantit qu'ils ne collisionnent jamais avec
// les ids curatés de `FOODS_BY_ID`, et sert à les reconnaître dans l'UI.
export const USDA_ID_PREFIX = "usda-";
export const isUsdaId = (id: string): boolean => id.startsWith(USDA_ID_PREFIX);

// --- Mapping best-effort catégorie USDA → catégorie FR ---
// Toute catégorie absente de cette table retombe sur « Autres ».
const CATEGORY_MAP: Record<string, FoodCategory> = {
  "Beef Products": "Viandes, poissons, œufs",
  "Poultry Products": "Viandes, poissons, œufs",
  "Pork Products": "Viandes, poissons, œufs",
  "Lamb, Veal, and Game Products": "Viandes, poissons, œufs",
  "Finfish and Shellfish Products": "Viandes, poissons, œufs",
  "Sausages and Luncheon Meats": "Viandes, poissons, œufs",
  "Dairy and Egg Products": "Produits laitiers",
  "Vegetables and Vegetable Products": "Fruits & légumes",
  "Fruits and Fruit Juices": "Fruits & légumes",
  "Legumes and Legume Products": "Féculents & pains",
  "Cereal Grains and Pasta": "Féculents & pains",
  "Baked Products": "Féculents & pains",
  "Breakfast Cereals": "Féculents & pains",
  "Fats and Oils": "Matières grasses & oléagineux",
  "Nut and Seed Products": "Matières grasses & oléagineux",
};

export function mapCategory(usdaCategory: string): FoodCategory {
  return CATEGORY_MAP[usdaCategory] ?? "Autres";
}

// --- Heuristique de régime, par catégorie USDA (best-effort) ---
// Chairs animales : ni végétarien ni vegan.
const NON_VEGETARIAN = new Set<string>([
  "Beef Products",
  "Poultry Products",
  "Pork Products",
  "Lamb, Veal, and Game Products",
  "Finfish and Shellfish Products",
  "Sausages and Luncheon Meats",
]);
// Végétaux nets : vegan (donc végétarien). Les matières grasses (beurre, saindoux,
// suif possibles) et les produits transformés composites sont volontairement
// EXCLUS de cette liste — laissés « incertains » plutôt que revendiqués vegan.
const PLANT = new Set<string>([
  "Vegetables and Vegetable Products",
  "Fruits and Fruit Juices",
  "Legumes and Legume Products",
  "Cereal Grains and Pasta",
  "Nut and Seed Products",
  "Spices and Herbs",
]);

interface Diet {
  vegetarian: boolean;
  vegan: boolean;
  unprocessed: boolean;
}

// unprocessed : toujours `false` sur la base USDA (aucune revendication « brut »
// fiable à l'échelle de la base pour ce MVP, cf. LIMITES).
export function dietFromCategory(usdaCategory: string): Diet {
  if (NON_VEGETARIAN.has(usdaCategory)) return { vegetarian: false, vegan: false, unprocessed: false };
  if (usdaCategory === "Dairy and Egg Products") return { vegetarian: true, vegan: false, unprocessed: false };
  if (PLANT.has(usdaCategory)) return { vegetarian: true, vegan: true, unprocessed: false };
  // Incertain : on ne prétend pas (ni végétarien, ni vegan).
  return { vegetarian: false, vegan: false, unprocessed: false };
}

// Champs d'AA requis pour un profil COMPLET (les 11 grammes mesurés).
const AA_FIELDS: (keyof UsdaRawFood)[] = [
  "histidine_g",
  "isoleucine_g",
  "leucine_g",
  "lysine_g",
  "methionine_g",
  "cystine_g",
  "phenylalanine_g",
  "tyrosine_g",
  "threonine_g",
  "tryptophan_g",
  "valine_g",
];

// Profil d'AAE INLINE (mg d'AAE par g de protéine), calculé depuis les grammes
// mesurés : `aa_g_pour_100g / protein_g_pour_100g × 1000`. Groupes combinés :
// sulfur = Met+Cys, aromatic = Phe+Tyr. Renvoie `undefined` si le profil est
// incomplet ou si les protéines sont nulles (pas de profil, comme un aliment
// à protéines négligeables).
export function usdaAminoAcidProfile(r: UsdaRawFood): AminoAcidProfile | undefined {
  const protein = r.protein_g ?? 0;
  if (protein <= 0) return undefined;
  if (AA_FIELDS.some((f) => r[f] === undefined)) return undefined;
  const perG = (g: number) => (g / protein) * 1000;
  return {
    histidine: perG(r.histidine_g!),
    isoleucine: perG(r.isoleucine_g!),
    leucine: perG(r.leucine_g!),
    lysine: perG(r.lysine_g!),
    sulfur: perG(r.methionine_g! + r.cystine_g!),
    aromatic: perG(r.phenylalanine_g! + r.tyrosine_g!),
    threonine: perG(r.threonine_g!),
    tryptophan: perG(r.tryptophan_g!),
    valine: perG(r.valine_g!),
  };
}

// Convertit une entrée USDA brute en `Food`.
//
// Repli macros (esprit T1) : une macro absente vaut 0 (l'USDA ne l'a pas
// fournie — signalé par ce commentaire, pas revendiqué comme mesuré) ; si `kcal`
// est absent, l'énergie est RECALCULÉE en 4/9/4 depuis les macros disponibles.
export function normalizeUsdaFood(r: UsdaRawFood): Food {
  const protein = r.protein_g ?? 0;
  const fat = r.fat_g ?? 0;
  const carb = r.carb_g ?? 0;
  const kcal = r.kcal ?? protein * 4 + fat * 9 + carb * 4;
  const aaProfileValues = usdaAminoAcidProfile(r);
  const diet = dietFromCategory(r.category);
  return {
    id: USDA_ID_PREFIX + r.fdc_id,
    name: r.name,
    category: mapCategory(r.category),
    kcalPer100g: kcal,
    proteinPer100g: protein,
    lipidPer100g: fat,
    carbPer100g: carb,
    ...(aaProfileValues ? { aaProfileValues } : {}),
    vegetarian: diet.vegetarian,
    vegan: diet.vegan,
    unprocessed: diet.unprocessed,
  };
}

// --- Chargement PARESSEUX de la base complète ---
// Le JSON (~3 Mo) est importé DYNAMIQUEMENT → chunk séparé, hors du bundle
// principal. Le résultat normalisé est mémorisé (une seule conversion).
let allFoodsPromise: Promise<Food[]> | null = null;

export function loadUsdaFoods(): Promise<Food[]> {
  if (!allFoodsPromise) {
    allFoodsPromise = import("../../data/foods.sr_legacy.json").then((mod) => {
      const raw = mod.default.foods as UsdaRawFood[];
      return raw.map(normalizeUsdaFood);
    });
  }
  return allFoodsPromise;
}

// Recherche par nom (insensible à la casse), résultats limités. Pensée pour une
// combobox : ne charge PAS le JSON elle-même (l'appelant fournit la liste déjà
// chargée via `loadUsdaFoods`).
export function searchUsdaFoods(foods: Food[], query: string, limit = 30): Food[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: Food[] = [];
  for (const f of foods) {
    if (f.name.toLowerCase().includes(q)) {
      out.push(f);
      if (out.length >= limit) break;
    }
  }
  return out;
}

// --- Registre des aliments USDA sélectionnés ---
// Les aliments USDA ne sont pas dans `FOODS_BY_ID`. On mémorise chaque aliment
// choisi (snapshot normalisé) pour que la résolution `foodId → Food` fonctionne
// à l'agrégation, SANS recharger les 3 Mo. Le registre est persisté en
// localStorage afin que les aliments USDA d'une journée sauvegardée soient
// retrouvés après rechargement.
const USDA_SELECTED_KEY = "nutricalc:usdaSelected";
const registry = new Map<string, Food>();
let hydrated = false;

function readRaw(): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(USDA_SELECTED_KEY);
  } catch {
    return null;
  }
}
function writeRaw(value: string): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(USDA_SELECTED_KEY, value);
  } catch {
    // quota / stockage indisponible : on ignore (le registre mémoire suffit à la session).
  }
}

// Hydrate le registre depuis localStorage (tolérant : JSON invalide → ignoré).
// Ne valide que la forme minimale nécessaire à la résolution + à l'agrégation.
function hydrate(): void {
  hydrated = true;
  const raw = readRaw();
  if (!raw) return;
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return;
    for (const v of data) {
      if (
        v &&
        typeof v === "object" &&
        typeof (v as Food).id === "string" &&
        typeof (v as Food).name === "string" &&
        typeof (v as Food).kcalPer100g === "number"
      ) {
        registry.set((v as Food).id, v as Food);
      }
    }
  } catch {
    // ignoré
  }
}

export function getUsdaFood(id: string): Food | undefined {
  if (!hydrated) hydrate();
  return registry.get(id);
}

export function registerUsdaFood(food: Food): void {
  if (!hydrated) hydrate();
  registry.set(food.id, food);
  writeRaw(JSON.stringify([...registry.values()]));
}
