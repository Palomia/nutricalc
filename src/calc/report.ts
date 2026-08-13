// Assemblage du rapport journalier complet.
import { bmrMifflinStJeor, tdee } from "./energy";
import { macroTargets, type MacroTargets } from "./macros";
import { micronutrientReferences, type MicroReference } from "./micros";
import { validateProfile, type Profile } from "./profile";

export interface DailyReport {
  profile: Profile;
  bmrKcal: number;
  energyKcal: number;
  macros: MacroTargets;
  micros: MicroReference[];
}

export function dailyReport(p: Profile): DailyReport {
  validateProfile(p);
  const energyKcal = tdee(p);
  return {
    profile: p,
    bmrKcal: bmrMifflinStJeor(p),
    energyKcal,
    macros: macroTargets(p, energyKcal),
    micros: micronutrientReferences(p),
  };
}
