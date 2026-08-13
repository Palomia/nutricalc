import { describe, expect, it } from "vitest";
import { KCAL_PER_G, macroTargets, type MacroTargets } from "./macros";
import type { Profile } from "./profile";

const profile = (weightKg = 80, sex: Profile["sex"] = "male"): Profile => ({
  sex,
  ageYears: 30,
  weightKg,
  heightCm: 180,
  activity: "moderate",
  goal: "active",
});

// Les découpages sont calculés sur le poids de référence : on l'aligne ici sur
// le poids du profil.
const breakdown = (weightKg = 80, sex: Profile["sex"] = "male", energy = 2500): MacroTargets =>
  macroTargets(profile(weightKg, sex), energy, weightKg);

const byName = <T extends { name: string }>(xs: T[]) =>
  Object.fromEntries(xs.map((x) => [x.name, x]));

describe("acides aminés indispensables", () => {
  it("il y en a 9", () => {
    expect(breakdown().aminoAcids).toHaveLength(9);
  });

  it("le besoin suit le poids de référence", () => {
    const aa = byName(breakdown(80).aminoAcids);
    expect(aa["Leucine"].mg).toBeCloseTo(3120, 6); // 39 mg/kg × 80 kg
    expect(aa["Tryptophane"].mg).toBeCloseTo(4 * 80, 6);
  });

  it("identiques entre sexes", () => {
    const men = breakdown(80, "male").aminoAcids.map((a) => a.mg);
    const women = breakdown(80, "female").aminoAcids.map((a) => a.mg);
    expect(men).toEqual(women);
  });
});

describe("acides gras", () => {
  it("7 entrées", () => {
    expect(breakdown().fattyAcids).toHaveLength(7);
  });

  it("les saturés sont une limite à 12 % AET", () => {
    const fa = byName(breakdown().fattyAcids);
    expect(fa["Acides gras saturés"].kind).toBe("limite");
    expect(fa["Acides gras saturés"].percentAet).toBe(12);
  });

  it("linoléique : grammes dérivés du % et de l'énergie", () => {
    const energy = 2500;
    const fa = byName(breakdown(80, "male", energy).fattyAcids);
    expect(fa["Acide linoléique (ω-6)"].grams).toBeCloseTo((4 / 100) * energy / KCAL_PER_G.lipid, 6);
  });

  it("EPA et DHA en mg absolus", () => {
    const fa = byName(breakdown().fattyAcids);
    expect(fa["EPA"].milligrams).toBe(250);
    expect(fa["DHA"].milligrams).toBe(250);
    expect(fa["EPA"].percentAet).toBeNull();
  });

  it("l'oléique est un intervalle 15-20 %", () => {
    const fa = byName(breakdown().fattyAcids);
    expect(fa["Acide oléique (AGMI, ω-9)"].percentAet).toBe(15);
    expect(fa["Acide oléique (AGMI, ω-9)"].percentAetMax).toBe(20);
  });
});

describe("glucides", () => {
  it("2 composantes", () => {
    expect(breakdown().carbComponents).toHaveLength(2);
  });

  it("fibres : AS à 30 g", () => {
    const c = byName(breakdown().carbComponents);
    expect(c["Fibres"].kind).toBe("AS");
    expect(c["Fibres"].grams).toBe(30);
  });

  it("sucres libres : dérivés de 10 % AET", () => {
    const energy = 2500;
    const c = byName(breakdown(80, "male", energy).carbComponents);
    expect(c["Sucres libres / ajoutés"].percentAet).toBe(10);
    expect(c["Sucres libres / ajoutés"].grams).toBeCloseTo((10 / 100) * energy / KCAL_PER_G.carb, 6);
  });
});
