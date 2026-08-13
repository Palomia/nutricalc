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
          { foodId: "pain-baguette", quantity: 60, unit: "gramme" },
          { foodId: "yaourt-nature", quantity: 125, unit: "gramme" },
          { foodId: "banane", quantity: 120, unit: "gramme" },
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
          { foodId: "tomate", quantity: 150, unit: "gramme" },
          { foodId: "huile-olive", quantity: 5, unit: "gramme" },
        ],
      },
      {
        name: "Plat",
        ingredients: [
          { foodId: "poulet-blanc-cuit", quantity: 150, unit: "gramme" },
          { foodId: "riz-blanc-cuit", quantity: 150, unit: "gramme" },
          { foodId: "brocoli-cuit", quantity: 100, unit: "gramme" },
        ],
      },
      {
        name: "Dessert",
        ingredients: [{ foodId: "pomme", quantity: 150, unit: "gramme" }],
      },
    ],
  },
  {
    name: "En-cas",
    dishes: [
      {
        name: "Collation",
        ingredients: [
          { foodId: "yaourt-nature", quantity: 125, unit: "gramme" },
          { foodId: "amandes", quantity: 20, unit: "gramme" },
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
          { foodId: "lentilles-cuites", quantity: 100, unit: "gramme" },
          { foodId: "tomate", quantity: 100, unit: "gramme" },
        ],
      },
      {
        name: "Plat",
        ingredients: [
          { foodId: "saumon-cuit", quantity: 130, unit: "gramme" },
          { foodId: "pomme-de-terre-cuite", quantity: 200, unit: "gramme" },
          { foodId: "brocoli-cuit", quantity: 120, unit: "gramme" },
        ],
      },
      {
        name: "Dessert",
        ingredients: [{ foodId: "yaourt-nature", quantity: 125, unit: "gramme" }],
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
