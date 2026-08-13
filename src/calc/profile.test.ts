import { describe, expect, it } from "vitest";
import {
  NUTRITION_PROFILES,
  bmi,
  effectiveWeightKg,
  idealBodyWeightKg,
  validateProfile,
  type Profile,
} from "./profile";

const base: Profile = { sex: "male", ageYears: 30, weightKg: 80, heightCm: 180, activity: "moderate", goal: "active" };

describe("poids de référence selon l'IMC", () => {
  it("IMC < 25 : poids réel conservé", () => {
    const p = { ...base, weightKg: 75, heightCm: 180 }; // IMC ≈ 23,1
    expect(bmi(p)).toBeLessThan(25);
    expect(effectiveWeightKg(p)).toBe(75);
  });

  it("surpoids (25 ≤ IMC < 30) : poids idéal + 25 % de l'excès", () => {
    const p = { ...base, weightKg: 90, heightCm: 180 }; // IMC ≈ 27,8
    const ideal = idealBodyWeightKg("male", 180);
    const expected = ideal + 0.25 * (90 - ideal);
    expect(bmi(p)).toBeGreaterThanOrEqual(25);
    expect(bmi(p)).toBeLessThan(30);
    expect(effectiveWeightKg(p)).toBeCloseTo(expected, 6);
  });

  it("obésité (IMC ≥ 30) : poids idéal + 40 % de l'excès", () => {
    const p = { ...base, weightKg: 110, heightCm: 180 }; // IMC ≈ 34
    const ideal = idealBodyWeightKg("male", 180);
    const expected = ideal + 0.4 * (110 - ideal);
    expect(bmi(p)).toBeGreaterThanOrEqual(30);
    expect(effectiveWeightKg(p)).toBeCloseTo(expected, 6);
  });

  it("le poids ajusté reste inférieur au poids réel en surpoids", () => {
    const p = { ...base, weightKg: 110, heightCm: 180 };
    expect(effectiveWeightKg(p)).toBeLessThan(p.weightKg);
  });
});

describe("profils nutritionnels", () => {
  it("chaque profil a des fourchettes ordonnées (min ≤ cible ≤ max)", () => {
    for (const np of Object.values(NUTRITION_PROFILES)) {
      for (const r of [np.proteinGPerKg, np.fatGPerKg, np.adjustmentKcal]) {
        expect(r.min).toBeLessThanOrEqual(r.target);
        expect(r.target).toBeLessThanOrEqual(r.max);
      }
      if (np.carbGPerKg) {
        expect(np.carbGPerKg.min).toBeLessThanOrEqual(np.carbGPerKg.target);
        expect(np.carbGPerKg.target).toBeLessThanOrEqual(np.carbGPerKg.max);
      }
    }
  });

  it("les objectifs de surplus/déficit ont le bon signe d'ajustement", () => {
    expect(NUTRITION_PROFILES.muscleGain.adjustmentKcal.target).toBeGreaterThan(0);
    expect(NUTRITION_PROFILES.fatLoss.adjustmentKcal.target).toBeLessThan(0);
    expect(NUTRITION_PROFILES.sedentary.adjustmentKcal.target).toBe(0);
  });
});

describe("validateProfile", () => {
  it("accepte un profil adulte valide", () => {
    expect(() => validateProfile(base)).not.toThrow();
  });

  it("rejette un âge hors bornes", () => {
    expect(() => validateProfile({ ...base, ageYears: 5 })).toThrow();
  });
});
