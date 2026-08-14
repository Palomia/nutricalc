import { describe, expect, it } from "vitest";
import {
  analyzeMuscleProfile,
  dayAminoAcids,
  ingredientAminoAcids,
  leucineLevel,
  limitingAminoAcid,
  aminoAcidCoverage,
  proteinDistribution,
  type MuscleTargets,
} from "./aminoAcids";
import { AMINO_ACID_PROFILES, type Food } from "./food";
import { aminoAcidTargets } from "./macros";
import type { Day } from "./intake";

// Aliments synthétiques rattachés à des profils d'AAE réels.
const chicken: Food = {
  id: "poulet", name: "Poulet", category: "Viandes, poissons, œufs",
  kcalPer100g: 137, proteinPer100g: 30, lipidPer100g: 2, carbPer100g: 0,
  aaProfile: "meat",
  vegetarian: false, vegan: false, unprocessed: true,
};
const rice: Food = {
  id: "riz", name: "Riz", category: "Féculents & pains",
  kcalPer100g: 143, proteinPer100g: 2.9, lipidPer100g: 0.4, carbPer100g: 32,
  aaProfile: "cereal",
  vegetarian: true, vegan: true, unprocessed: true,
};
const apple: Food = {
  id: "pomme", name: "Pomme", category: "Fruits & légumes",
  kcalPer100g: 52, proteinPer100g: 0.3, lipidPer100g: 0.3, carbPer100g: 11.6,
  vegetarian: true, vegan: true, unprocessed: true,
};
// Source protéique végétale à teneur comparable au poulet, pour vérifier
// l'absence de prime à l'origine animale (même quantité → même traitement).
const tofu: Food = {
  id: "tofu", name: "Tofu", category: "Féculents & pains",
  kcalPer100g: 145, proteinPer100g: 30, lipidPer100g: 8, carbPer100g: 2,
  aaProfile: "soy",
  vegetarian: true, vegan: true, unprocessed: true,
};

const dishOf = (food: Food, grams: number) => ({
  name: food.name,
  ingredients: [{ food, grams }],
});

describe("apport en acides aminés", () => {
  it("dérive les mg d'AAE du profil × grammes de protéines", () => {
    // 100 g de poulet → 30 g de protéines ; leucine = 80 mg/g × 30 g = 2400 mg.
    const aa = ingredientAminoAcids({ food: chicken, grams: 100 });
    expect(aa.leucine).toBeCloseTo(AMINO_ACID_PROFILES.meat.leucine * 30, 6);
  });

  it("un aliment sans profil (protéines négligeables) n'apporte pas d'AAE", () => {
    const aa = ingredientAminoAcids({ food: apple, grams: 200 });
    expect(aa.leucine).toBe(0);
    expect(aa.lysine).toBe(0);
  });

  it("la journée somme les repas", () => {
    const day: Day = {
      meals: [
        { name: "Déjeuner", dishes: [dishOf(chicken, 100)] },
        { name: "Dîner", dishes: [dishOf(chicken, 50)] },
      ],
    };
    expect(dayAminoAcids(day).leucine).toBeCloseTo(
      AMINO_ACID_PROFILES.meat.leucine * (30 + 15),
      6,
    );
  });
});

describe("acide aminé limitant (§8)", () => {
  it("un régime tout céréales est limité par la lysine", () => {
    const day: Day = { meals: [{ name: "Repas", dishes: [dishOf(rice, 1000)] }] };
    const targets = aminoAcidTargets(70, 1.8); // prise de masse, 70 kg
    const cov = aminoAcidCoverage(dayAminoAcids(day), targets);
    const limiting = limitingAminoAcid(cov);
    expect(limiting?.key).toBe("lysine");
  });

  it("sans protéine analysable, pas d'acide aminé limitant", () => {
    const day: Day = { meals: [{ name: "Repas", dishes: [dishOf(apple, 300)] }] };
    const cov = aminoAcidCoverage(dayAminoAcids(day), aminoAcidTargets(70, 1));
    expect(limitingAminoAcid(cov)).toBeNull();
  });
});

describe("leucine par repas (§9)", () => {
  it("classe selon les seuils 2 / 2,5 / 3 g", () => {
    expect(leucineLevel(1.5)).toBe("faible");
    expect(leucineLevel(2.2)).toBe("min");
    expect(leucineLevel(2.7)).toBe("optimal");
    expect(leucineLevel(3.5)).toBe("excellent");
  });
});

describe("distribution des protéines (§10)", () => {
  it("compte les pics anaboliques et accorde le bonus à 3-5 prises", () => {
    const meal = (n: string) => ({ name: n, dishes: [dishOf(chicken, 120)] }); // ~36 g prot
    const day: Day = { meals: [meal("PDJ"), meal("Déj"), meal("Dîner")] };
    const dist = proteinDistribution(day);
    expect(dist.peaks).toBe(3);
    expect(dist.bonus).toBe(true);
    expect(dist.meals.every((m) => m.isAnabolicPeak)).toBe(true);
  });

  it("pas de bonus avec un seul gros repas", () => {
    const day: Day = { meals: [{ name: "Unique", dishes: [dishOf(chicken, 300)] }] };
    const dist = proteinDistribution(day);
    expect(dist.peaks).toBe(1);
    expect(dist.bonus).toBe(false);
  });
});

describe("pas de prime à l'origine animale (§10)", () => {
  it("à protéines totales égales, animal et végétal donnent le même pic anabolique", () => {
    // 100 g de poulet et 100 g de tofu → 30 g de protéines chacun.
    const animal: Day = { meals: [{ name: "R", dishes: [dishOf(chicken, 100)] }] };
    const plant: Day = { meals: [{ name: "R", dishes: [dishOf(tofu, 100)] }] };
    const da = proteinDistribution(animal);
    const dp = proteinDistribution(plant);
    expect(da.meals[0].totalProteinG).toBeCloseTo(dp.meals[0].totalProteinG, 6);
    expect(dp.meals[0].isAnabolicPeak).toBe(da.meals[0].isAnabolicPeak);
    expect(dp.meals[0].isAnabolicPeak).toBe(true);
    expect(dp.peaks).toBe(da.peaks);
  });

  it("le pic anabolique se déclenche au seuil de protéines TOTALES (25 g)", () => {
    const under: Day = { meals: [{ name: "R", dishes: [dishOf(tofu, 80)] }] }; // 24 g
    const over: Day = { meals: [{ name: "R", dishes: [dishOf(tofu, 90)] }] }; // 27 g
    expect(proteinDistribution(under).meals[0].isAnabolicPeak).toBe(false);
    expect(proteinDistribution(over).meals[0].isAnabolicPeak).toBe(true);
  });
});

describe("sous-score leucine : nombre de prises au seuil (§9)", () => {
  // ~110 g de poulet → 33 g de protéines → 33 × 80 mg = 2,64 g de leucine (≥ 2,5 g).
  const bigMeal = (n: string) => ({ name: n, dishes: [dishOf(chicken, 110)] });
  // ~50 g de poulet → 15 g de protéines → 1,2 g de leucine (< 2,5 g).
  const smallMeal = (n: string) => ({ name: n, dishes: [dishOf(chicken, 50)] });
  const targetsWith = (proteinTargetG: number): MuscleTargets => ({
    aminoAcids: aminoAcidTargets(70, 1.8),
    proteinTargetG,
    energyTargetKcal: 2500,
  });

  it("5 prises sur 6 au seuil scorent PLUS qu'une seule prise au seuil", () => {
    // Cœur de la correction : c'est le NOMBRE de prises au seuil qui compte,
    // pas la proportion (une moyenne de ratios ferait l'inverse).
    const one: Day = { meals: [bigMeal("Unique")] };
    const five: Day = {
      meals: [
        bigMeal("R1"), bigMeal("R2"), bigMeal("R3"),
        bigMeal("R4"), bigMeal("R5"), smallMeal("R6"),
      ],
    };
    const t = targetsWith(140); // N = round(140 / 35) = 4
    const sOne = analyzeMuscleProfile(one, t).score.leucineScore;
    const sFive = analyzeMuscleProfile(five, t).score.leucineScore;
    expect(sFive).toBeGreaterThan(sOne);
    expect(sOne).toBeCloseTo(1 / 4, 6); // 1 prise au seuil / N=4
    expect(sFive).toBe(1); // 5 prises au seuil / N=4 → plafonné à 100 %
  });

  it("la cible N de prises dérive du besoin protéique, bornée à [3, 5]", () => {
    // 3 prises au seuil dans tous les cas ; seul N (donc le score) change.
    const day: Day = { meals: [bigMeal("R1"), bigMeal("R2"), bigMeal("R3")] };
    const score = (proteinTargetG: number) =>
      analyzeMuscleProfile(day, targetsWith(proteinTargetG)).score.leucineScore;
    expect(score(110)).toBeCloseTo(3 / 3, 6); // round(110/35)=3 → N=3
    expect(score(175)).toBeCloseTo(3 / 5, 6); // round(175/35)=5 → N=5
    expect(score(70)).toBeCloseTo(3 / 3, 6); // round=2 → borné au plancher 3
    expect(score(250)).toBeCloseTo(3 / 5, 6); // round=7 → borné au plafond 5
  });
});

describe("score de construction musculaire (§12)", () => {
  const targets = (): MuscleTargets => ({
    aminoAcids: aminoAcidTargets(70, 1.8),
    proteinTargetG: 140,
    energyTargetKcal: 2500,
  });

  it("journée vide → score nul, bande limitante", () => {
    const a = analyzeMuscleProfile({ meals: [] }, targets());
    expect(a.score.total).toBe(0);
    expect(a.score.band).toBe("limitant");
    expect(a.limiting).toBeNull();
  });

  it("une bonne journée protéinée et bien répartie obtient un score élevé", () => {
    const meal = (n: string) => ({
      name: n,
      dishes: [dishOf(chicken, 160), dishOf(rice, 150)],
    });
    const day: Day = { meals: [meal("PDJ"), meal("Déj"), meal("Dîner")] };
    const a = analyzeMuscleProfile(day, targets());
    expect(a.score.total).toBeGreaterThan(75);
    expect(a.score.proteinScore).toBeCloseTo(1, 6); // protéines saturées
    expect(a.distribution.peaks).toBeGreaterThanOrEqual(3);
  });

  it("le score reste dans [0, 100]", () => {
    const day: Day = { meals: [{ name: "R", dishes: [dishOf(chicken, 1000)] }] };
    const a = analyzeMuscleProfile(day, targets());
    expect(a.score.total).toBeGreaterThanOrEqual(0);
    expect(a.score.total).toBeLessThanOrEqual(100);
  });
});
