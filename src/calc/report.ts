// Assemblage du rapport journalier complet.
import type { MuscleTargets } from "./aminoAcids";
import { bmrMifflinStJeor, energyTarget, tdee, type EnergyTarget } from "./energy";
import { macroTargets, type MacroTargets } from "./macros";
import { micronutrientReferences, type MicroReference } from "./micros";
import { effectiveWeightKg, validateProfile, type Profile } from "./profile";

export interface DailyReport {
  profile: Profile;
  bmrKcal: number;
  tdeeKcal: number;
  effectiveWeightKg: number; // poids de référence utilisé pour les macros (g/kg)
  weightAdjusted: boolean; // vrai si le poids de référence diffère du poids actuel
  energy: EnergyTarget;
  energyKcal: number; // calories cibles (raccourci vers energy.energyKcal)
  macros: MacroTargets;
  micros: MicroReference[];
  muscleTargets: MuscleTargets; // objectifs pour l'analyse anabolique (cf. aminoAcids.ts)
}

export function dailyReport(p: Profile): DailyReport {
  validateProfile(p);
  const tdeeKcal = tdee(p);
  const energy = energyTarget(p, tdeeKcal);
  const refWeight = effectiveWeightKg(p);
  const macros = macroTargets(p, energy.energyKcal, refWeight);
  return {
    profile: p,
    bmrKcal: bmrMifflinStJeor(p),
    tdeeKcal,
    effectiveWeightKg: refWeight,
    weightAdjusted: refWeight !== p.weightKg,
    energy,
    energyKcal: energy.energyKcal,
    macros,
    micros: micronutrientReferences(p),
    muscleTargets: {
      aminoAcids: macros.aminoAcids,
      proteinTargetG: macros.protein.grams,
      energyTargetKcal: energy.energyKcal,
    },
  };
}
