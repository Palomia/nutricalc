import { describe, expect, it } from "vitest";
import { KCAL_PER_G, macroTargets } from "./macros";
import { NUTRITION_PROFILES, type Profile } from "./profile";

const p: Profile = { sex: "male", ageYears: 30, weightKg: 80, targetWeightKg: 80, heightCm: 180, goal: "active" };

describe("macros", () => {
  it("les protéines suivent le ratio du profil et le poids de référence", () => {
    const ratio = NUTRITION_PROFILES.active.proteinGPerKg.target;
    expect(macroTargets(p, 2500, 80).protein.grams).toBeCloseTo(ratio * 80, 6);
  });

  it("les lipides suivent le ratio du profil", () => {
    const ratio = NUTRITION_PROFILES.active.fatGPerKg.target;
    expect(macroTargets(p, 2500, 80).lipid.grams).toBeCloseTo(ratio * 80, 6);
  });

  it("les glucides absorbent le reste des calories", () => {
    const t = macroTargets(p, 2500, 80);
    const expected = (2500 - t.protein.kcal - t.lipid.kcal) / KCAL_PER_G.carb;
    expect(t.carb.grams).toBeCloseTo(expected, 6);
  });

  it("l'énergie est entièrement répartie", () => {
    const t = macroTargets(p, 2500, 80);
    expect(t.protein.kcal + t.lipid.kcal + t.carb.kcal).toBeCloseTo(2500, 5);
  });

  it("les pourcentages somment à 1", () => {
    const t = macroTargets(p, 2500, 80);
    expect(t.protein.percentAet + t.lipid.percentAet + t.carb.percentAet).toBeCloseTo(1, 6);
  });

  it("expose la fourchette g/kg des protéines", () => {
    const t = macroTargets(p, 2500, 80);
    expect(t.protein.gramsMin).toBeCloseTo(NUTRITION_PROFILES.active.proteinGPerKg.min * 80, 6);
    expect(t.protein.gramsMax).toBeCloseTo(NUTRITION_PROFILES.active.proteinGPerKg.max * 80, 6);
    expect(t.protein.gPerKg).toBe(NUTRITION_PROFILES.active.proteinGPerKg.target);
  });

  it("glucides « reste des calories » : pas de fourchette g/kg", () => {
    const t = macroTargets({ ...p, goal: "fatLoss" }, 2000, 80);
    expect(t.carb.gramsMin).toBeNull();
    expect(t.carb.gPerKg).toBeNull();
  });

  it("un objectif plus protéiné augmente les protéines", () => {
    const active = macroTargets({ ...p, goal: "active" }, 2500, 80).protein.grams;
    const cut = macroTargets({ ...p, goal: "aggressiveCut" }, 2500, 80).protein.grams;
    expect(cut).toBeGreaterThan(active);
  });

  it("le poids de référence pilote les grammes", () => {
    const full = macroTargets(p, 2500, 100).protein.grams;
    const adjusted = macroTargets(p, 2500, 80).protein.grams;
    expect(full).toBeGreaterThan(adjusted);
  });

  it("rejette une énergie non positive", () => {
    expect(() => macroTargets(p, 0, 80)).toThrow();
  });

  it("rejette un poids de référence non positif", () => {
    expect(() => macroTargets(p, 2500, 0)).toThrow();
  });
});
