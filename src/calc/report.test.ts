import { describe, expect, it } from "vitest";
import { dailyReport } from "./report";
import type { Profile } from "./profile";

const p: Profile = { sex: "female", ageYears: 35, weightKg: 65, heightCm: 168, activity: "moderate" };

describe("report", () => {
  it("assemble énergie, macros et micros", () => {
    const r = dailyReport(p);
    expect(r.energyKcal).toBeGreaterThan(r.bmrKcal);
    expect(r.micros).toHaveLength(18);
    expect(r.macros.protein.grams).toBeGreaterThan(0);
  });

  it("rejette un profil non adulte", () => {
    expect(() => dailyReport({ ...p, ageYears: 10 })).toThrow();
  });
});
