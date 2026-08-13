import { describe, expect, it } from "vitest";
import { FOODS_BY_ID } from "./food";
import { buildPresetDay, PRESET_DAY } from "./presetDay";

describe("presetDay — modèle de la journée type", () => {
  it("comporte les 5 prises attendues, dans l'ordre", () => {
    expect(PRESET_DAY.map((m) => m.name)).toEqual([
      "Petit-déjeuner",
      "Déjeuner",
      "En-cas",
      "Dîner",
    ]);
  });

  it("Déjeuner et Dîner sont structurés en entrée / plat / dessert", () => {
    const byName = Object.fromEntries(PRESET_DAY.map((m) => [m.name, m]));
    for (const name of ["Déjeuner", "Dîner"]) {
      expect(byName[name].dishes.map((d) => d.name)).toEqual([
        "Entrée",
        "Plat",
        "Dessert",
      ]);
    }
  });

  it("Petit-déjeuner et En-cas se résument à un plat simple", () => {
    const byName = Object.fromEntries(PRESET_DAY.map((m) => [m.name, m]));
    expect(byName["Petit-déjeuner"].dishes).toHaveLength(1);
    expect(byName["En-cas"].dishes).toHaveLength(1);
  });

  it("ne référence que des aliments réels de la base", () => {
    for (const meal of PRESET_DAY) {
      for (const dish of meal.dishes) {
        for (const ing of dish.ingredients) {
          expect(FOODS_BY_ID[ing.foodId], `foodId inconnu : ${ing.foodId}`).toBeDefined();
          expect(ing.grams).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("presetDay — builder éditable", () => {
  it("reproduit fidèlement la structure repas → plats → ingrédients", () => {
    let counter = 1;
    const meals = buildPresetDay(() => counter++);
    expect(meals).toHaveLength(PRESET_DAY.length);
    meals.forEach((meal, mi) => {
      expect(meal.name).toBe(PRESET_DAY[mi].name);
      expect(meal.dishes).toHaveLength(PRESET_DAY[mi].dishes.length);
      meal.dishes.forEach((dish, di) => {
        const src = PRESET_DAY[mi].dishes[di];
        expect(dish.name).toBe(src.name);
        expect(dish.ingredients.map((i) => ({ foodId: i.foodId, grams: i.grams }))).toEqual(
          src.ingredients,
        );
      });
    });
  });

  it("attribue des ids frais et uniques via l'allocateur fourni", () => {
    let counter = 42;
    const meals = buildPresetDay(() => counter++);
    const ids: number[] = [];
    for (const m of meals) {
      ids.push(m.id);
      for (const d of m.dishes) {
        ids.push(d.id);
        for (const i of d.ingredients) ids.push(i.id);
      }
    }
    expect(new Set(ids).size).toBe(ids.length); // tous distincts
    expect(Math.min(...ids)).toBeGreaterThanOrEqual(42);
  });
});
