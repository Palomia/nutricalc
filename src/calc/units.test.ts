import { describe, expect, it } from "vitest";
import { UNIT_GRAMS, UNITS, isUnit, toGrams, type Unit } from "./units";

describe("units — conversion en grammes", () => {
  it("le gramme est l'unité de référence (1 pour 1)", () => {
    expect(toGrams(100, "gramme")).toBe(100);
    expect(toGrams(0, "gramme")).toBe(0);
  });

  it("applique l'équivalent en grammes de chaque unité", () => {
    expect(toGrams(1, "cuillereCafe")).toBe(5);
    expect(toGrams(2, "cuillereSoupe")).toBe(30);
    expect(toGrams(1, "tasse")).toBe(240);
    expect(toGrams(1, "mug")).toBe(250);
    expect(toGrams(4, "pincee")).toBe(2);
    expect(toGrams(1, "verre")).toBe(200);
  });

  it("est linéaire en la quantité", () => {
    for (const u of UNITS) {
      expect(toGrams(3, u)).toBeCloseTo(3 * toGrams(1, u), 10);
    }
  });

  it("chaque unité listée possède un équivalent en grammes strictement positif", () => {
    for (const u of UNITS) expect(UNIT_GRAMS[u]).toBeGreaterThan(0);
  });
});

describe("units — garde-fou isUnit", () => {
  it("reconnaît les unités connues", () => {
    const valid: Unit[] = ["gramme", "cuillereSoupe", "mug"];
    for (const u of valid) expect(isUnit(u)).toBe(true);
  });

  it("rejette les valeurs inconnues ou non-chaînes", () => {
    expect(isUnit("kilogramme")).toBe(false);
    expect(isUnit("")).toBe(false);
    expect(isUnit(5)).toBe(false);
    expect(isUnit(null)).toBe(false);
    expect(isUnit(undefined)).toBe(false);
  });
});
