// Profil d'entrée du calcul. Adultes non enceintes/allaitants uniquement.

export type Sex = "male" | "female";

// Facteur multiplicatif appliqué au métabolisme de base pour obtenir le TDEE.
export const ACTIVITY_LEVELS = {
  sedentary: 1.2, // peu ou pas d'exercice
  light: 1.375, // exercice léger 1-3 j/sem
  moderate: 1.55, // exercice modéré 3-5 j/sem
  active: 1.725, // exercice intense 6-7 j/sem
  veryActive: 1.9, // travail physique ou double entraînement
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_LEVELS;

// Fourchette d'une recommandation : borne basse, cible et borne haute.
export interface Range {
  min: number;
  target: number;
  max: number;
}

// Sens de l'ajustement calorique par rapport au TDEE.
export type CalorieGoal = "maintenance" | "surplus" | "deficit";

// Profil nutritionnel : combine un objectif calorique et des ratios de macros
// exprimés en g par kg de poids (de référence). Les glucides sont, sauf mention
// contraire, la variable d'ajustement (le reste des calories) : quand un profil
// fournit `carbGPerKg`, c'est une fourchette indicative, pas une contrainte.
export interface NutritionProfile {
  label: string;
  description: string;
  goal: CalorieGoal;
  adjustmentKcal: Range; // kcal ajoutées au TDEE (négatif en déficit)
  proteinGPerKg: Range;
  fatGPerKg: Range;
  carbGPerKg: Range | null; // fourchette indicative ; null = « reste des calories »
  // Facteur sportif appliqué aux besoins minimaux en acides aminés (cf. temp.txt
  // §7). EXTRAPOLATION PRODUIT : la littérature sportive raisonne en protéines
  // totales, pas en AAE individuels ; ce facteur remonte les minimums OMS (santé)
  // vers un objectif orienté performance. Ce n'est pas une recommandation
  // officielle.
  aaeFactor: number;
}

// Sept profils, du sédentaire à la sèche avancée. Ratios g/kg et ajustements
// caloriques indicatifs, à revalider avec un professionnel.
export const NUTRITION_PROFILES = {
  sedentary: {
    label: "Sédentaire",
    description: "Peu ou pas d'activité physique",
    goal: "maintenance",
    adjustmentKcal: { min: 0, target: 0, max: 0 },
    proteinGPerKg: { min: 0.8, target: 1.0, max: 1.2 },
    fatGPerKg: { min: 0.8, target: 0.9, max: 1.0 },
    carbGPerKg: { min: 2, target: 3, max: 4 },
    aaeFactor: 1.0,
  },
  active: {
    label: "Actif",
    description: "2 à 4 séances par semaine",
    goal: "maintenance",
    adjustmentKcal: { min: 0, target: 0, max: 0 },
    proteinGPerKg: { min: 1.2, target: 1.4, max: 1.6 },
    fatGPerKg: { min: 0.8, target: 0.8, max: 1.0 },
    carbGPerKg: { min: 3, target: 4, max: 5 },
    aaeFactor: 1.2,
  },
  endurance: {
    label: "Endurance",
    description: "Course, vélo, triathlon, sports collectifs intensifs",
    goal: "maintenance",
    adjustmentKcal: { min: 0, target: 0, max: 0 },
    proteinGPerKg: { min: 1.4, target: 1.6, max: 1.8 },
    fatGPerKg: { min: 0.8, target: 0.9, max: 1.0 },
    carbGPerKg: { min: 5, target: 6, max: 8 },
    aaeFactor: 1.3,
  },
  strengthMaintenance: {
    label: "Force (maintien)",
    description: "Musculation avec objectif de maintien",
    goal: "maintenance",
    adjustmentKcal: { min: 0, target: 0, max: 0 },
    proteinGPerKg: { min: 1.6, target: 1.8, max: 2.0 },
    fatGPerKg: { min: 0.7, target: 0.8, max: 1.0 },
    carbGPerKg: { min: 3, target: 4, max: 6 },
    aaeFactor: 1.5,
  },
  muscleGain: {
    label: "Prise de masse",
    description: "Développement musculaire en surplus calorique",
    goal: "surplus",
    adjustmentKcal: { min: 200, target: 300, max: 400 },
    proteinGPerKg: { min: 1.6, target: 1.8, max: 2.2 },
    fatGPerKg: { min: 0.8, target: 0.9, max: 1.0 },
    carbGPerKg: { min: 4, target: 5, max: 7 },
    aaeFactor: 1.8,
  },
  fatLoss: {
    label: "Perte de poids",
    description: "Perte de poids / sèche modérée",
    goal: "deficit",
    adjustmentKcal: { min: -700, target: -500, max: -300 },
    proteinGPerKg: { min: 2.0, target: 2.2, max: 2.4 },
    fatGPerKg: { min: 0.6, target: 0.7, max: 0.8 },
    carbGPerKg: null, // reste des calories
    aaeFactor: 1.8,
  },
  aggressiveCut: {
    label: "Sèche avancée",
    description: "Sèche avancée ou sportif déjà très sec",
    goal: "deficit",
    adjustmentKcal: { min: -1000, target: -750, max: -500 },
    proteinGPerKg: { min: 2.3, target: 2.7, max: 3.1 },
    fatGPerKg: { min: 0.6, target: 0.7, max: 0.8 },
    carbGPerKg: null, // reste des calories
    aaeFactor: 2.0,
  },
} as const satisfies Record<string, NutritionProfile>;

export type NutritionGoal = keyof typeof NUTRITION_PROFILES;

export interface Profile {
  sex: Sex;
  ageYears: number;
  weightKg: number;
  heightCm: number;
  activity: ActivityLevel;
  goal: NutritionGoal;
}

export function validateProfile(p: Profile): void {
  if (!(p.ageYears >= 18 && p.ageYears <= 120))
    throw new Error("Le calcul ne couvre que les adultes (18-120 ans).");
  if (!(p.weightKg > 0 && p.weightKg <= 400))
    throw new Error("Poids hors limites plausibles (0-400 kg).");
  if (!(p.heightCm > 0 && p.heightCm <= 260))
    throw new Error("Taille hors limites plausibles (0-260 cm).");
  if (!(p.goal in NUTRITION_PROFILES))
    throw new Error("Profil nutritionnel inconnu.");
}

// Indice de masse corporelle (kg/m²).
export function bmi(p: Pick<Profile, "weightKg" | "heightCm">): number {
  const heightM = p.heightCm / 100;
  return p.weightKg / (heightM * heightM);
}

// Poids idéal, en kg : le poids correspondant à un IMC de 25 pour la taille
// donnée (cf. temp.txt §3, « poids_ideal = IMC 25 »). Sert de base au poids
// ajusté. Ne dépend pas du sexe (l'IMC de référence est commun).
export const IDEAL_BMI = 25;
export function idealBodyWeightKg(heightCm: number): number {
  const heightM = heightCm / 100;
  return IDEAL_BMI * heightM * heightM;
}

// Poids de référence pour les calculs en g/kg. En surpoids ou obésité, doser les
// macros (protéines surtout) sur le poids total surestime les besoins : on
// applique un poids ajusté = poids idéal + une fraction de l'excès de poids.
//   IMC < 25   → poids réel
//   25 ≤ IMC < 30 → poids idéal + 25 % de l'excès
//   IMC ≥ 30   → poids idéal + 40 % de l'excès
export function effectiveWeightKg(p: Profile): number {
  const currentBmi = bmi(p);
  if (currentBmi < 25) return p.weightKg;
  const ideal = idealBodyWeightKg(p.heightCm);
  const excess = Math.max(0, p.weightKg - ideal);
  const factor = currentBmi < 30 ? 0.25 : 0.4;
  return ideal + factor * excess;
}
