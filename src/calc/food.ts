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

export type FoodCategory =
  | "Féculents & pains"
  | "Viandes, poissons, œufs"
  | "Produits laitiers"
  | "Fruits & légumes"
  | "Matières grasses & oléagineux";

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  // Pour 100 g de partie comestible.
  kcalPer100g: number;
  proteinPer100g: number;
  lipidPer100g: number;
  carbPer100g: number;
}

// Petite base de départ (aliments génériques CIQUAL). À enrichir au besoin.
export const FOODS: Food[] = [
  // Féculents & pains
  { id: "riz-blanc-cuit", name: "Riz blanc, cuit", category: "Féculents & pains", kcalPer100g: 143, proteinPer100g: 2.9, lipidPer100g: 0.4, carbPer100g: 31.8 },
  { id: "pates-cuites", name: "Pâtes, cuites", category: "Féculents & pains", kcalPer100g: 151, proteinPer100g: 4.9, lipidPer100g: 0.8, carbPer100g: 29.7 },
  { id: "pain-baguette", name: "Pain, baguette courante", category: "Féculents & pains", kcalPer100g: 274, proteinPer100g: 8.6, lipidPer100g: 2.5, carbPer100g: 54.2 },
  { id: "pomme-de-terre-cuite", name: "Pomme de terre, cuite à l'eau", category: "Féculents & pains", kcalPer100g: 73, proteinPer100g: 2.0, lipidPer100g: 0.1, carbPer100g: 15.0 },
  { id: "lentilles-cuites", name: "Lentilles, cuites", category: "Féculents & pains", kcalPer100g: 116, proteinPer100g: 10.1, lipidPer100g: 0.6, carbPer100g: 15.2 },

  // Viandes, poissons, œufs
  { id: "poulet-blanc-cuit", name: "Blanc de poulet, cuit", category: "Viandes, poissons, œufs", kcalPer100g: 137, proteinPer100g: 29.2, lipidPer100g: 1.8, carbPer100g: 1.2 },
  { id: "steak-hache-15-cuit", name: "Steak haché de bœuf 15% MG, cuit", category: "Viandes, poissons, œufs", kcalPer100g: 239, proteinPer100g: 23.6, lipidPer100g: 16.1, carbPer100g: 0 },
  { id: "saumon-cuit", name: "Saumon, cuit au four", category: "Viandes, poissons, œufs", kcalPer100g: 210, proteinPer100g: 22.1, lipidPer100g: 13.5, carbPer100g: 0 },
  { id: "oeuf-dur", name: "Œuf, cuit dur", category: "Viandes, poissons, œufs", kcalPer100g: 134, proteinPer100g: 13.5, lipidPer100g: 8.6, carbPer100g: 0.5 },

  // Produits laitiers
  { id: "emmental", name: "Emmental", category: "Produits laitiers", kcalPer100g: 380, proteinPer100g: 28.2, lipidPer100g: 28.3, carbPer100g: 0 },
  { id: "lait-demi-ecreme", name: "Lait demi-écrémé, UHT", category: "Produits laitiers", kcalPer100g: 46, proteinPer100g: 3.3, lipidPer100g: 1.5, carbPer100g: 4.8 },
  { id: "yaourt-nature", name: "Yaourt nature", category: "Produits laitiers", kcalPer100g: 57, proteinPer100g: 4.2, lipidPer100g: 2.7, carbPer100g: 3.7 },

  // Fruits & légumes
  { id: "pomme", name: "Pomme, crue", category: "Fruits & légumes", kcalPer100g: 52, proteinPer100g: 0.3, lipidPer100g: 0.3, carbPer100g: 11.6 },
  { id: "banane", name: "Banane, crue", category: "Fruits & légumes", kcalPer100g: 90, proteinPer100g: 1.0, lipidPer100g: 0.3, carbPer100g: 19.6 },
  { id: "tomate", name: "Tomate, crue", category: "Fruits & légumes", kcalPer100g: 18, proteinPer100g: 0.9, lipidPer100g: 0.3, carbPer100g: 2.3 },
  { id: "brocoli-cuit", name: "Brocoli, cuit", category: "Fruits & légumes", kcalPer100g: 26, proteinPer100g: 2.1, lipidPer100g: 0.8, carbPer100g: 1.1 },

  // Matières grasses & oléagineux
  { id: "huile-olive", name: "Huile d'olive", category: "Matières grasses & oléagineux", kcalPer100g: 900, proteinPer100g: 0, lipidPer100g: 100, carbPer100g: 0 },
  { id: "amandes", name: "Amandes", category: "Matières grasses & oléagineux", kcalPer100g: 630, proteinPer100g: 21.1, lipidPer100g: 53.4, carbPer100g: 7.9 },
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
