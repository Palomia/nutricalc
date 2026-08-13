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
// Tous les `foodId` renvoient à des aliments réels de `FOODS` (cf. food.ts) ;
// aucune donnée personnelle. Quantités en grammes indicatives.
import { fromSavedMeal, type EMeal, type SavedMeal } from "./storage";

// Modèle de la journée type. Sert de source de vérité aux tests et au builder.
export const PRESET_DAY: SavedMeal[] = [
  {
    name: "Petit-déjeuner",
    dishes: [
      {
        name: "Bol du matin",
        ingredients: [
          { foodId: "pain-baguette", grams: 60 },
          { foodId: "yaourt-nature", grams: 125 },
          { foodId: "banane", grams: 120 },
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
          { foodId: "tomate", grams: 150 },
          { foodId: "huile-olive", grams: 5 },
        ],
      },
      {
        name: "Plat",
        ingredients: [
          { foodId: "poulet-blanc-cuit", grams: 150 },
          { foodId: "riz-blanc-cuit", grams: 150 },
          { foodId: "brocoli-cuit", grams: 100 },
        ],
      },
      {
        name: "Dessert",
        ingredients: [{ foodId: "pomme", grams: 150 }],
      },
    ],
  },
  {
    name: "En-cas",
    dishes: [
      {
        name: "Collation",
        ingredients: [
          { foodId: "yaourt-nature", grams: 125 },
          { foodId: "amandes", grams: 20 },
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
          { foodId: "lentilles-cuites", grams: 100 },
          { foodId: "tomate", grams: 100 },
        ],
      },
      {
        name: "Plat",
        ingredients: [
          { foodId: "saumon-cuit", grams: 130 },
          { foodId: "pomme-de-terre-cuite", grams: 200 },
          { foodId: "brocoli-cuit", grams: 120 },
        ],
      },
      {
        name: "Dessert",
        ingredients: [{ foodId: "yaourt-nature", grams: 125 }],
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
