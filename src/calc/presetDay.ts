// Journée type prête à l'emploi (tâche #13).
//
// Cinq prises réparties sur la journée — Petit-déjeuner, Déjeuner, En-cas et
// Dîner — que l'utilisateur peut charger d'un clic pour partir d'une base
// plausible plutôt que d'une journée vide. Le Déjeuner et le Dîner sont
// structurés en entrée / plat / dessert ; le Petit-déjeuner et l'En-cas se
// résument à un plat simple.
//
// La journée est décrite en DONNÉES pures, sans id d'édition : elle réutilise le
// type `SavedMeal` (repas → plats → ingrédients référencés par `foodId` + grammes)
// et l'allocateur d'ids de `storage.ts`, si bien que l'insertion régénère des
// clés React fraîches via le compteur du MealPlanner (aucune collision possible).
//
// Tous les `foodId` renvoient à des aliments réels de la base FR via
// `PRESET_FOOD_IDS` (cf. presetFoods.ts, extraits de foods.fr.json) ; aucune
// donnée personnelle. Quantités en grammes indicatives.
import { fromSavedMeal, type EMeal, type SavedMeal } from "./storage";
import { PRESET_FOOD_IDS as F } from "./presetFoods";

// Modèle de la journée type. Sert de source de vérité aux tests et au builder.
export const PRESET_DAY: SavedMeal[] = [
  {
    name: "Petit-déjeuner",
    dishes: [
      {
        name: "Bol du matin",
        ingredients: [
          { foodId: F.bread, quantity: 60, unit: "gramme" },
          { foodId: F.yogurt, quantity: 125, unit: "gramme" },
          { foodId: F.banana, quantity: 120, unit: "gramme" },
        ],
      },
    ],
  },
  {
    name: "Déjeuner",
    dishes: [
      {
        name: "Entrée",
        ingredients: [
          { foodId: F.tomato, quantity: 150, unit: "gramme" },
          { foodId: F.oliveOil, quantity: 5, unit: "gramme" },
        ],
      },
      {
        name: "Plat",
        ingredients: [
          { foodId: F.chicken, quantity: 150, unit: "gramme" },
          { foodId: F.rice, quantity: 150, unit: "gramme" },
          { foodId: F.broccoli, quantity: 100, unit: "gramme" },
        ],
      },
      {
        name: "Dessert",
        ingredients: [{ foodId: F.apple, quantity: 150, unit: "gramme" }],
      },
    ],
  },
  {
    name: "En-cas",
    dishes: [
      {
        name: "Collation",
        ingredients: [
          { foodId: F.yogurt, quantity: 125, unit: "gramme" },
          { foodId: F.almonds, quantity: 20, unit: "gramme" },
        ],
      },
    ],
  },
  {
    name: "Dîner",
    dishes: [
      {
        name: "Entrée",
        ingredients: [
          { foodId: F.lentils, quantity: 100, unit: "gramme" },
          { foodId: F.tomato, quantity: 100, unit: "gramme" },
        ],
      },
      {
        name: "Plat",
        ingredients: [
          { foodId: F.salmon, quantity: 130, unit: "gramme" },
          { foodId: F.potato, quantity: 200, unit: "gramme" },
          { foodId: F.broccoli, quantity: 120, unit: "gramme" },
        ],
      },
      {
        name: "Dessert",
        ingredients: [{ foodId: F.yogurt, quantity: 125, unit: "gramme" }],
      },
    ],
  },
];

// Construit la journée type sous forme éditable : chaque repas / plat /
// ingrédient reçoit un id frais issu de l'allocateur fourni (le compteur du
// MealPlanner), pour rester cohérent avec les ids existants et éviter toute
// collision de clés React. Fonction pure : ne mute pas `PRESET_DAY`.
export function buildPresetDay(id: () => number): EMeal[] {
  return PRESET_DAY.map((meal) => fromSavedMeal(meal, id));
}
