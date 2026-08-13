import { describe, expect, it } from "vitest";
import {
  COOKING_FAT_GRAMS,
  COOKING_METHODS,
  cookingIngredients,
  VINAIGRETTE,
  type ComboIngredient,
} from "./cooking";
import { FOODS_BY_ID } from "./food";

// Vérifie que chaque foodId d'un combo existe bien dans la base d'aliments.
const foodIdsExist = (items: ComboIngredient[]) =>
  items.every((i) => FOODS_BY_ID[i.foodId] !== undefined);

describe("cooking — matières grasses de cuisson (#10)", () => {
  it("beurre : ajoute un ingrédient beurre à la quantité par défaut", () => {
    expect(cookingIngredients("beurre")).toEqual([
      { foodId: "beurre", grams: COOKING_FAT_GRAMS },
    ]);
  });

  it("huile d'olive : ajoute un ingrédient huile-olive à la quantité par défaut", () => {
    expect(cookingIngredients("huile-olive")).toEqual([
      { foodId: "huile-olive", grams: COOKING_FAT_GRAMS },
    ]);
  });

  it("à sec : n'ajoute aucun ingrédient", () => {
    expect(cookingIngredients("sec")).toEqual([]);
  });

  it("toutes les cuissons référencent des aliments existants", () => {
    for (const { method } of COOKING_METHODS) {
      expect(foodIdsExist(cookingIngredients(method)), method).toBe(true);
    }
  });

  it("les grammes des matières grasses sont strictement positifs", () => {
    for (const method of ["beurre", "huile-olive"] as const) {
      for (const i of cookingIngredients(method)) expect(i.grams).toBeGreaterThan(0);
    }
  });
});

describe("cooking — vinaigrette (#11)", () => {
  it("combine huile d'olive, vinaigre et moutarde", () => {
    expect(VINAIGRETTE.map((i) => i.foodId)).toEqual([
      "huile-olive",
      "vinaigre",
      "moutarde",
    ]);
  });

  it("tous les foodId de la vinaigrette existent dans FOODS_BY_ID", () => {
    expect(foodIdsExist(VINAIGRETTE)).toBe(true);
  });

  it("toutes les quantités sont strictement positives", () => {
    for (const i of VINAIGRETTE) expect(i.grams).toBeGreaterThan(0);
  });
});
