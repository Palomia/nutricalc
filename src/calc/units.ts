// Unités ménagères de saisie et leur équivalent en grammes.
//
// Permet de saisir la quantité d'un ingrédient dans une unité du quotidien
// (cuillère, tasse, mug…) plutôt qu'en grammes, puis de convertir vers les
// grammes pour tous les calculs (intake.ts reste une simple règle de trois).
//
// ATTENTION : ces équivalences sont APPROXIMATIVES et génériques. La masse
// réelle d'une cuillère ou d'une tasse dépend fortement de la densité de
// l'aliment (une cuillère à soupe d'huile ≠ une cuillère à soupe de farine ≠
// une cuillère à soupe de miel). Les valeurs ci-dessous sont des ordres de
// grandeur usuels, à affiner au besoin — elles ne prétendent pas être exactes.

export type Unit =
  | "gramme"
  | "pincee"
  | "cuillereCafe"
  | "cuillereSoupe"
  | "verre"
  | "tasse"
  | "mug";

// Équivalent en grammes d'UNE unité (base générique « type eau »).
export const UNIT_GRAMS: Record<Unit, number> = {
  gramme: 1, // 1 g (unité de référence)
  pincee: 0.5, // ~0,5 g (une pincée entre deux doigts)
  cuillereCafe: 5, // ~5 g (cuillère à café rase)
  cuillereSoupe: 15, // ~15 g (cuillère à soupe rase)
  verre: 200, // ~200 g (verre à eau)
  tasse: 240, // ~240 g (tasse de café standard)
  mug: 250, // ~250 g (grand mug)
};

// Libellé court d'affichage (français) pour l'UI et les <select>.
export const UNIT_LABELS: Record<Unit, string> = {
  gramme: "g",
  pincee: "pincée",
  cuillereCafe: "c. à café",
  cuillereSoupe: "c. à soupe",
  verre: "verre",
  tasse: "tasse",
  mug: "mug",
};

// Ordre d'affichage des unités (du plus fin au plus volumineux).
export const UNITS: Unit[] = [
  "gramme",
  "pincee",
  "cuillereCafe",
  "cuillereSoupe",
  "verre",
  "tasse",
  "mug",
];

// Unité par défaut (saisie directe en grammes, rétro-compatible).
export const DEFAULT_UNIT: Unit = "gramme";

// Garde-fou de validation (persistance tolérante) : une chaîne est une unité
// connue si elle figure dans la table de conversion.
export function isUnit(v: unknown): v is Unit {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(UNIT_GRAMS, v);
}

// Conversion PURE : quantité exprimée dans `unit` → grammes équivalents.
export function toGrams(quantity: number, unit: Unit): number {
  return quantity * UNIT_GRAMS[unit];
}
