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

export interface Profile {
  sex: Sex;
  ageYears: number;
  weightKg: number;
  heightCm: number;
  activity: ActivityLevel;
}

export function validateProfile(p: Profile): void {
  if (!(p.ageYears >= 18 && p.ageYears <= 120))
    throw new Error("Le calcul ne couvre que les adultes (18-120 ans).");
  if (!(p.weightKg > 0 && p.weightKg <= 400))
    throw new Error("Poids hors limites plausibles (0-400 kg).");
  if (!(p.heightCm > 0 && p.heightCm <= 260))
    throw new Error("Taille hors limites plausibles (0-260 cm).");
}
