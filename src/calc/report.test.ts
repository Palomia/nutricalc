import { describe, expect, it } from "vitest";
import { dailyReport } from "./report";
import type { Profile } from "./profile";

const p: Profile = { sex: "female", ageYears: 35, weightKg: 65, heightCm: 168, activity: "moderate", goal: "active" };

describe("report", () => {
  it("assemble énergie, macros et micros", () => {
    const r = dailyReport(p);
    expect(r.energyKcal).toBeGreaterThan(r.bmrKcal);
    expect(r.energyKcal).toBe(r.energy.energyKcal);
    expect(r.micros).toHaveLength(18);
    expect(r.macros.protein.grams).toBeGreaterThan(0);
  });

  it("poids normal : macros calculées sur le poids réel", () => {
    const r = dailyReport(p);
    expect(r.weightAdjusted).toBe(false);
    expect(r.effectiveWeightKg).toBeCloseTo(p.weightKg, 6);
  });

  it("obésité : poids ajusté inférieur au poids réel", () => {
    const obese = dailyReport({ ...p, weightKg: 120, heightCm: 165 });
    expect(obese.bmi).toBeGreaterThanOrEqual(30);
    expect(obese.weightAdjusted).toBe(true);
    expect(obese.effectiveWeightKg).toBeLessThan(120);
  });

  it("rejette un profil non adulte", () => {
    expect(() => dailyReport({ ...p, ageYears: 10 })).toThrow();
  });
});
