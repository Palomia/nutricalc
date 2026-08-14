// Moteur de suggestions : quels aliments compléteraient le mieux la journée ?
//
// Philosophie (temp.txt §8, §14) : une journée peut afficher assez de protéines
// tout en restant plafonnée par un acide aminé (l'AA limitant). Compléter
// intelligemment, ce n'est donc pas « ajouter des protéines », c'est ajouter des
// protéines RICHES dans l'AA le moins couvert — d'où le mot « complémentarité ».
//
// Heuristique, simple et défendable :
//   1. Prioriser les aliments qui RELÈVENT l'acide aminé limitant du jour
//      (riches, via le profil d'AAE inline, dans l'AA le moins couvert).
//   2. Secondairement, aider à combler le déficit protéique, sans faire exploser
//      les calories (pénalité douce sur la densité énergétique).
//   3. Respecter le régime actif (`FoodFilter`) et éviter de resuggérer un
//      aliment déjà très présent dans la journée (l'esprit est de diversifier).
//
// Module PUR : aucune dépendance UI, testable sans DOM. Le classement porte sur
// un ensemble de CANDIDATS fourni par l'appelant (`candidates`) — en pratique
// les « aliments courants » (presets + aliments déjà sélectionnés du registre,
// cf. useMeals). Ce choix évite de classer les 7 793 aliments FR à chaque frappe
// (perf) tout en restant pertinent : les suggestions restituent des sources
// usuelles complémentaires. Valeurs INDICATIVES.
import { filterFoods, type Food, type FoodFilter } from "./food";
import { analyzeMuscleProfile, type MuscleTargets } from "./aminoAcids";
import type { AminoAcidKey } from "./macros";
import type { Day } from "./intake";

// Cible macro absolue journalière (structurellement identique à `MacroGoal` de
// MealPlanner) : redéfinie ici pour que ce module de calcul ne dépende pas de la
// couche UI. Seuls `proteinG` et `kcal` sont exploités par l'heuristique.
export interface MacroGoal {
  proteinG: number;
  lipidG: number;
  carbG: number;
  kcal: number;
}

export interface FoodSuggestion {
  food: Food;
  reason: string; // courte explication FR de l'intérêt de l'aliment
}

export interface SuggestionOptions {
  // Régime actif : les aliments non conformes sont écartés (via `filterFoods`).
  filter?: FoodFilter;
  // Cible macro : si fournie, ses `proteinG`/`kcal` priment sur ceux des
  // `MuscleTargets` pour estimer le déficit protéique et la pénalité calorique.
  macroGoal?: MacroGoal;
  // Nombre maximum de suggestions renvoyées (défaut 4).
  limit?: number;
  // Au-delà de ce total (g) déjà présent dans la journée, un aliment n'est plus
  // resuggéré (on cherche à diversifier, pas à empiler). Défaut 200 g.
  presentGramsThreshold?: number;
}

// Pondérations du score de complémentarité. L'AA limitant domine (cœur de la
// complémentarité), le déficit protéique vient ensuite, la densité calorique
// pénalise doucement les aliments très caloriques et peu utiles.
const WEIGHTS = { limitingAa: 0.7, protein: 0.3, kcalPenalty: 0.15 } as const;

// mg de l'AA `key` apportés par 100 g de l'aliment : profil INLINE (mg/g de
// protéine) × grammes de protéines pour 100 g. Aliment sans profil → 0.
function limitingBoostPer100g(food: Food, key: AminoAcidKey): number {
  if (!food.aaProfile) return 0;
  return food.aaProfile[key] * food.proteinPer100g;
}

// Total de grammes déjà présents pour chaque aliment (id → grammes), pour
// éviter de resuggérer un aliment déjà largement consommé.
function gramsByFood(day: Day): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of day.meals)
    for (const d of m.dishes)
      for (const i of d.ingredients)
        out[i.food.id] = (out[i.food.id] ?? 0) + i.grams;
  return out;
}

// Classe les aliments `candidates` selon leur capacité à COMPLÉTER la journée.
// Retourne un top N d'objets `{ food, reason }`. Peut renvoyer une liste vide
// (aucun candidat pertinent après filtrage), notamment si tous les aliments
// utiles sont déjà très présents. `candidates` est l'ensemble des aliments
// courants fourni par l'appelant (presets + registre), pas toute la base FR.
export function suggestFoods(
  candidates: Food[],
  day: Day,
  muscleTargets: MuscleTargets,
  options: SuggestionOptions = {},
): FoodSuggestion[] {
  const limit = options.limit ?? 4;
  const threshold = options.presentGramsThreshold ?? 200;
  const proteinTargetG = options.macroGoal?.proteinG ?? muscleTargets.proteinTargetG;
  const energyTargetKcal = options.macroGoal?.kcal ?? muscleTargets.energyTargetKcal;

  // État actuel de la journée : acide aminé limitant et protéines déjà apportées.
  const analysis = analyzeMuscleProfile(day, muscleTargets);
  const limiting = analysis.limiting; // null si aucune protéine analysable
  const deficitProteinG = Math.max(0, proteinTargetG - analysis.dayProteinG);

  const present = gramsByFood(day);
  const pool = filterFoods(candidates, options.filter ?? {}).filter(
    (f) => (present[f.id] ?? 0) < threshold,
  );

  const scored = pool.map((food) => {
    // Composante 1 : relève l'AA limitant (fraction de l'objectif du jour
    // couverte par 100 g). Nulle en l'absence d'AA limitant analysable.
    const aaFrac =
      limiting && limiting.targetMg > 0
        ? limitingBoostPer100g(food, limiting.key) / limiting.targetMg
        : 0;
    const aaContrib = WEIGHTS.limitingAa * aaFrac;

    // Composante 2 : comble le déficit protéique (fraction de la cible couverte
    // par 100 g), uniquement s'il reste un déficit.
    const proteinFrac = proteinTargetG > 0 ? food.proteinPer100g / proteinTargetG : 0;
    const proteinContrib =
      deficitProteinG > 0 ? WEIGHTS.protein * proteinFrac : 0;

    // Pénalité : densité calorique (écarte huiles/beurre et aliments peu utiles).
    const kcalPenalty =
      energyTargetKcal > 0
        ? WEIGHTS.kcalPenalty * (food.kcalPer100g / energyTargetKcal)
        : 0;

    return { food, score: aaContrib + proteinContrib - kcalPenalty, aaContrib, proteinContrib };
  });

  return scored
    .filter((s) => s.score > 0) // on ne suggère pas un aliment sans intérêt net
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ food, aaContrib, proteinContrib }) => ({
      food,
      reason: reasonFor(food, limiting, aaContrib, proteinContrib, deficitProteinG),
    }));
}

// Courte explication FR : privilégie l'angle « AA limitant » quand c'est le
// moteur du classement, sinon l'angle « protéines », sinon un libellé générique.
function reasonFor(
  food: Food,
  limiting: { name: string } | null,
  aaContrib: number,
  proteinContrib: number,
  deficitProteinG: number,
): string {
  if (limiting && food.aaProfile && aaContrib > 0 && aaContrib >= proteinContrib)
    return `riche en ${limiting.name.toLowerCase()}, l'acide aminé limitant du jour`;
  if (deficitProteinG > 0 && food.proteinPer100g >= 5)
    return "bonne source de protéines pour combler le déficit du jour";
  return "aliment complémentaire pour équilibrer la journée";
}
