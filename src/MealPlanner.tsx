// Saisie d'une journée de repas et comparaison à la cible de macros.
//
// Composant autonome : il gère en mémoire une journée (repas → plats →
// ingrédients puisés dans la base `FOODS`), agrège les macros via `intake.ts`
// et, si une cible est fournie, affiche la couverture (apport / cible).
//
// Volontairement découplé de l'API `macroTargets` : il n'accepte qu'une cible
// minimale (grammes de macro + kcal), pour être câblé dans App.tsx en une ligne
// quelle que soit la manière dont la cible est calculée.
import { useMemo, useRef, useState } from "react";
import {
  FOODS,
  FOODS_BY_ID,
  FOOD_CATEGORIES,
  FOOD_FAMILIARITIES,
  FOOD_FAMILIARITY_LABEL,
  type FoodFamiliarity,
} from "./calc/food";
import {
  dayMacros,
  dishMacros,
  mealMacros,
  type Day,
  type MacroIntake,
} from "./calc/intake";
import {
  analyzeMuscleProfile,
  type LeucineLevel,
  type MuscleAnalysis,
  type MuscleBand,
  type MuscleTargets,
} from "./calc/aminoAcids";

// Cible de comparaison, en valeurs absolues journalières.
export interface MacroGoal {
  proteinG: number;
  lipidG: number;
  carbG: number;
  kcal: number;
}

// Types d'édition : comme les types d'`intake` mais avec un identifiant stable
// pour les clés React (les aliments sont référencés par id, résolus à l'agrégation).
interface EIngredient { id: number; foodId: string; grams: number }
interface EDish { id: number; name: string; ingredients: EIngredient[] }
interface EMeal { id: number; name: string; dishes: EDish[] }

const round = (n: number) => Math.round(n);
const one = (n: number) => Math.round(n * 10) / 10;

// Conversion état d'édition → journée agrégeable par intake.ts.
function toDay(meals: EMeal[]): Day {
  return {
    meals: meals.map((m) => ({
      name: m.name,
      dishes: m.dishes.map((d) => ({
        name: d.name,
        ingredients: d.ingredients
          .map((i) => ({ food: FOODS_BY_ID[i.foodId], grams: i.grams }))
          .filter((i) => i.food !== undefined),
      })),
    })),
  };
}

function MacroPills({ m }: { m: MacroIntake }) {
  return (
    <span className="tabular-nums text-slate-500">
      {round(m.kcal)} kcal · P {round(m.proteinG)} · L {round(m.lipidG)} · G {round(m.carbG)} (g)
    </span>
  );
}

// Pastille discrète indiquant le degré de familiarité d'un aliment.
const FAMILIARITY_BADGE: Record<FoodFamiliarity, string> = {
  classique: "border-emerald-200 bg-emerald-50 text-emerald-700",
  moyen: "border-amber-200 bg-amber-50 text-amber-700",
  exotique: "border-violet-200 bg-violet-50 text-violet-700",
};

function FamiliarityBadge({ level }: { level: FoodFamiliarity }) {
  return (
    <span
      className={"shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium " + FAMILIARITY_BADGE[level]}
      title={`Familiarité : ${FOOD_FAMILIARITY_LABEL[level]}`}
    >
      {FOOD_FAMILIARITY_LABEL[level]}
    </span>
  );
}

function CoverageRow(props: { label: string; bar: string; consumed: number; target: number; unit: string }) {
  const { label, bar, consumed, target, unit } = props;
  const pct = target > 0 ? (consumed / target) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-slate-500">
          {round(consumed)} / {round(target)} {unit}
          <span className={"ml-2 " + (pct > 105 ? "text-amber-600" : "text-slate-400")}>
            {round(pct)} %
          </span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={"h-full rounded-full " + bar} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

// --- Analyse anabolique (temp.txt §4, §8-13) ---

const BAND_LABEL: Record<MuscleBand, string> = {
  excellent: "Optimisation quasi complète",
  tresBon: "Très bon profil musculaire",
  correct: "Correct mais améliorable",
  limitant: "Plusieurs facteurs limitants",
};

const BAND_STYLE: Record<MuscleBand, { text: string; bar: string; ring: string }> = {
  excellent: { text: "text-emerald-700", bar: "bg-emerald-500", ring: "border-emerald-200 bg-emerald-50" },
  tresBon: { text: "text-sky-700", bar: "bg-sky-500", ring: "border-sky-200 bg-sky-50" },
  correct: { text: "text-amber-700", bar: "bg-amber-500", ring: "border-amber-200 bg-amber-50" },
  limitant: { text: "text-red-700", bar: "bg-red-500", ring: "border-red-200 bg-red-50" },
};

const LEUCINE_STYLE: Record<LeucineLevel, { label: string; cls: string }> = {
  faible: { label: "pauvre en leucine", cls: "text-red-600" },
  min: { label: "minimum atteint", cls: "text-amber-600" },
  optimal: { label: "optimal", cls: "text-sky-600" },
  excellent: { label: "excellent", cls: "text-emerald-600" },
};

// Ligne sous-score du score musculaire (part pondérée, 0-1).
function SubScore({ label, value, weight }: { label: string; value: number; weight: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 shrink-0 text-slate-500">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-400" style={{ width: `${value * 100}%` }} />
      </div>
      <span className="w-24 shrink-0 text-right tabular-nums text-slate-400">
        {round(value * 100)} % · {round(weight * 100)} %
      </span>
    </div>
  );
}

function MuscleAnalysisPanel({ analysis }: { analysis: MuscleAnalysis }) {
  const { score, limiting, distribution, quality, aminoAcids } = analysis;
  const style = BAND_STYLE[score.band];
  return (
    <div className="mt-6 space-y-4">
      {/* Score de construction musculaire (§12) */}
      <div className={"rounded-xl border p-4 " + style.ring}>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Score de construction musculaire
            </p>
            <p className={"mt-1 text-sm font-semibold " + style.text}>{BAND_LABEL[score.band]}</p>
          </div>
          <p className={"text-3xl font-bold tabular-nums " + style.text}>
            {round(score.total)}
            <span className="text-base font-normal text-slate-400"> / 100</span>
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
          <div className={"h-full rounded-full " + style.bar} style={{ width: `${score.total}%` }} />
        </div>
        <div className="mt-3 space-y-1">
          <SubScore label="Protéines" value={score.proteinScore} weight={0.3} />
          <SubScore label="Couverture AAE" value={score.aaeScore} weight={0.25} />
          <SubScore label="Leucine" value={score.leucineScore} weight={0.2} />
          <SubScore label="Calories" value={score.calorieScore} weight={0.15} />
          <SubScore label="Répartition" value={score.distributionScore} weight={0.1} />
        </div>
        <p className="mt-2 text-right text-[10px] text-slate-400">score · poids dans la note</p>
      </div>

      {/* Acide aminé limitant (§8) */}
      {limiting ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Acide aminé limitant
          </p>
          <p className="mt-1 text-sm">
            <span className="font-semibold text-slate-800">{limiting.name}</span>
            {" — couverture "}
            <span className={limiting.coverage < 1 ? "font-semibold text-amber-600" : "font-semibold text-emerald-600"}>
              {round(limiting.coverage * 100)} %
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Le potentiel anabolique de la journée est plafonné par cet acide aminé
            (le moins couvert). Diversifiez les sources protéiques pour le relever.
          </p>
          <details className="group mt-2">
            <summary className="cursor-pointer text-xs text-slate-600 hover:underline">
              Couverture des 9 acides aminés indispensables
            </summary>
            <div className="mt-2 space-y-1">
              {[...aminoAcids].sort((a, b) => a.coverage - b.coverage).map((c) => (
                <div key={c.key} className="flex items-center gap-2 text-xs">
                  <span className="w-52 shrink-0 truncate text-slate-600" title={c.name}>{c.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={"h-full rounded-full " + (c.coverage < 1 ? "bg-amber-400" : "bg-emerald-400")}
                      style={{ width: `${Math.min(c.coverage * 100, 100)}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right tabular-nums text-slate-500">{round(c.coverage * 100)} %</span>
                </div>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Objectifs = minimums OMS × facteur sportif du profil (temp.txt §6-7).
            </p>
          </details>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
          Ajoutez des aliments riches en protéines pour analyser la couverture des
          acides aminés et l'acide aminé limitant.
        </div>
      )}

      {/* Qualité protéique (§11) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Qualité protéique
          </span>
          <span className="font-semibold tabular-nums text-slate-800">
            {round(quality.score)} / 100
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${quality.score}%` }} />
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Moyenne des sources protéiques pondérée par les grammes (œufs/laitages/
          poisson/viande &gt; soja &gt; légumineuses &gt; céréales).
        </p>
      </div>

      {/* Leucine et distribution par repas (§9-10) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Leucine et répartition par repas
          </span>
          <span className={"text-xs font-medium " + (distribution.bonus ? "text-emerald-600" : "text-slate-400")}>
            {distribution.peaks} pic{distribution.peaks > 1 ? "s" : ""} anabolique{distribution.peaks > 1 ? "s" : ""}
            {distribution.bonus ? " · bonus 3-5 ✓" : ""}
          </span>
        </div>
        <div className="space-y-1">
          {distribution.meals.map((m, i) => {
            const leu = LEUCINE_STYLE[m.leucineLevel];
            return (
              <div key={i} className="flex items-center justify-between border-b border-slate-100 py-1 text-sm">
                <span className="truncate text-slate-600">
                  {m.name}
                  {m.isAnabolicPeak && <span className="ml-1 text-emerald-500" title="Pic anabolique (≥ 25 g)">●</span>}
                </span>
                <span className="tabular-nums text-slate-500">
                  {one(m.qualityProteinG)} g qualité · leucine {one(m.leucineG)} g
                  <span className={"ml-2 " + leu.cls}>{leu.label}</span>
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Cible : 25-40 g de protéines de qualité par prise et ≥ 2 g de leucine
          (optimal 2,5 g). 3 à 5 pics anaboliques dans la journée = bonus.
        </p>
      </div>
    </div>
  );
}

export function MealPlanner({ target, muscleTargets }: { target?: MacroGoal; muscleTargets?: MuscleTargets }) {
  const [meals, setMeals] = useState<EMeal[]>([]);
  // Filtre de familiarité restreignant la liste d'ingrédients ("tous" = aucun filtre).
  const [familiarityFilter, setFamiliarityFilter] = useState<FoodFamiliarity | "tous">("tous");
  const nextId = useRef(1);
  const id = () => nextId.current++;

  const day = useMemo(() => toDay(meals), [meals]);
  const total = useMemo(() => dayMacros(day), [day]);
  const analysis = useMemo(
    () => (muscleTargets ? analyzeMuscleProfile(day, muscleTargets) : null),
    [day, muscleTargets],
  );

  const addMeal = () =>
    setMeals((ms) => [...ms, { id: id(), name: `Repas ${ms.length + 1}`, dishes: [] }]);

  const removeMeal = (mealId: number) =>
    setMeals((ms) => ms.filter((m) => m.id !== mealId));

  const renameMeal = (mealId: number, name: string) =>
    setMeals((ms) => ms.map((m) => (m.id === mealId ? { ...m, name } : m)));

  const addDish = (mealId: number) =>
    setMeals((ms) =>
      ms.map((m) =>
        m.id === mealId
          ? { ...m, dishes: [...m.dishes, { id: id(), name: `Plat ${m.dishes.length + 1}`, ingredients: [] }] }
          : m,
      ),
    );

  const removeDish = (mealId: number, dishId: number) =>
    setMeals((ms) =>
      ms.map((m) => (m.id === mealId ? { ...m, dishes: m.dishes.filter((d) => d.id !== dishId) } : m)),
    );

  const renameDish = (mealId: number, dishId: number, name: string) =>
    setMeals((ms) =>
      ms.map((m) =>
        m.id === mealId
          ? { ...m, dishes: m.dishes.map((d) => (d.id === dishId ? { ...d, name } : d)) }
          : m,
      ),
    );

  const addIngredient = (mealId: number, dishId: number) =>
    setMeals((ms) =>
      ms.map((m) =>
        m.id === mealId
          ? {
              ...m,
              dishes: m.dishes.map((d) =>
                d.id === dishId
                  ? { ...d, ingredients: [...d.ingredients, { id: id(), foodId: FOODS[0].id, grams: 100 }] }
                  : d,
              ),
            }
          : m,
      ),
    );

  const removeIngredient = (mealId: number, dishId: number, ingId: number) =>
    setMeals((ms) =>
      ms.map((m) =>
        m.id === mealId
          ? {
              ...m,
              dishes: m.dishes.map((d) =>
                d.id === dishId
                  ? { ...d, ingredients: d.ingredients.filter((i) => i.id !== ingId) }
                  : d,
              ),
            }
          : m,
      ),
    );

  const setIngredient = (mealId: number, dishId: number, ingId: number, patch: Partial<EIngredient>) =>
    setMeals((ms) =>
      ms.map((m) =>
        m.id === mealId
          ? {
              ...m,
              dishes: m.dishes.map((d) =>
                d.id === dishId
                  ? {
                      ...d,
                      ingredients: d.ingredients.map((i) => (i.id === ingId ? { ...i, ...patch } : i)),
                    }
                  : d,
              ),
            }
          : m,
      ),
    );

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Repas de la journée</h2>
        <button
          type="button"
          onClick={addMeal}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Ajouter un repas
        </button>
      </div>

      {/* Filtre de familiarité : restreint la liste d'ingrédients proposée. */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <label htmlFor="familiarity-filter" className="text-slate-500">
          Familiarité des aliments
        </label>
        <select
          id="familiarity-filter"
          value={familiarityFilter}
          onChange={(e) => setFamiliarityFilter(e.target.value as FoodFamiliarity | "tous")}
          className="rounded border border-slate-300 bg-white px-2 py-1 focus:border-emerald-500 focus:outline-none"
        >
          <option value="tous">Tous les niveaux</option>
          {FOOD_FAMILIARITIES.map((f) => (
            <option key={f} value={f}>{FOOD_FAMILIARITY_LABEL[f]}</option>
          ))}
        </select>
      </div>

      {meals.length === 0 ? (
        <p className="text-sm text-slate-400">
          Aucun repas. Ajoutez un repas, puis des plats et des ingrédients pour
          construire votre journée.
        </p>
      ) : (
        <div className="space-y-4">
          {meals.map((meal) => {
            const dm = day.meals[meals.indexOf(meal)];
            return (
              <div key={meal.id} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <input
                    value={meal.name}
                    onChange={(e) => renameMeal(meal.id, e.target.value)}
                    className="flex-1 rounded-lg border border-transparent px-2 py-1 font-medium hover:border-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                  {dm && <MacroPills m={mealMacros(dm)} />}
                  <button
                    type="button"
                    onClick={() => removeMeal(meal.id)}
                    className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Supprimer le repas"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 pl-2">
                  {meal.dishes.map((dish) => {
                    const dd = dm?.dishes[meal.dishes.indexOf(dish)];
                    return (
                      <div key={dish.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <input
                            value={dish.name}
                            onChange={(e) => renameDish(meal.id, dish.id, e.target.value)}
                            className="flex-1 rounded border border-transparent px-2 py-1 text-sm font-medium hover:border-slate-200 focus:border-emerald-500 focus:outline-none"
                          />
                          {dd && <MacroPills m={dishMacros(dd)} />}
                          <button
                            type="button"
                            onClick={() => removeDish(meal.id, dish.id)}
                            className="rounded px-2 py-0.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Supprimer le plat"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="space-y-2">
                          {dish.ingredients.map((ing) => {
                            const selectedFood = FOODS_BY_ID[ing.foodId];
                            // On applique le filtre de familiarité, mais l'aliment
                            // déjà sélectionné reste toujours proposé pour ne pas
                            // casser la sélection en cours.
                            const visible = FOODS.filter(
                              (f) =>
                                familiarityFilter === "tous" ||
                                f.familiarity === familiarityFilter ||
                                f.id === ing.foodId,
                            );
                            return (
                            <div key={ing.id} className="flex items-center gap-2 text-sm">
                              <select
                                value={ing.foodId}
                                onChange={(e) => setIngredient(meal.id, dish.id, ing.id, { foodId: e.target.value })}
                                className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 focus:border-emerald-500 focus:outline-none"
                              >
                                {FOOD_CATEGORIES.map((cat) => {
                                  const items = visible.filter((f) => f.category === cat);
                                  if (items.length === 0) return null;
                                  return (
                                    <optgroup key={cat} label={cat}>
                                      {items.map((f) => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                      ))}
                                    </optgroup>
                                  );
                                })}
                              </select>
                              {selectedFood && <FamiliarityBadge level={selectedFood.familiarity} />}
                              <input
                                type="number"
                                min={0}
                                value={ing.grams}
                                onChange={(e) => setIngredient(meal.id, dish.id, ing.id, { grams: Number(e.target.value) })}
                                className="w-20 rounded border border-slate-300 px-2 py-1 text-right focus:border-emerald-500 focus:outline-none"
                              />
                              <span className="w-6 text-slate-400">g</span>
                              <button
                                type="button"
                                onClick={() => removeIngredient(meal.id, dish.id, ing.id)}
                                className="rounded px-1.5 text-xs text-slate-300 hover:text-red-600"
                                aria-label="Supprimer l'ingrédient"
                              >
                                ✕
                              </button>
                            </div>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => addIngredient(meal.id, dish.id)}
                            className="text-xs text-emerald-700 hover:underline"
                          >
                            + Ajouter un ingrédient
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => addDish(meal.id)}
                    className="text-sm text-emerald-700 hover:underline"
                  >
                    + Ajouter un plat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-emerald-800">Total de la journée</span>
          <MacroPills m={total} />
        </div>

        {target && (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Couverture de la cible
            </p>
            <CoverageRow label="Énergie" bar="bg-emerald-500" consumed={total.kcal} target={target.kcal} unit="kcal" />
            <CoverageRow label="Protéines" bar="bg-sky-500" consumed={total.proteinG} target={target.proteinG} unit="g" />
            <CoverageRow label="Lipides" bar="bg-amber-500" consumed={total.lipidG} target={target.lipidG} unit="g" />
            <CoverageRow label="Glucides" bar="bg-emerald-500" consumed={total.carbG} target={target.carbG} unit="g" />
          </div>
        )}
      </div>

      {analysis && meals.length > 0 && <MuscleAnalysisPanel analysis={analysis} />}

      <p className="mt-4 text-xs text-slate-400">
        Valeurs nutritionnelles indicatives (table CIQUAL/ANSES, pour 100 g ;
        acides aminés estimés par profil de source, temp.txt §5-7), à revalider.
        Analyse anabolique et scores : extrapolations produit, pas des
        recommandations officielles. Outil informatif — ne remplace pas un avis diététique.
      </p>
    </section>
  );
}
