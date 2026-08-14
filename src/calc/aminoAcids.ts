// Moteur d'analyse anabolique (temp.txt §4, §8-13).
//
// Philosophie (temp.txt §14) : deux journées à 160 g de protéines ne se valent
// pas. Au-delà des grammes, ce moteur évalue la qualité protéique « utile à
// l'anabolisme » — couverture des acides aminés indispensables (AAE), acide
// aminé limitant, leucine par repas, distribution des protéines — puis en tire
// un score de construction musculaire. Particulièrement utile aux régimes
// végétariens/végétaliens ou très céréaliers, où la quantité masque une qualité
// insuffisante.
//
// Toutes les valeurs sont INDICATIVES et pédagogiques (profil d'AAE INLINE porté
// par chaque aliment FR) ; le moteur est pragmatique, pas une référence clinique.
import type { AminoAcid, AminoAcidKey } from "./macros";
import { dayMacros, mealMacros, type Day, type Ingredient, type Meal } from "./intake";

export const AMINO_ACID_KEYS: AminoAcidKey[] = [
  "histidine",
  "isoleucine",
  "leucine",
  "lysine",
  "sulfur",
  "aromatic",
  "threonine",
  "tryptophan",
  "valine",
];

// Apport en AAE, en mg, indexé par acide aminé.
export type AminoAcidAmounts = Record<AminoAcidKey, number>;

function zeroAminoAcids(): AminoAcidAmounts {
  return {
    histidine: 0, isoleucine: 0, leucine: 0, lysine: 0, sulfur: 0,
    aromatic: 0, threonine: 0, tryptophan: 0, valine: 0,
  };
}

// Grammes de protéines apportés par un ingrédient (règle de trois sur 100 g).
function ingredientProteinG(i: Ingredient): number {
  return (i.food.proteinPer100g * i.grams) / 100;
}

// mg d'AAE apportés par un ingrédient : profil INLINE de l'aliment (mg/g de
// protéine) × grammes de protéines. Aliment sans profil (protéines négligeables
// ou profil d'AA absent dans la base FR) → zéro (repli, comme aujourd'hui).
export function ingredientAminoAcids(i: Ingredient): AminoAcidAmounts {
  const out = zeroAminoAcids();
  const proteinG = ingredientProteinG(i);
  const profile = i.food.aaProfile;
  if (!profile || proteinG <= 0) return out;
  for (const k of AMINO_ACID_KEYS) out[k] = profile[k] * proteinG;
  return out;
}

function allIngredients(meal: Meal): Ingredient[] {
  return meal.dishes.flatMap((d) => d.ingredients);
}

// Apport total en AAE d'un repas (somme des ingrédients).
export function mealAminoAcids(meal: Meal): AminoAcidAmounts {
  const out = zeroAminoAcids();
  for (const i of allIngredients(meal)) {
    const aa = ingredientAminoAcids(i);
    for (const k of AMINO_ACID_KEYS) out[k] += aa[k];
  }
  return out;
}

// Apport total en AAE de la journée.
export function dayAminoAcids(day: Day): AminoAcidAmounts {
  const out = zeroAminoAcids();
  for (const m of day.meals) {
    const aa = mealAminoAcids(m);
    for (const k of AMINO_ACID_KEYS) out[k] += aa[k];
  }
  return out;
}

// --- §8 : couverture des AAE et acide aminé limitant ---

export interface AminoAcidCoverage {
  key: AminoAcidKey;
  name: string;
  intakeMg: number;
  targetMg: number;
  coverage: number; // apport / objectif (1 = 100 %)
}

export function aminoAcidCoverage(
  intake: AminoAcidAmounts,
  targets: AminoAcid[],
): AminoAcidCoverage[] {
  return targets.map((t) => ({
    key: t.key,
    name: t.name,
    intakeMg: intake[t.key],
    targetMg: t.mg,
    coverage: t.mg > 0 ? intake[t.key] / t.mg : 0,
  }));
}

// Acide aminé à la plus faible couverture (temp.txt §8) : il plafonne le
// potentiel anabolique. `null` si aucune protéine analysable n'a été saisie.
export function limitingAminoAcid(
  coverage: AminoAcidCoverage[],
): AminoAcidCoverage | null {
  if (coverage.length === 0) return null;
  const totalIntake = coverage.reduce((s, c) => s + c.intakeMg, 0);
  if (totalIntake <= 0) return null;
  return coverage.reduce((min, c) => (c.coverage < min.coverage ? c : min));
}

// --- §9-10 : leucine par repas et distribution des protéines ---

export type LeucineLevel = "faible" | "min" | "optimal" | "excellent";

// Seuils leucine par repas (g), temp.txt §9.
export const LEUCINE_THRESHOLDS = { min: 2, optimal: 2.5, excellent: 3 } as const;

export function leucineLevel(leucineG: number): LeucineLevel {
  if (leucineG < LEUCINE_THRESHOLDS.min) return "faible";
  if (leucineG < LEUCINE_THRESHOLDS.optimal) return "min";
  if (leucineG < LEUCINE_THRESHOLDS.excellent) return "optimal";
  return "excellent";
}

// Fenêtre de protéines par prise (temp.txt §10). Le pic anabolique est jugé sur
// les protéines TOTALES du repas : aucune prime n'est accordée à l'origine
// animale (la qualité est déjà captée par l'acide aminé limitant, cf. §8).
export const PROTEIN_PER_MEAL = { min: 25, max: 40 } as const;

export interface MealMuscle {
  name: string;
  totalProteinG: number;
  leucineG: number;
  leucineLevel: LeucineLevel;
  isAnabolicPeak: boolean; // ≥ 25 g de protéines totales
  inTargetRange: boolean; // 25-40 g de protéines totales
}

function mealMuscle(meal: Meal): MealMuscle {
  const totalProteinG = mealMacros(meal).proteinG;
  const leucineG = mealAminoAcids(meal).leucine / 1000;
  return {
    name: meal.name,
    totalProteinG,
    leucineG,
    leucineLevel: leucineLevel(leucineG),
    isAnabolicPeak: totalProteinG >= PROTEIN_PER_MEAL.min,
    inTargetRange:
      totalProteinG >= PROTEIN_PER_MEAL.min && totalProteinG <= PROTEIN_PER_MEAL.max,
  };
}

export interface DistributionResult {
  meals: MealMuscle[];
  peaks: number; // nombre de prises ≥ 25 g de protéines totales
  bonus: boolean; // 3 à 5 pics anaboliques dans la journée (temp.txt §10)
}

export function proteinDistribution(day: Day): DistributionResult {
  const meals = day.meals.map(mealMuscle);
  const peaks = meals.filter((m) => m.isAnabolicPeak).length;
  return { meals, peaks, bonus: peaks >= 3 && peaks <= 5 };
}

// --- §12 : score de construction musculaire (0-100) ---

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export type MuscleBand = "excellent" | "tresBon" | "correct" | "limitant";

// Pondérations du score final (temp.txt §12).
export const MUSCLE_WEIGHTS = {
  protein: 0.3,
  aae: 0.25,
  leucine: 0.2,
  calories: 0.15,
  distribution: 0.1,
} as const;

export interface MuscleScore {
  total: number; // 0-100
  band: MuscleBand;
  proteinScore: number; // 0-1
  aaeScore: number; // 0-1 (plafonné par l'AA limitant)
  leucineScore: number; // 0-1
  calorieScore: number; // 0-1
  distributionScore: number; // 0-1
}

function band(total: number): MuscleBand {
  if (total >= 90) return "excellent";
  if (total >= 75) return "tresBon";
  if (total >= 50) return "correct";
  return "limitant";
}

// Objectifs de comparaison pour le score.
export interface MuscleTargets {
  aminoAcids: AminoAcid[]; // objectifs AAE (mg/j, facteur sportif inclus)
  proteinTargetG: number;
  energyTargetKcal: number;
}

// Analyse complète, dans l'ordre d'évaluation de temp.txt §13.
export interface MuscleAnalysis {
  dayProteinG: number;
  dayKcal: number;
  aminoAcids: AminoAcidCoverage[]; // couverture par AAE
  limiting: AminoAcidCoverage | null; // acide aminé limitant
  distribution: DistributionResult; // leucine par repas + répartition
  score: MuscleScore; // score final
}

export function analyzeMuscleProfile(day: Day, targets: MuscleTargets): MuscleAnalysis {
  // 1-2. Calories et protéines totales de la journée.
  const totals = dayMacros(day);
  // 3-4. Couverture des AAE puis acide aminé limitant.
  const intake = dayAminoAcids(day);
  const coverage = aminoAcidCoverage(intake, targets.aminoAcids);
  const limiting = limitingAminoAcid(coverage);
  // 5. Leucine par repas + 7. répartition des protéines.
  const distribution = proteinDistribution(day);

  // 8. Score final (temp.txt §12).
  const proteinScore =
    targets.proteinTargetG > 0 ? clamp01(totals.proteinG / targets.proteinTargetG) : 0;
  // Plafonné par l'AA limitant (temp.txt §8) : sans protéine analysable → 0.
  const aaeScore = limiting ? clamp01(limiting.coverage) : 0;
  // Sous-score leucine : c'est le NOMBRE de prises atteignant le seuil anabolique
  // (≥ 2,5 g de leucine) qui compte, rapporté au nombre de prises anaboliques
  // visées dans la journée — et non la proportion de repas au seuil (une moyenne
  // de ratios avantagerait à tort une journée d'un seul bon repas).
  const leucineMeals = distribution.meals.filter(
    (m) => m.leucineG >= LEUCINE_THRESHOLDS.optimal,
  ).length;
  // Cible dynamique : ~35 g de protéines par prise « pleine » (milieu de la
  // fenêtre 25-40 g), bornée à 3-7 prises anaboliques par jour (temp.txt §10).
  const targetAnabolicMeals = Math.max(
    3,
    Math.min(7, Math.round(targets.proteinTargetG / 35)),
  );
  const leucineScore = clamp01(leucineMeals / targetAnabolicMeals);
  // Proximité à la cible calorique (sous comme sur-consommation pénalisent).
  const calorieScore =
    targets.energyTargetKcal > 0
      ? Math.max(0, 1 - Math.abs(totals.kcal - targets.energyTargetKcal) / targets.energyTargetKcal)
      : 0;
  // 3 à 5 pics anaboliques → plein score.
  const distributionScore = clamp01(distribution.peaks / 3);

  const total =
    100 *
    (MUSCLE_WEIGHTS.protein * proteinScore +
      MUSCLE_WEIGHTS.aae * aaeScore +
      MUSCLE_WEIGHTS.leucine * leucineScore +
      MUSCLE_WEIGHTS.calories * calorieScore +
      MUSCLE_WEIGHTS.distribution * distributionScore);

  return {
    dayProteinG: totals.proteinG,
    dayKcal: totals.kcal,
    aminoAcids: coverage,
    limiting,
    distribution,
    score: {
      total,
      band: band(total),
      proteinScore,
      aaeScore,
      leucineScore,
      calorieScore,
      distributionScore,
    },
  };
}
