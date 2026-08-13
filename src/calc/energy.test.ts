import { describe, expect, it } from "vitest";
import { bmrMifflinStJeor, tdee } from "./energy";
import { ACTIVITY_LEVELS, type Profile } from "./profile";

const male: Profile = { sex: "male", ageYears: 30, weightKg: 80, heightCm: 180, activity: "moderate" };
const female: Profile = { sex: "female", ageYears: 30, weightKg: 65, heightCm: 165, activity: "moderate" };

describe("energy", () => {
  it("BMR homme (valeur de référence)", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(bmrMifflinStJeor(male)).toBe(1780);
  });

  it("BMR femme (valeur de référence)", () => {
    // 10*65 + 6.25*165 - 5*30 - 161 = 1370.25
    expect(bmrMifflinStJeor(female)).toBeCloseTo(1370.25, 5);
  });

  it("homme > femme, tout égal par ailleurs", () => {
    const common = { ageYears: 40, weightKg: 70, heightCm: 170, activity: "moderate" } as const;
    expect(bmrMifflinStJeor({ sex: "male", ...common })).toBeGreaterThan(
      bmrMifflinStJeor({ sex: "female", ...common }),
    );
  });

  it("TDEE applique le facteur d'activité", () => {
    expect(tdee(male)).toBeCloseTo(1780 * 1.55, 5);
  });

  it("TDEE croît avec le niveau d'activité", () => {
    const levels = Object.keys(ACTIVITY_LEVELS) as (keyof typeof ACTIVITY_LEVELS)[];
    const values = levels.map((activity) => tdee({ ...female, activity }));
    const sorted = [...values].sort((a, b) => a - b);
    expect(values).toEqual(sorted);
  });
});
