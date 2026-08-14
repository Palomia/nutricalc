// Type `Food` et utilitaires de régime — SANS base d'aliments en dur.
//
// Depuis le câblage de la base unique (tâche #14), l'app ne porte plus de liste
// d'aliments curatée : la SEULE source d'aliments est `data/foods.fr.json`
// (7 793 entrées USDA SR Legacy traduites), chargée PARESSEUSEMENT via
// `foodsFr.ts`. Ce module ne conserve donc que :
//   - le type `Food` (macros pour 100 g + profil d'AAE INLINE + drapeaux régime) ;
//   - le filtre pur `filterFoods` ;
//   - la liste des catégories FR ;
//   - des profils d'AAE de référence (`AMINO_ACID_PROFILES`), utiles à la
//     construction de fixtures de test et à la documentation (plus utilisés par
//     l'app, qui lit le profil précalculé de chaque aliment FR).
//
// Le petit ensemble d'aliments réels utilisé comme cibles de presets vit dans
// `presetFoods.ts` (aliments EXTRAITS de foods.fr.json, pas une seconde source).

import type { AminoAcidKey } from "./macros";

// Catégories FR de l'app. « Autres » est le repli hors des 5 catégories
// principales (plats composés, boissons, sauces…) présent dans foods.fr.json.
export type FoodCategory =
  | "Féculents & pains"
  | "Viandes, poissons, œufs"
  | "Produits laitiers"
  | "Fruits & légumes"
  | "Matières grasses & oléagineux"
  | "Autres";

// Profil en acides aminés indispensables, exprimé en mg par g de protéine.
// `foods.fr.json` fournit ce profil PRÉCALCULÉ par aliment (9 clés, groupes
// combinés déjà agrégés : sulfur = Met+Cys, aromatic = Phe+Tyr). L'apport en AAE
// se dérive alors : profil × grammes de protéines (cf. aminoAcids.ts).
export type AminoAcidProfile = Record<AminoAcidKey, number>;

// Profils de référence (mg d'AAE par g de protéine). Valeurs INDICATIVES issues
// des schémas d'acides aminés FAO/WHO et de compositions alimentaires usuelles,
// arrondies. Ne sont PLUS utilisés par l'app (chaque aliment FR porte son propre
// profil précalculé) ; conservés comme repères et pour bâtir des fixtures de
// test synthétiques lisibles.
export const AMINO_ACID_PROFILES = {
  egg:    { histidine: 24, isoleucine: 54, leucine: 86, lysine: 70, sulfur: 57, aromatic: 98, threonine: 47, tryptophan: 17, valine: 66 },
  dairy:  { histidine: 27, isoleucine: 47, leucine: 95, lysine: 78, sulfur: 33, aromatic: 102, threonine: 44, tryptophan: 14, valine: 64 },
  whey:   { histidine: 18, isoleucine: 65, leucine: 105, lysine: 95, sulfur: 43, aromatic: 55, threonine: 68, tryptophan: 20, valine: 58 },
  meat:   { histidine: 34, isoleucine: 48, leucine: 80, lysine: 89, sulfur: 40, aromatic: 80, threonine: 46, tryptophan: 12, valine: 50 },
  fish:   { histidine: 29, isoleucine: 48, leucine: 80, lysine: 92, sulfur: 43, aromatic: 78, threonine: 47, tryptophan: 11, valine: 53 },
  soy:    { histidine: 26, isoleucine: 49, leucine: 82, lysine: 63, sulfur: 26, aromatic: 90, threonine: 39, tryptophan: 13, valine: 50 },
  legume: { histidine: 28, isoleucine: 43, leucine: 77, lysine: 70, sulfur: 22, aromatic: 82, threonine: 37, tryptophan: 10, valine: 48 },
  cereal: { histidine: 22, isoleucine: 38, leucine: 70, lysine: 27, sulfur: 41, aromatic: 82, threonine: 30, tryptophan: 12, valine: 46 },
  nuts:   { histidine: 26, isoleucine: 40, leucine: 70, lysine: 30, sulfur: 25, aromatic: 78, threonine: 32, tryptophan: 10, valine: 45 },
} as const satisfies Record<string, AminoAcidProfile>;

export type AminoAcidProfileKey = keyof typeof AMINO_ACID_PROFILES;

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  // Pour 100 g de partie comestible.
  kcalPer100g: number;
  proteinPer100g: number;
  lipidPer100g: number;
  carbPer100g: number;
  // Profil d'AAE INLINE (mg / g de protéine), précalculé côté base FR. Optionnel :
  // absent pour les aliments dont le profil d'acides aminés n'est pas fourni
  // (protéines négligeables ou couverture d'AA incomplète) → aucun AAE dérivé.
  aaProfile?: AminoAcidProfile;
  // --- Attributs de régime alimentaire ---
  // Végétarien : aucune chair animale (ni viande, ni poisson, ni fruits de mer).
  // Œufs et produits laitiers restent autorisés.
  vegetarian: boolean;
  // Vegan : aucun produit d'origine animale. Par cohérence : vegan ⇒ vegetarian.
  vegan: boolean;
  // Non transformé : aliment brut ou peu transformé (esprit NOVA groupe 1).
  unprocessed: boolean;
  // --- Traçabilité / heuristique (optionnels, portés par les aliments FR) ---
  // Libellé anglais d'origine (USDA), utile en secours à l'affichage.
  nameEn?: string;
  // Identifiant FoodData Central (traçabilité).
  fdcId?: number;
  // Régime déduit d'une catégorie hétérogène (valeur « au mieux ») : à ne pas
  // masquer abusivement lors du filtrage (cf. foodsFr.matchesDiet).
  dietUncertain?: boolean;
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  "Féculents & pains",
  "Viandes, poissons, œufs",
  "Produits laitiers",
  "Fruits & légumes",
  "Matières grasses & oléagineux",
  "Autres",
];

// Critères de filtrage par régime. Chaque champ est optionnel : à `true` on
// n'exige que les aliments qui satisfont le critère ; absent (ou `false`) le
// critère n'est pas appliqué.
export interface FoodFilter {
  vegetarian?: boolean;
  vegan?: boolean;
  unprocessed?: boolean;
}

// Filtre pur STRICT : renvoie les aliments qui satisfont TOUS les critères
// actifs (ET logique). Un critère à `false`/absent est ignoré. Ne mute pas
// l'entrée. Utilisé par le moteur de suggestions. Pour la recherche à la
// saisie, un filtre PLUS TOLÉRANT (qui n'écarte pas les régimes « incertains »)
// est appliqué par `foodsFr.matchesDiet`.
export function filterFoods(foods: Food[], filter: FoodFilter): Food[] {
  return foods.filter(
    (f) =>
      (!filter.vegetarian || f.vegetarian) &&
      (!filter.vegan || f.vegan) &&
      (!filter.unprocessed || f.unprocessed),
  );
}
