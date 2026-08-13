// Besoin énergétique journalier : BMR Mifflin-St Jeor, TDEE, puis application de
// l'objectif calorique du profil nutritionnel.
import {
  ACTIVITY_LEVELS,
  NUTRITION_PROFILES,
  type CalorieGoal,
  type Profile,
} from "./profile";

export function bmrMifflinStJeor(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.ageYears;
  return base + (p.sex === "male" ? 5 : -161);
}

// Dépense énergétique totale : le BMR est calculé sur le poids réel (la dépense
// dépend de la masse effectivement portée).
export function tdee(p: Profile): number {
  return bmrMifflinStJeor(p) * ACTIVITY_LEVELS[p.activity];
}

export interface EnergyTarget {
  tdeeKcal: number;
  goal: CalorieGoal;
  adjustmentKcal: number; // ajustement cible appliqué au TDEE
  energyKcal: number; // TDEE + ajustement cible
  energyMinKcal: number; // borne basse de la fourchette
  energyMaxKcal: number; // borne haute de la fourchette
}

// Applique l'objectif calorique : calories = TDEE + ajustement (négatif en
// déficit). La fourchette reflète l'intervalle d'ajustement du profil.
export function energyTarget(p: Profile, tdeeKcal = tdee(p)): EnergyTarget {
  const np = NUTRITION_PROFILES[p.goal];
  const adj = np.adjustmentKcal;
  return {
    tdeeKcal,
    goal: np.goal,
    adjustmentKcal: adj.target,
    energyKcal: tdeeKcal + adj.target,
    energyMinKcal: tdeeKcal + adj.min,
    energyMaxKcal: tdeeKcal + adj.max,
  };
}
