import { describe, expect, it } from "vitest";
import {
  dayMacros,
  dishMacros,
  ingredientMacros,
  kcalFromMacros,
  type Day,
} from "./intake";
import type { Food } from "./food";

// Aliments synthétiques aux valeurs rondes pour des assertions exactes.
const rice: Food = {
  id: "riz-test", name: "Riz test", category: "Féculents & pains",
  kcalPer100g: 100, proteinPer100g: 2, lipidPer100g: 1, carbPer100g: 20,
  vegetarian: true, vegan: true, unprocessed: true,
};
const chicken: Food = {
  id: "poulet-test", name: "Poulet test", category: "Viandes, poissons, œufs",
  kcalPer100g: 120, proteinPer100g: 30, lipidPer100g: 2, carbPer100g: 0,
  vegetarian: false, vegan: false, unprocessed: true,
};

describe("intake", () => {
  it("un ingrédient applique la règle de trois sur la quantité", () => {
    const m = ingredientMacros({ food: rice, grams: 200 });
    expect(m.kcal).toBe(200);
    expect(m.proteinG).toBe(4);
    expect(m.lipidG).toBe(2);
    expect(m.carbG).toBe(40);
  });

  it("un plat somme ses ingrédients", () => {
    const m = dishMacros({
      name: "Riz + poulet",
      ingredients: [
        { food: rice, grams: 150 },
        { food: chicken, grams: 100 },
      ],
    });
    expect(m.kcal).toBeCloseTo(150 + 120, 6);
    expect(m.proteinG).toBeCloseTo(3 + 30, 6);
    expect(m.carbG).toBeCloseTo(30 + 0, 6);
  });

  it("un repas somme ses plats et une journée somme ses repas", () => {
    const day: Day = {
      meals: [
        { name: "Déjeuner", dishes: [{ name: "Bol", ingredients: [{ food: rice, grams: 100 }] }] },
        { name: "Dîner", dishes: [{ name: "Assiette", ingredients: [{ food: chicken, grams: 100 }] }] },
      ],
    };
    const m = dayMacros(day);
    expect(m.kcal).toBeCloseTo(100 + 120, 6);
    expect(m.proteinG).toBeCloseTo(2 + 30, 6);
  });

  it("une journée vide donne des macros nulles", () => {
    expect(dayMacros({ meals: [] })).toEqual({ proteinG: 0, lipidG: 0, carbG: 0, kcal: 0 });
  });

  it("kcalFromMacros applique 4/9/4", () => {
    expect(kcalFromMacros({ proteinG: 10, lipidG: 5, carbG: 20, kcal: 0 }))
      .toBeCloseTo(10 * 4 + 5 * 9 + 20 * 4, 6);
  });
});
