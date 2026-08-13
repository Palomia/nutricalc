import { describe, expect, it } from "vitest";
import {
  NUTRITION_PROFILES,
  effectiveWeightKg,
  validateProfile,
  type Profile,
} from "./profile";

const base: Profile = { sex: "male", ageYears: 30, weightKg: 80, targetWeightKg: 80, heightCm: 180, goal: "active" };

describe("poids de référence = moyenne actuel/cible", () => {
  it("poids cible = poids actuel : poids de référence inchangé", () => {
    expect(effectiveWeightKg({ ...base, weightKg: 80, targetWeightKg: 80 })).toBe(80);
  });

  it("objectif de perte : moyenne entre actuel et cible", () => {
    // 90 kg actuel, 80 kg cible → référence 85 kg
    expect(effectiveWeightKg({ ...base, weightKg: 90, targetWeightKg: 80 })).toBe(85);
  });

  it("objectif de prise de masse : la moyenne dépasse le poids actuel", () => {
    // 70 kg actuel, 80 kg cible → référence 75 kg
    expect(effectiveWeightKg({ ...base, weightKg: 70, targetWeightKg: 80 })).toBe(75);
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

  it("chaque objectif porte un facteur d'activité pour le TDEE", () => {
    for (const np of Object.values(NUTRITION_PROFILES))
      expect(np.activityFactor).toBeGreaterThanOrEqual(1);
    // Le sédentaire a le facteur le plus bas.
    const factors = Object.values(NUTRITION_PROFILES).map((np) => np.activityFactor);
    expect(NUTRITION_PROFILES.sedentary.activityFactor).toBe(Math.min(...factors));
  });

  it("le facteur sportif AAE croît avec l'intensité (temp.txt §7)", () => {
    expect(NUTRITION_PROFILES.sedentary.aaeFactor).toBe(1.0);
    expect(NUTRITION_PROFILES.active.aaeFactor).toBe(1.2);
    expect(NUTRITION_PROFILES.endurance.aaeFactor).toBe(1.3);
    expect(NUTRITION_PROFILES.strengthMaintenance.aaeFactor).toBe(1.5);
    expect(NUTRITION_PROFILES.muscleGain.aaeFactor).toBe(1.8);
    expect(NUTRITION_PROFILES.aggressiveCut.aaeFactor).toBe(2.0);
    // Chaque facteur est ≥ 1 (jamais en dessous du minimum santé OMS).
    for (const np of Object.values(NUTRITION_PROFILES))
      expect(np.aaeFactor).toBeGreaterThanOrEqual(1.0);
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
