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
  | "Matières grasses & oléagineux";

// Qualité protéique (temp.txt §11), du meilleur profil anabolique au plus
// pauvre. Sert au score de qualité et à la pondération des « protéines utiles ».
export type ProteinQualityTier = "excellent" | "tresBon" | "moyen" | "faible";

// Score 0-100 associé à chaque tier, utilisé par le score de qualité protéique.
export const PROTEIN_QUALITY_SCORE: Record<ProteinQualityTier, number> = {
  excellent: 100,
  tresBon: 85,
  moyen: 60,
  faible: 35,
};

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
  proteinQuality?: ProteinQualityTier;
}

// Petite base de départ (aliments génériques CIQUAL). À enrichir au besoin.
export const FOODS: Food[] = [
  // Féculents & pains
  { id: "riz-blanc-cuit", name: "Riz blanc, cuit", category: "Féculents & pains", kcalPer100g: 143, proteinPer100g: 2.9, lipidPer100g: 0.4, carbPer100g: 31.8, aaProfile: "cereal", proteinQuality: "faible" },
  { id: "pates-cuites", name: "Pâtes, cuites", category: "Féculents & pains", kcalPer100g: 151, proteinPer100g: 4.9, lipidPer100g: 0.8, carbPer100g: 29.7, aaProfile: "cereal", proteinQuality: "faible" },
  { id: "pain-baguette", name: "Pain, baguette courante", category: "Féculents & pains", kcalPer100g: 274, proteinPer100g: 8.6, lipidPer100g: 2.5, carbPer100g: 54.2, aaProfile: "cereal", proteinQuality: "faible" },
  { id: "pomme-de-terre-cuite", name: "Pomme de terre, cuite à l'eau", category: "Féculents & pains", kcalPer100g: 73, proteinPer100g: 2.0, lipidPer100g: 0.1, carbPer100g: 15.0, aaProfile: "legume", proteinQuality: "faible" },
  { id: "lentilles-cuites", name: "Lentilles, cuites", category: "Féculents & pains", kcalPer100g: 116, proteinPer100g: 10.1, lipidPer100g: 0.6, carbPer100g: 15.2, aaProfile: "legume", proteinQuality: "moyen" },

  // Viandes, poissons, œufs
  { id: "poulet-blanc-cuit", name: "Blanc de poulet, cuit", category: "Viandes, poissons, œufs", kcalPer100g: 137, proteinPer100g: 29.2, lipidPer100g: 1.8, carbPer100g: 1.2, aaProfile: "meat", proteinQuality: "excellent" },
  { id: "steak-hache-15-cuit", name: "Steak haché de bœuf 15% MG, cuit", category: "Viandes, poissons, œufs", kcalPer100g: 239, proteinPer100g: 23.6, lipidPer100g: 16.1, carbPer100g: 0, aaProfile: "meat", proteinQuality: "excellent" },
  { id: "saumon-cuit", name: "Saumon, cuit au four", category: "Viandes, poissons, œufs", kcalPer100g: 210, proteinPer100g: 22.1, lipidPer100g: 13.5, carbPer100g: 0, aaProfile: "fish", proteinQuality: "excellent" },
  { id: "oeuf-dur", name: "Œuf, cuit dur", category: "Viandes, poissons, œufs", kcalPer100g: 134, proteinPer100g: 13.5, lipidPer100g: 8.6, carbPer100g: 0.5, aaProfile: "egg", proteinQuality: "excellent" },

  // Produits laitiers
  { id: "emmental", name: "Emmental", category: "Produits laitiers", kcalPer100g: 380, proteinPer100g: 28.2, lipidPer100g: 28.3, carbPer100g: 0, aaProfile: "dairy", proteinQuality: "excellent" },
  { id: "lait-demi-ecreme", name: "Lait demi-écrémé, UHT", category: "Produits laitiers", kcalPer100g: 46, proteinPer100g: 3.3, lipidPer100g: 1.5, carbPer100g: 4.8, aaProfile: "dairy", proteinQuality: "excellent" },
  { id: "yaourt-nature", name: "Yaourt nature", category: "Produits laitiers", kcalPer100g: 57, proteinPer100g: 4.2, lipidPer100g: 2.7, carbPer100g: 3.7, aaProfile: "dairy", proteinQuality: "excellent" },

  // Fruits & légumes (protéines négligeables : pas de découpage AAE)
  { id: "pomme", name: "Pomme, crue", category: "Fruits & légumes", kcalPer100g: 52, proteinPer100g: 0.3, lipidPer100g: 0.3, carbPer100g: 11.6 },
  { id: "banane", name: "Banane, crue", category: "Fruits & légumes", kcalPer100g: 90, proteinPer100g: 1.0, lipidPer100g: 0.3, carbPer100g: 19.6 },
  { id: "tomate", name: "Tomate, crue", category: "Fruits & légumes", kcalPer100g: 18, proteinPer100g: 0.9, lipidPer100g: 0.3, carbPer100g: 2.3 },
  { id: "brocoli-cuit", name: "Brocoli, cuit", category: "Fruits & légumes", kcalPer100g: 26, proteinPer100g: 2.1, lipidPer100g: 0.8, carbPer100g: 1.1 },

  // Matières grasses & oléagineux
  { id: "huile-olive", name: "Huile d'olive", category: "Matières grasses & oléagineux", kcalPer100g: 900, proteinPer100g: 0, lipidPer100g: 100, carbPer100g: 0 },
  { id: "amandes", name: "Amandes", category: "Matières grasses & oléagineux", kcalPer100g: 630, proteinPer100g: 21.1, lipidPer100g: 53.4, carbPer100g: 7.9, aaProfile: "nuts", proteinQuality: "faible" },
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
];
