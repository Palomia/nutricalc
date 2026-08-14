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
  serializeRegistry,
  deserializeRegistry,
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
          { id: 7, foodId: "riz", quantity: 150, unit: "gramme" },
          { id: 9, foodId: "poulet", quantity: 1, unit: "cuillereSoupe" },
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

describe("storage — migration des anciennes entrées (grams → quantity/unit)", () => {
  it("convertit un ingrédient hérité { grams } en { quantity, unit: 'gramme' }", () => {
    // Ancien format persisté avant l'introduction des unités ménagères.
    const legacy = JSON.stringify([
      {
        id: 1,
        name: "Repas",
        dishes: [{ id: 2, name: "Plat", ingredients: [{ id: 3, foodId: "riz", grams: 120 }] }],
      },
    ]);
    expect(deserializeDay(legacy)).toEqual([
      {
        id: 1,
        name: "Repas",
        dishes: [
          { id: 2, name: "Plat", ingredients: [{ id: 3, foodId: "riz", quantity: 120, unit: "gramme" }] },
        ],
      },
    ]);
  });

  it("migre aussi les modèles enregistrés hérités { grams }", () => {
    const legacy = JSON.stringify([
      { name: "Modèle", dishes: [{ name: "Plat", ingredients: [{ foodId: "pain", grams: 80 }] }] },
    ]);
    expect(deserializeSavedMeals(legacy)).toEqual([
      { name: "Modèle", dishes: [{ name: "Plat", ingredients: [{ foodId: "pain", quantity: 80, unit: "gramme" }] }] },
    ]);
  });

  it("préserve le nouveau format quantity/unit s'il est présent", () => {
    const raw = JSON.stringify([
      {
        id: 1,
        name: "Repas",
        dishes: [{ id: 2, name: "Plat", ingredients: [{ id: 3, foodId: "huile", quantity: 2, unit: "cuillereSoupe" }] }],
      },
    ]);
    expect(deserializeDay(raw)).toEqual([
      {
        id: 1,
        name: "Repas",
        dishes: [
          { id: 2, name: "Plat", ingredients: [{ id: 3, foodId: "huile", quantity: 2, unit: "cuillereSoupe" }] },
        ],
      },
    ]);
  });

  it("ignore une unité inconnue et sans grams (entrée non exploitable)", () => {
    const raw = JSON.stringify([
      {
        id: 1,
        name: "Repas",
        dishes: [{ id: 2, name: "Plat", ingredients: [{ id: 3, foodId: "x", quantity: 5, unit: "kilogramme" }] }],
      },
    ]);
    expect(deserializeDay(raw)).toEqual([
      { id: 1, name: "Repas", dishes: [{ id: 2, name: "Plat", ingredients: [] }] },
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
    dishes: [{ name: "Tartines", ingredients: [{ foodId: "pain", quantity: 80, unit: "gramme" }] }],
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
            { foodId: "riz", quantity: 150, unit: "gramme" },
            { foodId: "poulet", quantity: 1, unit: "cuillereSoupe" },
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
    expect(dish.ingredients).toEqual([{ id: 2, foodId: "pain", quantity: 80, unit: "gramme" }]);
    expect(dish.id).toBe(1);
  });
});

describe("registre des aliments sélectionnés", () => {
  const food = {
    id: "usda-171477", name: "Poulet rôti", category: "Viandes, poissons, œufs" as const,
    kcalPer100g: 165, proteinPer100g: 31, lipidPer100g: 3.6, carbPer100g: 0,
    aaProfile: { histidine: 31, isoleucine: 52.8, leucine: 75, lysine: 84.9, sulfur: 40.5, aromatic: 73.4, threonine: 42.2, tryptophan: 11.7, valine: 49.6 },
    vegetarian: false, vegan: false, unprocessed: false, nameEn: "Chicken breast", fdcId: 171477,
  };

  it("sérialise puis désérialise sans perte (round-trip)", () => {
    const raw = serializeRegistry([food]);
    const back = deserializeRegistry(raw);
    expect(back).toHaveLength(1);
    expect(back[0]).toEqual(food);
  });

  it("écarte les entrées corrompues (macros absentes, catégorie inconnue)", () => {
    const raw = JSON.stringify([
      food,
      { id: "ko", name: "KO", category: "Inexistante", kcalPer100g: 1, proteinPer100g: 1, lipidPer100g: 0, carbPer100g: 0, vegetarian: true, vegan: true, unprocessed: true },
      { id: "ko2", name: "KO2", category: "Autres", proteinPer100g: 1, lipidPer100g: 0, carbPer100g: 0, vegetarian: true, vegan: true, unprocessed: true },
    ]);
    const back = deserializeRegistry(raw);
    expect(back.map((f) => f.id)).toEqual(["usda-171477"]);
  });

  it("tolère l'absence / le JSON invalide (→ [])", () => {
    expect(deserializeRegistry(null)).toEqual([]);
    expect(deserializeRegistry("{pas du json")).toEqual([]);
  });

  it("parseFood rejette un aaProfile incomplet mais garde l'aliment sans profil", () => {
    const raw = JSON.stringify([{ ...food, aaProfile: { leucine: 75 } }]);
    const back = deserializeRegistry(raw);
    expect(back).toHaveLength(1);
    expect(back[0].aaProfile).toBeUndefined();
  });
});
