// Besoin énergétique journalier : BMR Mifflin-St Jeor puis TDEE.
import { ACTIVITY_LEVELS, type Profile } from "./profile";

export function bmrMifflinStJeor(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.ageYears;
  return base + (p.sex === "male" ? 5 : -161);
}

export function tdee(p: Profile): number {
  return bmrMifflinStJeor(p) * ACTIVITY_LEVELS[p.activity];
}
