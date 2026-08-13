import { describe, expect, it } from "vitest";
import { micronutrientReferences } from "./micros";
import type { Profile } from "./profile";

const male: Profile = { sex: "male", ageYears: 30, weightKg: 80, targetWeightKg: 80, heightCm: 180, goal: "active" };
const female: Profile = { sex: "female", ageYears: 30, weightKg: 65, targetWeightKg: 65, heightCm: 165, goal: "active" };

const byName = (p: Profile) =>
  Object.fromEntries(micronutrientReferences(p).map((r) => [r.name, r]));

describe("micros", () => {
  it("renvoie l'ensemble des références", () => {
    expect(micronutrientReferences(male)).toHaveLength(18);
  });

  it("vitamine C partagée entre sexes", () => {
    expect(byName(female)["Vitamine C"].amount).toBe(110);
  });

  it("fer plus élevé pour les femmes", () => {
    expect(byName(female)["Fer"].amount).toBeGreaterThan(byName(male)["Fer"].amount);
  });

  it("les types sont valides", () => {
    const kinds = new Set(micronutrientReferences(male).map((r) => r.kind));
    for (const k of kinds) expect(["RNP", "AS"]).toContain(k);
  });
});
