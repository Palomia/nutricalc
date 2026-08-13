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
import { FOODS, FOODS_BY_ID, FOOD_CATEGORIES } from "./calc/food";
import {
  dayMacros,
  dishMacros,
  mealMacros,
  type Day,
  type MacroIntake,
} from "./calc/intake";

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

export function MealPlanner({ target }: { target?: MacroGoal }) {
  const [meals, setMeals] = useState<EMeal[]>([]);
  const nextId = useRef(1);
  const id = () => nextId.current++;

  const day = useMemo(() => toDay(meals), [meals]);
  const total = useMemo(() => dayMacros(day), [day]);

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
                          {dish.ingredients.map((ing) => (
                            <div key={ing.id} className="flex items-center gap-2 text-sm">
                              <select
                                value={ing.foodId}
                                onChange={(e) => setIngredient(meal.id, dish.id, ing.id, { foodId: e.target.value })}
                                className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 focus:border-emerald-500 focus:outline-none"
                              >
                                {FOOD_CATEGORIES.map((cat) => (
                                  <optgroup key={cat} label={cat}>
                                    {FOODS.filter((f) => f.category === cat).map((f) => (
                                      <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
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
                          ))}
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

      <p className="mt-4 text-xs text-slate-400">
        Valeurs nutritionnelles indicatives (table CIQUAL/ANSES, pour 100 g),
        à revalider. Outil informatif — ne remplace pas un avis diététique.
      </p>
    </section>
  );
}
