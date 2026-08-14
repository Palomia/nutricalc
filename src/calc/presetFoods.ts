// Petit ensemble d'aliments RÉELS extraits de `data/foods.fr.json`.
//
// Ce n'est PAS une seconde base nutritionnelle : chaque entrée est une COPIE
// verbatim d'un aliment de foods.fr.json (même `id` USDA, mêmes macros, même
// profil d'AAE précalculé). Ces aliments servent uniquement de :
//   1. cibles stables des presets (journée type, cuisson, vinaigrette) ;
//   2. graine du « registre des aliments sélectionnés » (cf. useMeals) : ainsi
//      la journée type / la cuisson / les suggestions se résolvent SANS charger
//      les 4,5 Mo de la base FR au démarrage ;
//   3. jeu d'« aliments courants » sur lequel tourne le moteur de suggestions
//      (classement performant, cf. suggestions.ts / DayAnalysis).
//
// Chaque `id` renvoie donc à une entrée réelle de foods.fr.json : sélectionner
// « à la main » le même aliment via la recherche donnerait rigoureusement les
// mêmes valeurs. Régénérable depuis foods.fr.json (cf. mapping ci-dessous).
import type { Food } from "./food";

// Correspondance clé sémantique → id USDA réel (documentation du remapping des
// anciens ids curatés « riz-blanc-cuit », « beurre »… vers la base FR).
export const PRESET_FOOD_IDS = {
  rice: "usda-169753", // Riz blanc long grain, cuit
  pasta: "usda-169737", // Pâtes cuites
  bread: "usda-172675", // Pain français / baguette
  potato: "usda-170440", // Pommes de terre bouillies
  lentils: "usda-172421", // Lentilles cuites
  chicken: "usda-171477", // Blanc de poulet rôti
  beef: "usda-174032", // Steak haché de bœuf 15% MG, cuit
  salmon: "usda-171998", // Saumon atlantique sauvage, cuit
  egg: "usda-173424", // Œuf dur
  cheese: "usda-171251", // Fromage (emmental → suisse)
  milk: "usda-171267", // Lait 2% MG
  yogurt: "usda-171284", // Yaourt nature
  apple: "usda-171688", // Pomme crue avec peau
  banana: "usda-173944", // Banane crue
  tomato: "usda-170457", // Tomate crue
  broccoli: "usda-169967", // Brocoli cuit
  oliveOil: "usda-171413", // Huile d'olive
  almonds: "usda-170567", // Amandes
  butter: "usda-173430", // Beurre sans sel
  vinegar: "usda-172237", // Vinaigre distillé
  mustard: "usda-172234", // Moutarde préparée
  tofu: "usda-172475", // Tofu ferme
} as const;

// Aliments réels (copies verbatim de foods.fr.json).
export const PRESET_FOODS: Food[] = [
  // rice
  { id: "usda-169753", fdcId: 169753, name: "Riz, blanc, à grains longs, régulier, cuit, enrichi, avec du sel", nameEn: "Rice, white, long-grain, regular, cooked, enriched, with salt", category: "Féculents & pains", kcalPer100g: 130.0, proteinPer100g: 2.69, lipidPer100g: 0.28, carbPer100g: 28.17, aaProfile: { histidine: 23.4, isoleucine: 43.1, leucine: 82.5, lysine: 36.1, sulfur: 43.9, aromatic: 87.0, threonine: 35.7, tryptophan: 11.5, valine: 61.0 }, vegetarian: true, vegan: true, unprocessed: false, dietUncertain: true },
  // pasta
  { id: "usda-169737", fdcId: 169737, name: "Pâtes cuites, enrichies, sans sel ajouté", nameEn: "Pasta, cooked, enriched, without added salt", category: "Féculents & pains", kcalPer100g: 158.0, proteinPer100g: 5.8, lipidPer100g: 0.93, carbPer100g: 30.86, aaProfile: { histidine: 22.6, isoleucine: 38.6, leucine: 74.8, lysine: 22.6, sulfur: 30.3, aromatic: 69.0, threonine: 35.0, tryptophan: 14.0, valine: 44.5 }, vegetarian: true, vegan: true, unprocessed: false, dietUncertain: true },
  // bread
  { id: "usda-172675", fdcId: 172675, name: "Pain, français ou vienne (comprend le levain)", nameEn: "Bread, french or vienna (includes sourdough)", category: "Féculents & pains", kcalPer100g: 272.0, proteinPer100g: 10.75, lipidPer100g: 2.42, carbPer100g: 51.88, aaProfile: undefined, vegetarian: true, vegan: false, unprocessed: false, dietUncertain: true },
  // potato
  { id: "usda-170440", fdcId: 170440, name: "Pommes de terre bouillies, cuites sans peau, sans chair, sans sel", nameEn: "Potatoes, boiled, cooked without skin, flesh, without salt", category: "Fruits & légumes", kcalPer100g: 86.0, proteinPer100g: 1.71, lipidPer100g: 0.1, carbPer100g: 20.01, aaProfile: { histidine: 22.2, isoleucine: 40.9, leucine: 60.2, lysine: 60.8, sulfur: 28.7, aromatic: 81.9, threonine: 36.3, tryptophan: 15.8, valine: 56.1 }, vegetarian: true, vegan: true, unprocessed: false, dietUncertain: true },
  // lentils
  { id: "usda-172421", fdcId: 172421, name: "Lentilles, graines mûres, cuites, bouillies, sans sel", nameEn: "Lentils, mature seeds, cooked, boiled, without salt", category: "Féculents & pains", kcalPer100g: 116.0, proteinPer100g: 9.02, lipidPer100g: 0.38, carbPer100g: 20.13, aaProfile: { histidine: 28.2, isoleucine: 43.2, leucine: 72.5, lysine: 69.8, sulfur: 21.6, aromatic: 76.1, threonine: 35.8, tryptophan: 9.0, valine: 49.7 }, vegetarian: true, vegan: true, unprocessed: false, dietUncertain: false },
  // chicken
  { id: "usda-171477", fdcId: 171477, name: "Poulet, poulets de chair ou friteuses, poitrine, viande uniquement, cuits, rôtis", nameEn: "Chicken, broilers or fryers, breast, meat only, cooked, roasted", category: "Viandes, poissons, œufs", kcalPer100g: 165.0, proteinPer100g: 31.02, lipidPer100g: 3.57, carbPer100g: 0.0, aaProfile: { histidine: 31.0, isoleucine: 52.8, leucine: 75.0, lysine: 84.9, sulfur: 40.5, aromatic: 73.4, threonine: 42.2, tryptophan: 11.7, valine: 49.6 }, vegetarian: false, vegan: false, unprocessed: false, dietUncertain: false },
  // beef
  { id: "usda-174032", fdcId: 174032, name: "Boeuf, haché, 85% viande maigre / 15% matière grasse, galette, cuite, grillée", nameEn: "Beef, ground, 85% lean meat / 15% fat, patty, cooked, broiled", category: "Viandes, poissons, œufs", kcalPer100g: 250.0, proteinPer100g: 25.93, lipidPer100g: 15.41, carbPer100g: 0.0, aaProfile: { histidine: 23.3, isoleucine: 31.7, leucine: 55.9, lysine: 59.4, sulfur: 25.8, aromatic: 50.0, threonine: 27.8, tryptophan: 3.6, valine: 35.2 }, vegetarian: false, vegan: false, unprocessed: false, dietUncertain: false },
  // salmon
  { id: "usda-171998", fdcId: 171998, name: "Poisson, saumon, atlantique, sauvage, cuit, chaleur sèche", nameEn: "Fish, salmon, Atlantic, wild, cooked, dry heat", category: "Viandes, poissons, œufs", kcalPer100g: 182.0, proteinPer100g: 25.44, lipidPer100g: 8.13, carbPer100g: 0.0, aaProfile: { histidine: 29.4, isoleucine: 46.1, leucine: 81.2, lysine: 91.8, sulfur: 40.3, aromatic: 72.8, threonine: 43.8, tryptophan: 11.2, valine: 51.5 }, vegetarian: false, vegan: false, unprocessed: false, dietUncertain: false },
  // egg
  { id: "usda-173424", fdcId: 173424, name: "Oeuf, entier, cuit, dur", nameEn: "Egg, whole, cooked, hard-boiled", category: "Produits laitiers", kcalPer100g: 155.0, proteinPer100g: 12.58, lipidPer100g: 10.61, carbPer100g: 1.12, aaProfile: { histidine: 23.7, isoleucine: 54.5, leucine: 85.5, lysine: 71.9, sulfur: 54.4, aromatic: 93.9, threonine: 48.0, tryptophan: 12.2, valine: 61.0 }, vegetarian: true, vegan: false, unprocessed: false, dietUncertain: false },
  // cheese
  { id: "usda-171251", fdcId: 171251, name: "Fromage, suisse", nameEn: "Cheese, swiss", category: "Produits laitiers", kcalPer100g: 393.0, proteinPer100g: 26.96, lipidPer100g: 30.99, carbPer100g: 1.44, aaProfile: { histidine: 39.5, isoleucine: 57.0, leucine: 109.8, lysine: 95.9, sulfur: 39.8, aromatic: 124.4, threonine: 38.5, tryptophan: 14.9, valine: 79.3 }, vegetarian: true, vegan: false, unprocessed: false, dietUncertain: false },
  // milk
  { id: "usda-171267", fdcId: 171267, name: "Lait, faible en gras, liquide, 2% de matière grasse laitière, additionné de vitamine A et de vitamine D", nameEn: "Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D", category: "Produits laitiers", kcalPer100g: 50.0, proteinPer100g: 3.3, lipidPer100g: 1.98, carbPer100g: 4.8, aaProfile: { histidine: 30.3, isoleucine: 51.8, leucine: 94.8, lysine: 83.6, sulfur: 32.4, aromatic: 102.4, threonine: 42.7, tryptophan: 12.7, valine: 65.5 }, vegetarian: true, vegan: false, unprocessed: false, dietUncertain: false },
  // yogurt
  { id: "usda-171284", fdcId: 171284, name: "Yaourt nature, lait entier", nameEn: "Yogurt, plain, whole milk", category: "Produits laitiers", kcalPer100g: 61.0, proteinPer100g: 3.47, lipidPer100g: 3.25, carbPer100g: 4.66, aaProfile: { histidine: 24.8, isoleucine: 54.5, leucine: 100.9, lysine: 89.6, sulfur: 38.6, aromatic: 104.9, threonine: 40.9, tryptophan: 5.8, valine: 82.7 }, vegetarian: true, vegan: false, unprocessed: false, dietUncertain: false },
  // apple
  { id: "usda-171688", fdcId: 171688, name: "Pommes, crues, avec la peau (comprend les aliments destinés au programme de distribution alimentaire de l'USDA)", nameEn: "Apples, raw, with skin (Includes foods for USDA's Food Distribution Program)", category: "Fruits & légumes", kcalPer100g: 52.0, proteinPer100g: 0.26, lipidPer100g: 0.17, carbPer100g: 13.81, aaProfile: { histidine: 19.2, isoleucine: 23.1, leucine: 50.0, lysine: 46.2, sulfur: 7.7, aromatic: 26.9, threonine: 23.1, tryptophan: 3.8, valine: 46.2 }, vegetarian: true, vegan: true, unprocessed: true, dietUncertain: false },
  // banana
  { id: "usda-173944", fdcId: 173944, name: "Bananes, crues", nameEn: "Bananas, raw", category: "Fruits & légumes", kcalPer100g: 89.0, proteinPer100g: 1.09, lipidPer100g: 0.33, carbPer100g: 22.84, aaProfile: { histidine: 70.6, isoleucine: 25.7, leucine: 62.4, lysine: 45.9, sulfur: 15.6, aromatic: 53.2, threonine: 25.7, tryptophan: 8.3, valine: 43.1 }, vegetarian: true, vegan: true, unprocessed: true, dietUncertain: false },
  // tomato
  { id: "usda-170457", fdcId: 170457, name: "Tomates, rouges, mûres, crues, moyenne toute l'année", nameEn: "Tomatoes, red, ripe, raw, year round average", category: "Fruits & légumes", kcalPer100g: 18.0, proteinPer100g: 0.88, lipidPer100g: 0.2, carbPer100g: 3.89, aaProfile: { histidine: 15.9, isoleucine: 20.5, leucine: 28.4, lysine: 30.7, sulfur: 17.0, aromatic: 46.6, threonine: 30.7, tryptophan: 6.8, valine: 20.5 }, vegetarian: true, vegan: true, unprocessed: true, dietUncertain: true },
  // broccoli
  { id: "usda-169967", fdcId: 169967, name: "Brocoli, cuit, bouilli, égoutté, sans sel", nameEn: "Broccoli, cooked, boiled, drained, without salt", category: "Fruits & légumes", kcalPer100g: 35.0, proteinPer100g: 2.38, lipidPer100g: 0.41, carbPer100g: 7.18, aaProfile: { histidine: 26.5, isoleucine: 38.7, leucine: 61.8, lysine: 65.1, sulfur: 31.1, aromatic: 73.9, threonine: 40.3, tryptophan: 14.3, valine: 58.0 }, vegetarian: true, vegan: true, unprocessed: false, dietUncertain: true },
  // oliveoil
  { id: "usda-171413", fdcId: 171413, name: "Huile, olive, salade ou cuisson", nameEn: "Oil, olive, salad or cooking", category: "Matières grasses & oléagineux", kcalPer100g: 884.0, proteinPer100g: 0.0, lipidPer100g: 100.0, carbPer100g: 0.0, aaProfile: undefined, vegetarian: true, vegan: false, unprocessed: false, dietUncertain: true },
  // almonds
  { id: "usda-170567", fdcId: 170567, name: "Noix, amandes", nameEn: "Nuts, almonds", category: "Matières grasses & oléagineux", kcalPer100g: 579.0, proteinPer100g: 21.15, lipidPer100g: 49.93, carbPer100g: 21.55, aaProfile: { histidine: 25.5, isoleucine: 35.5, leucine: 69.6, lysine: 26.9, sulfur: 17.6, aromatic: 74.8, threonine: 28.4, tryptophan: 10.0, valine: 40.4 }, vegetarian: true, vegan: true, unprocessed: false, dietUncertain: false },
  // butter
  { id: "usda-173430", fdcId: 173430, name: "Beurre, sans sel", nameEn: "Butter, without salt", category: "Produits laitiers", kcalPer100g: 717.0, proteinPer100g: 0.85, lipidPer100g: 81.11, carbPer100g: 0.06, aaProfile: { histidine: 27.1, isoleucine: 60.0, leucine: 97.6, lysine: 78.8, sulfur: 34.1, aromatic: 96.5, threonine: 44.7, tryptophan: 14.1, valine: 67.1 }, vegetarian: true, vegan: false, unprocessed: false, dietUncertain: false },
  // vinegar
  { id: "usda-172237", fdcId: 172237, name: "Vinaigre distillé", nameEn: "Vinegar, distilled", category: "Autres", kcalPer100g: 18.0, proteinPer100g: 0.0, lipidPer100g: 0.0, carbPer100g: 0.04, aaProfile: undefined, vegetarian: true, vegan: true, unprocessed: false, dietUncertain: false },
  // mustard
  { id: "usda-172234", fdcId: 172234, name: "Moutarde, préparée, jaune", nameEn: "Mustard, prepared, yellow", category: "Autres", kcalPer100g: 60.0, proteinPer100g: 3.74, lipidPer100g: 3.34, carbPer100g: 5.83, aaProfile: { histidine: 31.8, isoleucine: 39.0, leucine: 78.1, lysine: 70.6, sulfur: 39.6, aromatic: 78.9, threonine: 44.7, tryptophan: 2.4, valine: 50.5 }, vegetarian: true, vegan: true, unprocessed: false, dietUncertain: false },
  // tofu
  { id: "usda-172475", fdcId: 172475, name: "Tofu, cru, ferme, préparé avec du sulfate de calcium", nameEn: "Tofu, raw, firm, prepared with calcium sulfate", category: "Féculents & pains", kcalPer100g: 144.0, proteinPer100g: 17.27, lipidPer100g: 8.72, carbPer100g: 2.78, aaProfile: { histidine: 25.0, isoleucine: 49.2, leucine: 80.6, lysine: 51.1, sulfur: 15.5, aromatic: 88.9, threonine: 45.5, tryptophan: 13.6, valine: 50.4 }, vegetarian: true, vegan: true, unprocessed: true, dietUncertain: false },
];

export const PRESET_FOODS_BY_ID: Record<string, Food> = Object.fromEntries(
  PRESET_FOODS.map((f) => [f.id, f]),
);

// Aliment par défaut d'un nouvel ingrédient (garanti présent dans le registre).
export const DEFAULT_FOOD_ID: string = PRESET_FOOD_IDS.chicken;
