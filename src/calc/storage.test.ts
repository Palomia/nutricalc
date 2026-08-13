import { describe, expect, it } from "vitest";
import {
  deserializeDay,
  deserializeSavedDishes,
  deserializeSavedMeals,
  fromSavedDish,
  fromSavedMeal,
  nextIdFrom,
  serializeDay,
  serializeSaved,
  toSavedMeal,
  type EMeal,
  type SavedMeal,
} from "./storage";

// Journée d'exemple (aliments fictifs référencés par id, pas de données réelles).
const day: EMeal[] = [
  {
    id: 3,
    name: "Déjeuner",
    dishes: [
      {
        id: 5,
        name: "Bol",
        ingredients: [
          { id: 7, foodId: "riz", grams: 150 },
          { id: 9, foodId: "poulet", grams: 100 },
        ],
      },
    ],
  },
  { id: 1, name: "Dîner", dishes: [] },
];

describe("storage — journée en cours", () => {
  it("round-trip serialize → deserialize préserve la structure", () => {
    expect(deserializeDay(serializeDay(day))).toEqual(day);
  });

  it("retourne un état vide sur JSON invalide", () => {
    expect(deserializeDay("{ pas du json")).toEqual([]);
    expect(deserializeDay("not json at all")).toEqual([]);
  });

  it("retourne un état vide sur absence de donnée", () => {
    expect(deserializeDay(null)).toEqual([]);
    expect(deserializeDay("")).toEqual([]);
  });

  it("retourne un état vide si la racine n'est pas un tableau", () => {
    expect(deserializeDay(JSON.stringify({ meals: [] }))).toEqual([]);
  });

  it("ignore les entrées malformées sans faire échouer le reste", () => {
    const raw = JSON.stringify([
      { id: 2, name: "Ok", dishes: [] },
      { name: "Sans id", dishes: [] }, // id manquant → ignoré
      { id: 4, name: "Plat filtré", dishes: [{ id: 6, ingredients: [] }] }, // dish sans name → ignoré
    ]);
    expect(deserializeDay(raw)).toEqual([
      { id: 2, name: "Ok", dishes: [] },
      { id: 4, name: "Plat filtré", dishes: [] },
    ]);
  });
});

describe("storage — recalcul de nextId", () => {
  it("prend le max des ids (repas, plats, ingrédients) + 1", () => {
    expect(nextIdFrom(day)).toBe(10);
  });

  it("vaut 1 sur une journée vide", () => {
    expect(nextIdFrom([])).toBe(1);
  });

  it("garantit l'absence de collision après restauration", () => {
    const restored = deserializeDay(serializeDay(day));
    let counter = nextIdFrom(restored);
    const id = () => counter++;
    const existing = new Set<number>();
    for (const m of restored) {
      existing.add(m.id);
      for (const d of m.dishes) {
        existing.add(d.id);
        for (const i of d.ingredients) existing.add(i.id);
      }
    }
    for (let k = 0; k < 20; k++) expect(existing.has(id())).toBe(false);
  });
});

describe("storage — modèles enregistrés", () => {
  const savedMeal: SavedMeal = {
    name: "Petit-déjeuner type",
    dishes: [{ name: "Tartines", ingredients: [{ foodId: "pain", grams: 80 }] }],
  };

  it("round-trip des repas enregistrés", () => {
    expect(deserializeSavedMeals(serializeSaved([savedMeal]))).toEqual([savedMeal]);
  });

  it("round-trip des plats enregistrés", () => {
    const dishes = savedMeal.dishes;
    expect(deserializeSavedDishes(serializeSaved(dishes))).toEqual(dishes);
  });

  it("JSON invalide / absent → liste vide", () => {
    expect(deserializeSavedMeals("nope")).toEqual([]);
    expect(deserializeSavedMeals(null)).toEqual([]);
    expect(deserializeSavedDishes("{")).toEqual([]);
  });

  it("toSavedMeal retire les ids d'édition", () => {
    expect(toSavedMeal(day[0])).toEqual({
      name: "Déjeuner",
      dishes: [
        {
          name: "Bol",
          ingredients: [
            { foodId: "riz", grams: 150 },
            { foodId: "poulet", grams: 100 },
          ],
        },
      ],
    });
  });

  it("fromSavedMeal régénère des ids frais et distincts", () => {
    let counter = 100;
    const id = () => counter++;
    const meal = fromSavedMeal(savedMeal, id);
    const ids = [meal.id, ...meal.dishes.flatMap((d) => [d.id, ...d.ingredients.map((i) => i.id)])];
    expect(new Set(ids).size).toBe(ids.length); // tous distincts
    expect(Math.min(...ids)).toBeGreaterThanOrEqual(100);
    // le contenu (noms, aliments, grammes) est conservé
    expect(toSavedMeal(meal)).toEqual(savedMeal);
  });

  it("fromSavedDish régénère les ids et conserve le contenu", () => {
    let counter = 1;
    const id = () => counter++;
    const dish = fromSavedDish(savedMeal.dishes[0], id);
    expect(dish.name).toBe("Tartines");
    expect(dish.ingredients).toEqual([{ id: 2, foodId: "pain", grams: 80 }]);
    expect(dish.id).toBe(1);
  });
});
