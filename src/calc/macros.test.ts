import { describe, expect, it } from "vitest";
import { KCAL_PER_G, PROTEIN_G_PER_KG, macroTargets } from "./macros";
import type { Profile } from "./profile";

const p: Profile = { sex: "male", ageYears: 30, weightKg: 80, heightCm: 180, activity: "moderate" };

describe("macros", () => {
  it("les protéines suivent le poids corporel", () => {
    expect(macroTargets(p, 2500).protein.grams).toBeCloseTo(PROTEIN_G_PER_KG * 80, 6);
  });

  it("l'énergie est entièrement répartie", () => {
    const t = macroTargets(p, 2500);
    expect(t.protein.kcal + t.lipid.kcal + t.carb.kcal).toBeCloseTo(2500, 5);
  });

  it("les pourcentages somment à 1", () => {
    const t = macroTargets(p, 2500);
    expect(t.protein.percentAet + t.lipid.percentAet + t.carb.percentAet).toBeCloseTo(1, 6);
  });

  it("les lipides valent 37,5 % de l'énergie", () => {
    expect(macroTargets(p, 2000).lipid.percentAet).toBeCloseTo(0.375, 6);
  });

  it("grammes cohérents avec la conversion kcal", () => {
    const t = macroTargets(p, 2500);
    expect(t.carb.kcal).toBeCloseTo(t.carb.grams * KCAL_PER_G.carb, 5);
  });

  it("rejette une énergie non positive", () => {
    expect(() => macroTargets(p, 0)).toThrow();
  });
});
