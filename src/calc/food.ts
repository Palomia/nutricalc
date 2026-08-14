// Base d'aliments de référence — macronutriments pour 100 g.
//
// Valeurs INDICATIVES tirées de la table CIQUAL de l'ANSES (composition
// nutritionnelle des aliments, données publiques ANSES/Etalab, millésime 2017
// privilégié), pour 100 g de partie comestible. Arrondies. Certaines lignes
// mêlent des millésimes ou des aliments génériques proches et sont à revalider
// contre le tableau officiel (https://ciqual.anses.fr) avant tout usage réel.
//
// L'énergie (`kcalPer100g`) suit la valeur CIQUAL de l'aliment ; elle ne
// correspond donc pas exactement au recalcul 4/9/4 depuis les macros.

import type { AminoAcidKey } from "./macros";

export type FoodCategory =
  | "Féculents & pains"
  | "Viandes, poissons, œufs"
  | "Produits laitiers"
  | "Fruits & légumes"
  | "Matières grasses & oléagineux"
  // Catégorie générique de repli pour les aliments de la base USDA (tâche #14)
  // qui ne se rangent dans aucune des cinq catégories ci-dessus (boissons,
  // sucreries, plats préparés, soupes, épices…). Aucun aliment curaté n'y est
  // rangé : l'`<optgroup>` correspondant reste vide et masqué dans le sélecteur.
  | "Autres";

// Profil en acides aminés indispensables, exprimé en mg par g de protéine.
// Approche pragmatique (temp.txt) : plutôt que de saisir chaque AAE par aliment,
// on rattache l'aliment à un profil de référence (schéma d'AA de sa source
// protéique) puis on dérive l'apport = profil × grammes de protéines.
export type AminoAcidProfile = Record<AminoAcidKey, number>;

// Profils de référence (mg d'AAE par g de protéine). Valeurs INDICATIVES issues
// des schémas d'acides aminés FAO/WHO et de compositions alimentaires usuelles,
// arrondies ; à revalider avant tout usage réel. Les groupes combinés suivent
// les cibles : sulfur = Met+Cys, aromatic = Phe+Tyr.
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
  // Découpage protéique (optionnel : absent pour les aliments à protéines
  // négligeables — huiles, fruits, légumes aqueux — dont les AAE ne comptent pas).
  aaProfile?: AminoAcidProfileKey;
  // Profil d'AAE INLINE (mg d'AAE par g de protéine), calculé directement depuis
  // les grammes d'acides aminés mesurés — utilisé par la base USDA (tâche #14),
  // qui fournit le profil réel de chaque aliment plutôt qu'une clé de source.
  // Quand il est présent, il PRIME sur `aaProfile` dans le calcul des AAE
  // (cf. `ingredientAminoAcids`). Absent pour les aliments curatés (rattachés à
  // une clé `aaProfile`) et pour les aliments USDA sans profil d'AA complet.
  aaProfileValues?: AminoAcidProfile;
  // --- Attributs de régime alimentaire (tâche #7) ---
  // Végétarien : aucune chair animale (ni viande, ni poisson, ni fruits de
  // mer). Les œufs et les produits laitiers restent autorisés.
  vegetarian: boolean;
  // Vegan : aucun produit d'origine animale (ni viande/poisson, ni œufs, ni
  // laitages, ni miel…). Par cohérence : vegan ⇒ vegetarian.
  vegan: boolean;
  // Non transformé : aliment brut ou peu transformé, dans l'esprit du groupe 1
  // de la classification NOVA (fruits, légumes, œufs, viandes/poissons nature,
  // légumes secs, oléagineux nature, lait/yaourt nature…). Les produits ayant
  // subi une transformation notable (pain, pâtes, fromage affiné, huile
  // raffinée…) sont considérés comme transformés (false).
  unprocessed: boolean;
}

// Petite base de départ (aliments génériques CIQUAL). À enrichir au besoin.
export const FOODS: Food[] = [
  // Féculents & pains
  { id: "riz-blanc-cuit", name: "Riz blanc, cuit", category: "Féculents & pains", kcalPer100g: 143, proteinPer100g: 2.9, lipidPer100g: 0.4, carbPer100g: 31.8, aaProfile: "cereal", vegetarian: true, vegan: true, unprocessed: true },
  { id: "pates-cuites", name: "Pâtes, cuites", category: "Féculents & pains", kcalPer100g: 151, proteinPer100g: 4.9, lipidPer100g: 0.8, carbPer100g: 29.7, aaProfile: "cereal", vegetarian: true, vegan: true, unprocessed: false },
  { id: "pain-baguette", name: "Pain, baguette courante", category: "Féculents & pains", kcalPer100g: 274, proteinPer100g: 8.6, lipidPer100g: 2.5, carbPer100g: 54.2, aaProfile: "cereal", vegetarian: true, vegan: true, unprocessed: false },
  { id: "pomme-de-terre-cuite", name: "Pomme de terre, cuite à l'eau", category: "Féculents & pains", kcalPer100g: 73, proteinPer100g: 2.0, lipidPer100g: 0.1, carbPer100g: 15.0, aaProfile: "legume", vegetarian: true, vegan: true, unprocessed: true },
  { id: "lentilles-cuites", name: "Lentilles, cuites", category: "Féculents & pains", kcalPer100g: 116, proteinPer100g: 10.1, lipidPer100g: 0.6, carbPer100g: 15.2, aaProfile: "legume", vegetarian: true, vegan: true, unprocessed: true },

  // Viandes, poissons, œufs
  { id: "poulet-blanc-cuit", name: "Blanc de poulet, cuit", category: "Viandes, poissons, œufs", kcalPer100g: 137, proteinPer100g: 29.2, lipidPer100g: 1.8, carbPer100g: 1.2, aaProfile: "meat", vegetarian: false, vegan: false, unprocessed: true },
  { id: "steak-hache-15-cuit", name: "Steak haché de bœuf 15% MG, cuit", category: "Viandes, poissons, œufs", kcalPer100g: 239, proteinPer100g: 23.6, lipidPer100g: 16.1, carbPer100g: 0, aaProfile: "meat", vegetarian: false, vegan: false, unprocessed: true },
  { id: "saumon-cuit", name: "Saumon, cuit au four", category: "Viandes, poissons, œufs", kcalPer100g: 210, proteinPer100g: 22.1, lipidPer100g: 13.5, carbPer100g: 0, aaProfile: "fish", vegetarian: false, vegan: false, unprocessed: true },
  { id: "oeuf-dur", name: "Œuf, cuit dur", category: "Viandes, poissons, œufs", kcalPer100g: 134, proteinPer100g: 13.5, lipidPer100g: 8.6, carbPer100g: 0.5, aaProfile: "egg", vegetarian: true, vegan: false, unprocessed: true },

  // Produits laitiers
  { id: "emmental", name: "Emmental", category: "Produits laitiers", kcalPer100g: 380, proteinPer100g: 28.2, lipidPer100g: 28.3, carbPer100g: 0, aaProfile: "dairy", vegetarian: true, vegan: false, unprocessed: false },
  { id: "lait-demi-ecreme", name: "Lait demi-écrémé, UHT", category: "Produits laitiers", kcalPer100g: 46, proteinPer100g: 3.3, lipidPer100g: 1.5, carbPer100g: 4.8, aaProfile: "dairy", vegetarian: true, vegan: false, unprocessed: true },
  { id: "yaourt-nature", name: "Yaourt nature", category: "Produits laitiers", kcalPer100g: 57, proteinPer100g: 4.2, lipidPer100g: 2.7, carbPer100g: 3.7, aaProfile: "dairy", vegetarian: true, vegan: false, unprocessed: true },

  // Fruits & légumes (protéines négligeables : pas de découpage AAE)
  { id: "pomme", name: "Pomme, crue", category: "Fruits & légumes", kcalPer100g: 52, proteinPer100g: 0.3, lipidPer100g: 0.3, carbPer100g: 11.6, vegetarian: true, vegan: true, unprocessed: true },
  { id: "banane", name: "Banane, crue", category: "Fruits & légumes", kcalPer100g: 90, proteinPer100g: 1.0, lipidPer100g: 0.3, carbPer100g: 19.6, vegetarian: true, vegan: true, unprocessed: true },
  { id: "tomate", name: "Tomate, crue", category: "Fruits & légumes", kcalPer100g: 18, proteinPer100g: 0.9, lipidPer100g: 0.3, carbPer100g: 2.3, vegetarian: true, vegan: true, unprocessed: true },
  { id: "brocoli-cuit", name: "Brocoli, cuit", category: "Fruits & légumes", kcalPer100g: 26, proteinPer100g: 2.1, lipidPer100g: 0.8, carbPer100g: 1.1, vegetarian: true, vegan: true, unprocessed: true },

  // Matières grasses & oléagineux
  { id: "huile-olive", name: "Huile d'olive", category: "Matières grasses & oléagineux", kcalPer100g: 900, proteinPer100g: 0, lipidPer100g: 100, carbPer100g: 0, vegetarian: true, vegan: true, unprocessed: false },
  { id: "amandes", name: "Amandes", category: "Matières grasses & oléagineux", kcalPer100g: 630, proteinPer100g: 21.1, lipidPer100g: 53.4, carbPer100g: 7.9, aaProfile: "nuts", vegetarian: true, vegan: true, unprocessed: true },
  // Matière grasse laitière : végétarienne mais non vegan. Valeurs CIQUAL
  // indicatives (~717 kcal, 0,7 g prot, 81 g lip, 0,6 g gluc /100 g).
  { id: "beurre", name: "Beurre", category: "Matières grasses & oléagineux", kcalPer100g: 717, proteinPer100g: 0.7, lipidPer100g: 81, carbPer100g: 0.6, vegetarian: true, vegan: false, unprocessed: false },
  // Condiments pour la vinaigrette. Valeurs CIQUAL indicatives, protéines
  // négligeables (pas de découpage AAE).
  { id: "vinaigre", name: "Vinaigre", category: "Matières grasses & oléagineux", kcalPer100g: 20, proteinPer100g: 0, lipidPer100g: 0, carbPer100g: 0.6, vegetarian: true, vegan: true, unprocessed: false },
  { id: "moutarde", name: "Moutarde", category: "Matières grasses & oléagineux", kcalPer100g: 150, proteinPer100g: 6, lipidPer100g: 10, carbPer100g: 6, vegetarian: true, vegan: true, unprocessed: false },
];

export const FOODS_BY_ID: Record<string, Food> = Object.fromEntries(
  FOODS.map((f) => [f.id, f]),
);

export const FOOD_CATEGORIES: FoodCategory[] = [
  "Féculents & pains",
  "Viandes, poissons, œufs",
  "Produits laitiers",
  "Fruits & légumes",
  "Matières grasses & oléagineux",
  "Autres",
];

// Critères de filtrage par régime. Chaque champ est optionnel : quand il vaut
// `true` on n'exige que les aliments qui satisfont le critère ; quand il est
// absent (ou `false`) le critère n'est pas appliqué (aucune restriction).
export interface FoodFilter {
  vegetarian?: boolean;
  vegan?: boolean;
  unprocessed?: boolean;
}

// Filtre pur : renvoie les aliments qui satisfont TOUS les critères actifs
// (ET logique). Un critère à `false`/absent est ignoré. Ne mute pas l'entrée.
export function filterFoods(foods: Food[], filter: FoodFilter): Food[] {
  return foods.filter(
    (f) =>
      (!filter.vegetarian || f.vegetarian) &&
      (!filter.vegan || f.vegan) &&
      (!filter.unprocessed || f.unprocessed),
  );
}
