// Micronutriments : vitamines et minéraux.
//
// Valeurs INDICATIVES tirées des références nutritionnelles ANSES pour l'adulte
// (actualisation 2016-2021). RNP = Référence Nutritionnelle pour la Population ;
// AS = Apport Satisfaisant. Certaines valeurs dépendent de facteurs non
// modélisés (pertes menstruelles, phytates, âge) et sont à revalider contre le
// tableau officiel ANSES avant tout usage réel.
import type { Profile } from "./profile";

export type MicroKind = "RNP" | "AS";

export interface MicroReference {
  name: string;
  unit: string;
  amount: number;
  kind: MicroKind;
  note: string;
}

interface Row {
  name: string;
  unit: string;
  men: number;
  women: number;
  kind: MicroKind;
  note?: string;
}

// Adulte 18-64 ans.
const TABLE: Row[] = [
  { name: "Vitamine C", unit: "mg", men: 110, women: 110, kind: "RNP" },
  { name: "Vitamine D", unit: "µg", men: 15, women: 15, kind: "RNP", note: "en l'absence d'exposition solaire suffisante" },
  { name: "Vitamine A", unit: "µg ER", men: 750, women: 650, kind: "RNP" },
  { name: "Vitamine E", unit: "mg", men: 10.5, women: 9.9, kind: "AS" },
  { name: "Vitamine B1", unit: "mg", men: 1.3, women: 1.1, kind: "RNP", note: "thiamine" },
  { name: "Vitamine B2", unit: "mg", men: 1.6, women: 1.5, kind: "RNP", note: "riboflavine" },
  { name: "Vitamine B3", unit: "mg EN", men: 14, women: 11, kind: "RNP", note: "niacine" },
  { name: "Vitamine B6", unit: "mg", men: 1.7, women: 1.6, kind: "RNP" },
  { name: "Vitamine B9", unit: "µg", men: 330, women: 330, kind: "RNP", note: "folates" },
  { name: "Vitamine B12", unit: "µg", men: 4, women: 4, kind: "AS" },
  { name: "Calcium", unit: "mg", men: 950, women: 950, kind: "RNP" },
  { name: "Fer", unit: "mg", men: 11, women: 16, kind: "RNP", note: "femme : pertes menstruelles élevées ; sinon 11 mg" },
  { name: "Magnésium", unit: "mg", men: 380, women: 300, kind: "AS" },
  { name: "Zinc", unit: "mg", men: 11, women: 8, kind: "RNP", note: "varie avec la teneur en phytates du régime" },
  { name: "Iode", unit: "µg", men: 150, women: 150, kind: "RNP" },
  { name: "Sélénium", unit: "µg", men: 70, women: 70, kind: "RNP" },
  { name: "Potassium", unit: "mg", men: 3500, women: 3500, kind: "AS" },
  { name: "Phosphore", unit: "mg", men: 700, women: 700, kind: "RNP" },
];

export function micronutrientReferences(p: Profile): MicroReference[] {
  const isMale = p.sex === "male";
  return TABLE.map((r) => ({
    name: r.name,
    unit: r.unit,
    amount: isMale ? r.men : r.women,
    kind: r.kind,
    note: r.note ?? "",
  }));
}
