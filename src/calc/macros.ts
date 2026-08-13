// Macronutriments et leurs découpages (références ANSES adulte).
//
// Les cibles de macros dépendent désormais du profil nutritionnel (ratios g/kg
// et objectif calorique, cf. profile.ts) et sont calculées sur un poids de
// référence (poids réel ou ajusté selon l'IMC, cf. effectiveWeightKg). Suivant
// l'algorithme du profil :
//   protéines = poids × ratio_protéines
//   lipides   = poids × ratio_lipides
//   glucides  = (calories cibles − protéines×4 − lipides×9) / 4   (le reste)
//
// Découpages (indépendants du profil) :
//  - Acides aminés indispensables : besoins moyens FAO/OMS/UNU 2007 (mg/kg/j,
//    adulte, identiques hommes/femmes ; ce sont des besoins moyens, pas des RNP).
//  - Acides gras : références AFSSA/ANSES (avis 2006-SA-0359), en % de l'AET ou
//    en valeur absolue (EPA, DHA).
//  - Glucides : fibres (AS ANSES 2016) et sucres libres/ajoutés (objectif OMS
//    2015 : sucres ajoutés, miel, sirops et jus de fruits ; hors fruits entiers
//    et lactose naturel des produits laitiers).
//
// AS = apport satisfaisant ; "limite" = valeur maximale de santé publique ;
// "OMS" = objectif de santé publique OMS (aucun n'est une limite toxicologique).
import { NUTRITION_PROFILES, type Profile } from "./profile";

export const KCAL_PER_G = { protein: 4, lipid: 9, carb: 4 } as const;

// Cible d'un macronutriment : valeur cible plus fourchette (grammes) issue de la
// fourchette de ratios du profil. Pour les glucides « reste des calories », la
// fourchette peut être absente (gramsMin/gramsMax null).
export interface MacroTarget {
  grams: number;
  kcal: number;
  percentAet: number; // part de l'AET (calories cibles), entre 0 et 1
  gramsMin: number | null;
  gramsMax: number | null;
  gPerKg: number | null; // ratio cible g/kg utilisé (null si dérivé du reste)
}

export interface AminoAcid {
  name: string;
  mgPerKg: number; // besoin moyen FAO/OMS (mg/kg/j)
  mg: number; // besoin journalier = mgPerKg × poids de référence
}

export type FattyAcidKind = "AS" | "limite";

export interface FattyAcidTarget {
  name: string;
  family: string; // "Saturés" | "Mono-insaturés" | "Poly-insaturés ω-6" | "Poly-insaturés ω-3"
  kind: FattyAcidKind;
  percentAet: number | null; // borne (limite) ou point/borne basse (AS), en %
  percentAetMax: number | null; // borne haute si intervalle, en %
  grams: number | null; // équivalent g/j (dérivé de percentAet et de l'énergie)
  gramsMax: number | null;
  milligrams: number | null; // valeurs absolues (EPA, DHA)
  note: string;
}

export type CarbKind = "AS" | "limite" | "OMS";

export interface CarbComponent {
  name: string;
  kind: CarbKind;
  grams: number | null; // cible/limite g/j (fixe, ou dérivée du % d'AET)
  percentAet: number | null; // part de l'AET en %, si applicable
  note: string;
}

export interface MacroTargets {
  protein: MacroTarget;
  lipid: MacroTarget;
  carb: MacroTarget;
  aminoAcids: AminoAcid[]; // découpage des protéines
  fattyAcids: FattyAcidTarget[]; // découpage des lipides
  carbComponents: CarbComponent[]; // découpage des glucides
}

// Besoins moyens en acides aminés indispensables, adulte (FAO/WHO/UNU 2007).
const AMINO_ACIDS_MG_PER_KG: [string, number][] = [
  ["Histidine", 10],
  ["Isoleucine", 20],
  ["Leucine", 39],
  ["Lysine", 30],
  ["Acides aminés soufrés (Met + Cys)", 15],
  ["Acides aminés aromatiques (Phe + Tyr)", 25],
  ["Thréonine", 15],
  ["Tryptophane", 4],
  ["Valine", 26],
];

interface FattyAcidRow {
  name: string;
  family: string;
  kind: FattyAcidKind;
  percentAet: number | null;
  percentAetMax: number | null;
  milligrams: number | null;
  note: string;
}

// Références acides gras, adulte (AFSSA/ANSES 2006-SA-0359).
const FATTY_ACIDS: FattyAcidRow[] = [
  { name: "Acides gras saturés", family: "Saturés", kind: "limite", percentAet: 12, percentAetMax: null, milligrams: null, note: "valeur maximale" },
  { name: "dont laurique + myristique + palmitique", family: "Saturés", kind: "limite", percentAet: 8, percentAetMax: null, milligrams: null, note: "athérogènes en excès" },
  { name: "Acide oléique (AGMI, ω-9)", family: "Mono-insaturés", kind: "AS", percentAet: 15, percentAetMax: 20, milligrams: null, note: "" },
  { name: "Acide linoléique (ω-6)", family: "Poly-insaturés ω-6", kind: "AS", percentAet: 4, percentAetMax: null, milligrams: null, note: "" },
  { name: "Acide α-linolénique (ALA, ω-3)", family: "Poly-insaturés ω-3", kind: "AS", percentAet: 1, percentAetMax: null, milligrams: null, note: "" },
  { name: "EPA", family: "Poly-insaturés ω-3", kind: "AS", percentAet: null, percentAetMax: null, milligrams: 250, note: "EPA + DHA : 500 mg/j" },
  { name: "DHA", family: "Poly-insaturés ω-3", kind: "AS", percentAet: null, percentAetMax: null, milligrams: 250, note: "EPA + DHA : 500 mg/j" },
];

interface CarbRow {
  name: string;
  kind: CarbKind;
  gramsFixed: number | null;
  percentAet: number | null;
  note: string;
}

// Découpage des glucides, adulte (ANSES 2016 + OMS 2015).
const CARB_COMPONENTS: CarbRow[] = [
  { name: "Fibres", kind: "AS", gramsFixed: 30, percentAet: null, note: "ANSES 2016" },
  { name: "Sucres libres / ajoutés", kind: "OMS", gramsFixed: null, percentAet: 10, note: "< 5 % AET idéalement (OMS)" },
];

export function aminoAcidTargets(weightKg: number): AminoAcid[] {
  return AMINO_ACIDS_MG_PER_KG.map(([name, mgPerKg]) => ({
    name,
    mgPerKg,
    mg: mgPerKg * weightKg,
  }));
}

export function fattyAcidTargets(energyKcal: number): FattyAcidTarget[] {
  const toGrams = (pct: number | null) =>
    pct === null ? null : (pct / 100) * energyKcal / KCAL_PER_G.lipid;
  return FATTY_ACIDS.map((r) => ({
    name: r.name,
    family: r.family,
    kind: r.kind,
    percentAet: r.percentAet,
    percentAetMax: r.percentAetMax,
    grams: toGrams(r.percentAet),
    gramsMax: toGrams(r.percentAetMax),
    milligrams: r.milligrams,
    note: r.note,
  }));
}

export function carbComponents(energyKcal: number): CarbComponent[] {
  return CARB_COMPONENTS.map((r) => ({
    name: r.name,
    kind: r.kind,
    grams:
      r.gramsFixed !== null
        ? r.gramsFixed
        : r.percentAet !== null
          ? (r.percentAet / 100) * energyKcal / KCAL_PER_G.carb
          : null,
    percentAet: r.percentAet,
    note: r.note,
  }));
}

// Calcule les cibles de macros pour un profil donné, une énergie cible et un
// poids de référence (réel ou ajusté). `energyKcal` correspond aux calories
// cibles (TDEE + ajustement de l'objectif), `weightKg` au poids de référence.
export function macroTargets(
  p: Profile,
  energyKcal: number,
  weightKg: number,
): MacroTargets {
  if (energyKcal <= 0)
    throw new Error("L'apport énergétique doit être strictement positif.");
  if (weightKg <= 0)
    throw new Error("Le poids de référence doit être strictement positif.");

  const np = NUTRITION_PROFILES[p.goal];

  // Protéines et lipides : ratio g/kg × poids de référence.
  const proteinG = np.proteinGPerKg.target * weightKg;
  const proteinKcal = proteinG * KCAL_PER_G.protein;
  const lipidG = np.fatGPerKg.target * weightKg;
  const lipidKcal = lipidG * KCAL_PER_G.lipid;

  // Glucides : le reste des calories cibles ; borné à 0 aux cas extrêmes (déficit
  // très marqué où protéines + lipides couvrent déjà toute l'énergie).
  const carbKcal = Math.max(energyKcal - proteinKcal - lipidKcal, 0);
  const carbG = carbKcal / KCAL_PER_G.carb;

  return {
    protein: {
      grams: proteinG,
      kcal: proteinKcal,
      percentAet: proteinKcal / energyKcal,
      gramsMin: np.proteinGPerKg.min * weightKg,
      gramsMax: np.proteinGPerKg.max * weightKg,
      gPerKg: np.proteinGPerKg.target,
    },
    lipid: {
      grams: lipidG,
      kcal: lipidKcal,
      percentAet: lipidKcal / energyKcal,
      gramsMin: np.fatGPerKg.min * weightKg,
      gramsMax: np.fatGPerKg.max * weightKg,
      gPerKg: np.fatGPerKg.target,
    },
    carb: {
      grams: carbG,
      kcal: carbKcal,
      percentAet: carbKcal / energyKcal,
      // Fourchette indicative si le profil en fournit une, sinon « reste ».
      gramsMin: np.carbGPerKg ? np.carbGPerKg.min * weightKg : null,
      gramsMax: np.carbGPerKg ? np.carbGPerKg.max * weightKg : null,
      gPerKg: np.carbGPerKg ? np.carbGPerKg.target : null,
    },
    aminoAcids: aminoAcidTargets(weightKg),
    fattyAcids: fattyAcidTargets(energyKcal),
    carbComponents: carbComponents(energyKcal),
  };
}
