// Macronutriments (références ANSES adulte).
import type { Profile } from "./profile";

export const PROTEIN_G_PER_KG = 0.83;
export const LIPID_FRACTION_AET = 0.375; // milieu de la fourchette ANSES 35-40 %
export const KCAL_PER_G = { protein: 4, lipid: 9, carb: 4 } as const;

export interface MacroTarget {
  grams: number;
  kcal: number;
  percentAet: number; // part de l'AET, entre 0 et 1
}

export interface MacroTargets {
  protein: MacroTarget;
  lipid: MacroTarget;
  carb: MacroTarget;
}

export function macroTargets(p: Profile, energyKcal: number): MacroTargets {
  if (energyKcal <= 0)
    throw new Error("L'apport énergétique doit être strictement positif.");

  const proteinG = PROTEIN_G_PER_KG * p.weightKg;
  const proteinKcal = proteinG * KCAL_PER_G.protein;

  const lipidKcal = LIPID_FRACTION_AET * energyKcal;
  const lipidG = lipidKcal / KCAL_PER_G.lipid;

  // Les glucides absorbent le reste de l'énergie ; borné à 0 aux cas extrêmes.
  const carbKcal = Math.max(energyKcal - proteinKcal - lipidKcal, 0);
  const carbG = carbKcal / KCAL_PER_G.carb;

  return {
    protein: { grams: proteinG, kcal: proteinKcal, percentAet: proteinKcal / energyKcal },
    lipid: { grams: lipidG, kcal: lipidKcal, percentAet: lipidKcal / energyKcal },
    carb: { grams: carbG, kcal: carbKcal, percentAet: carbKcal / energyKcal },
  };
}
