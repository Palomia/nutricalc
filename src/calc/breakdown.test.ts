import { describe, expect, it } from "vitest";
import { KCAL_PER_G, macroTargets } from "./macros";
import type { Profile } from "./profile";

const profile = (weightKg = 80, sex: Profile["sex"] = "male"): Profile => ({
  sex,
  ageYears: 30,
  weightKg,
  heightCm: 180,
  activity: "moderate",
});

const byName = <T extends { name: string }>(xs: T[]) =>
  Object.fromEntries(xs.map((x) => [x.name, x]));

describe("acides aminés indispensables", () => {
  it("il y en a 9", () => {
    expect(macroTargets(profile(), 2500).aminoAcids).toHaveLength(9);
  });

  it("le besoin suit le poids corporel", () => {
    const aa = byName(macroTargets(profile(80), 2500).aminoAcids);
    expect(aa["Leucine"].mg).toBeCloseTo(3120, 6); // 39 mg/kg × 80 kg
    expect(aa["Tryptophane"].mg).toBeCloseTo(4 * 80, 6);
  });

  it("identiques entre sexes", () => {
    const men = macroTargets(profile(80, "male"), 2500).aminoAcids.map((a) => a.mg);
    const women = macroTargets(profile(80, "female"), 2500).aminoAcids.map((a) => a.mg);
    expect(men).toEqual(women);
  });
});

describe("acides gras", () => {
  it("7 entrées", () => {
    expect(macroTargets(profile(), 2500).fattyAcids).toHaveLength(7);
  });

  it("les saturés sont une limite à 12 % AET", () => {
    const fa = byName(macroTargets(profile(), 2500).fattyAcids);
    expect(fa["Acides gras saturés"].kind).toBe("limite");
    expect(fa["Acides gras saturés"].percentAet).toBe(12);
  });

  it("linoléique : grammes dérivés du % et de l'énergie", () => {
    const energy = 2500;
    const fa = byName(macroTargets(profile(), energy).fattyAcids);
    expect(fa["Acide linoléique (ω-6)"].grams).toBeCloseTo((4 / 100) * energy / KCAL_PER_G.lipid, 6);
  });

  it("EPA et DHA en mg absolus", () => {
    const fa = byName(macroTargets(profile(), 2500).fattyAcids);
    expect(fa["EPA"].milligrams).toBe(250);
    expect(fa["DHA"].milligrams).toBe(250);
    expect(fa["EPA"].percentAet).toBeNull();
  });

  it("l'oléique est un intervalle 15-20 %", () => {
    const fa = byName(macroTargets(profile(), 2500).fattyAcids);
    expect(fa["Acide oléique (AGMI, ω-9)"].percentAet).toBe(15);
    expect(fa["Acide oléique (AGMI, ω-9)"].percentAetMax).toBe(20);
  });
});

describe("glucides", () => {
  it("3 composantes", () => {
    expect(macroTargets(profile(), 2500).carbComponents).toHaveLength(3);
  });

  it("fibres : AS à 30 g", () => {
    const c = byName(macroTargets(profile(), 2500).carbComponents);
    expect(c["Fibres"].kind).toBe("AS");
    expect(c["Fibres"].grams).toBe(30);
  });

  it("sucres totaux : limite à 100 g", () => {
    const c = byName(macroTargets(profile(), 2500).carbComponents);
    expect(c["Sucres (hors lactose et galactose)"].kind).toBe("limite");
    expect(c["Sucres (hors lactose et galactose)"].grams).toBe(100);
  });

  it("sucres libres : dérivés de 10 % AET", () => {
    const energy = 2500;
    const c = byName(macroTargets(profile(), energy).carbComponents);
    expect(c["Sucres libres / ajoutés"].percentAet).toBe(10);
    expect(c["Sucres libres / ajoutés"].grams).toBeCloseTo((10 / 100) * energy / KCAL_PER_G.carb, 6);
  });
});
