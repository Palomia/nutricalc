// Assemblage du rapport journalier complet.
import type { MuscleTargets } from "./aminoAcids";
import { bmrMifflinStJeor, energyTarget, tdee, type EnergyTarget } from "./energy";
import { macroTargets, type MacroTargets } from "./macros";
import { micronutrientReferences, type MicroReference } from "./micros";
import { bmi, effectiveWeightKg, validateProfile, type Profile } from "./profile";

export interface DailyReport {
  profile: Profile;
  bmrKcal: number;
  tdeeKcal: number;
  bmi: number;
  effectiveWeightKg: number; // poids de référence utilisé pour les macros (g/kg)
  weightAdjusted: boolean; // vrai si le poids ajusté diffère du poids réel
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
    bmi: bmi(p),
    effectiveWeightKg: refWeight,
    weightAdjusted: refWeight < p.weightKg,
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
