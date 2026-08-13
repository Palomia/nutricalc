// Macronutriments et leurs découpages (références ANSES adulte).
//
// Découpages :
//  - Acides aminés indispensables : besoins moyens FAO/OMS/UNU 2007 (mg/kg/j,
//    adulte, identiques hommes/femmes ; ce sont des besoins moyens, pas des RNP).
//  - Acides gras : références AFSSA/ANSES (avis 2006-SA-0359), en % de l'AET ou
//    en valeur absolue (EPA, DHA).
//  - Glucides : fibres (AS ANSES 2016), sucres hors lactose/galactose (limite
//    ANSES 2016), sucres libres/ajoutés (objectif OMS 2015).
//
// AS = apport satisfaisant ; "limite" = valeur maximale de santé publique ;
// "OMS" = objectif de santé publique OMS (aucun n'est une limite toxicologique).
import type { Profile } from "./profile";

export const PROTEIN_G_PER_KG = 0.83;
export const LIPID_FRACTION_AET = 0.375; // milieu de la fourchette ANSES 35-40 %
export const KCAL_PER_G = { protein: 4, lipid: 9, carb: 4 } as const;

export interface MacroTarget {
  grams: number;
  kcal: number;
  percentAet: number; // part de l'AET, entre 0 et 1
}

export interface AminoAcid {
  name: string;
  mgPerKg: number; // besoin moyen FAO/OMS (mg/kg/j)
  mg: number; // besoin journalier = mgPerKg × poids
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
  { name: "Sucres (hors lactose et galactose)", kind: "limite", gramsFixed: 100, percentAet: null, note: "valeur maximale (ANSES)" },
  { name: "Sucres libres / ajoutés", kind: "OMS", gramsFixed: null, percentAet: 10, note: "< 5 % AET idéalement (OMS)" },
];

export function aminoAcidTargets(p: Profile): AminoAcid[] {
  return AMINO_ACIDS_MG_PER_KG.map(([name, mgPerKg]) => ({
    name,
    mgPerKg,
    mg: mgPerKg * p.weightKg,
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
    aminoAcids: aminoAcidTargets(p),
    fattyAcids: fattyAcidTargets(energyKcal),
    carbComponents: carbComponents(energyKcal),
  };
}
