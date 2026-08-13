import { describe, expect, it } from "vitest";
import {
  FOODS,
  FOODS_BY_ID,
  FOOD_FAMILIARITIES,
  FOOD_FAMILIARITY_LABEL,
} from "./food";

describe("segmentation par familiarité", () => {
  it("chaque aliment a une familiarité faisant partie des niveaux connus", () => {
    for (const food of FOODS) {
      expect(FOOD_FAMILIARITIES).toContain(food.familiarity);
    }
  });

  it("les niveaux sont ordonnés du plus courant au plus rare, sans doublon", () => {
    expect(FOOD_FAMILIARITIES).toEqual(["classique", "moyen", "exotique"]);
    expect(new Set(FOOD_FAMILIARITIES).size).toBe(FOOD_FAMILIARITIES.length);
  });

  it("chaque niveau possède un libellé d'affichage non vide", () => {
    for (const level of FOOD_FAMILIARITIES) {
      expect(FOOD_FAMILIARITY_LABEL[level]).toBeTruthy();
    }
  });

  it("FOODS_BY_ID conserve la familiarité de chaque aliment", () => {
    for (const food of FOODS) {
      expect(FOODS_BY_ID[food.id].familiarity).toBe(food.familiarity);
    }
  });
});
