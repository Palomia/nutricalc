import { describe, expect, it } from "vitest";
import { dailyReport } from "./report";
import type { Profile } from "./profile";

const p: Profile = { sex: "female", ageYears: 35, weightKg: 65, targetWeightKg: 65, heightCm: 168, goal: "active" };

describe("report", () => {
  it("assemble énergie, macros et micros", () => {
    const r = dailyReport(p);
    expect(r.energyKcal).toBeGreaterThan(r.bmrKcal);
    expect(r.energyKcal).toBe(r.energy.energyKcal);
    expect(r.micros).toHaveLength(18);
    expect(r.macros.protein.grams).toBeGreaterThan(0);
  });

  it("poids cible = poids actuel : macros sur le poids actuel", () => {
    const r = dailyReport(p);
    expect(r.weightAdjusted).toBe(false);
    expect(r.effectiveWeightKg).toBeCloseTo(p.weightKg, 6);
  });

  it("poids cible différent : poids de référence = moyenne actuel/cible", () => {
    const cut = dailyReport({ ...p, weightKg: 80, targetWeightKg: 70 });
    expect(cut.weightAdjusted).toBe(true);
    expect(cut.effectiveWeightKg).toBeCloseTo(75, 6);
  });

  it("rejette un profil non adulte", () => {
    expect(() => dailyReport({ ...p, ageYears: 10 })).toThrow();
  });
});
