// Onglet « Repas » : SAISIE pure d'une journée (repas → plats → ingrédients).
//
// Filtres de régime, unités ménagères, boutons cuisson/vinaigrette, bouton
// « journée type » et bibliothèque de modèles (repas / plats enregistrés).
// AUCUNE analyse ici : la couverture des cibles et l'analyse anabolique vivent
// dans l'onglet « Comptes rendus ». Tout l'état vient du hook `useMeals` pour
// être partagé avec l'analyse.
import { useEffect, useRef, useState } from "react";
import type { Food, FoodFilter } from "./calc/food";
import { searchFoodsFr } from "./calc/foodsFr";
import { dishMacros, mealMacros, type MacroIntake } from "./calc/intake";
import { COOKING_METHODS, cookingIngredients, VINAIGRETTE, type CookingMethod } from "./calc/cooking";
import { toGrams, UNITS, UNIT_LABELS } from "./calc/units";
import type { EIngredient } from "./calc/storage";
import type { UseMeals } from "./useMeals";

const round = (n: number) => Math.round(n);
const one = (n: number) => Math.round(n * 10) / 10;

function MacroPills({ m }: { m: MacroIntake }) {
  return (
    <span className="tabular-nums text-slate-500">
      {round(m.kcal)} kcal · P {round(m.proteinG)} · L {round(m.lipidG)} · G {round(m.carbG)} (g)
    </span>
  );
}

// Case à cocher sobre pour la barre de filtres de régime.
function FilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
      />
      {label}
    </label>
  );
}

// Menu déroulant sobre listant les modèles enregistrés (repas ou plats) avec,
// pour chacun, l'insertion et la suppression.
function LibraryMenu(props: {
  label: string;
  empty: string;
  names: string[];
  onInsert: (index: number) => void;
  onDelete: (index: number) => void;
}) {
  const { label, empty, names, onInsert, onDelete } = props;
  return (
    <details className="group relative">
      <summary className="cursor-pointer list-none rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
        {label}
        {names.length > 0 && <span className="ml-1 text-slate-400">({names.length})</span>}
      </summary>
      <div className="absolute right-0 z-10 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
        {names.length === 0 ? (
          <p className="px-2 py-1 text-xs text-slate-400">{empty}</p>
        ) : (
          <ul className="space-y-0.5">
            {names.map((name, i) => (
              <li key={i} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onInsert(i)}
                  className="flex-1 truncate rounded px-2 py-1 text-left text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                  title={`Insérer « ${name} »`}
                >
                  {name}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(i)}
                  className="rounded px-1.5 py-1 text-xs text-slate-300 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Supprimer le modèle « ${name} »`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

// Menu « Cuisson » : matière grasse ajoutée au plat. « À sec » n'ajoute rien.
function CookingMenu({ onSelect }: { onSelect: (method: CookingMethod) => void }) {
  return (
    <details className="group relative">
      <summary className="cursor-pointer list-none text-xs text-emerald-700 hover:underline">
        Cuisson
      </summary>
      <div className="absolute left-0 z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
        <ul className="space-y-0.5">
          {COOKING_METHODS.map(({ method, label }) => (
            <li key={method}>
              <button
                type="button"
                onClick={(e) => {
                  onSelect(method);
                  // Referme le menu <details> après le choix.
                  e.currentTarget.closest("details")?.removeAttribute("open");
                }}
                className="w-full rounded px-2 py-1 text-left text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

// Champ de recherche d'ingrédient (combobox) sur les 7 793 aliments FR, chargés
// PARESSEUSEMENT à la première ouverture. Respecte les filtres de régime (mode
// tolérant : les régimes « incertains » ne sont pas masqués mais signalés).
function FoodCombobox({
  value,
  filters,
  onSelect,
}: {
  value: Food | undefined;
  filters: FoodFilter;
  onSelect: (food: Food) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Fermeture au clic à l'extérieur.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Recherche (léger debounce) : déclenche le chargement paresseux de la base.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      searchFoodsFr(query, filters)
        .then((r) => {
          if (alive) {
            setResults(r);
            setLoading(false);
          }
        })
        .catch(() => {
          if (alive) {
            setResults([]);
            setLoading(false);
          }
        });
    }, 120);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [open, query, filters]);

  const anyDietFilter = !!filters.vegetarian || !!filters.vegan;

  return (
    <div ref={boxRef} className="relative flex-1">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setQuery("");
        }}
        className="flex w-full items-center justify-between gap-2 rounded border border-slate-300 bg-white px-2 py-1 text-left focus:border-emerald-500 focus:outline-none"
      >
        <span className={"truncate " + (value ? "" : "text-slate-400")}>
          {value ? value.name : "Choisir un aliment…"}
        </span>
        <span aria-hidden className="shrink-0 text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-1 w-[30rem] max-w-[80vw] rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un aliment (base de 7 793)…"
              className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <ul className="max-h-72 overflow-auto py-1">
            {loading && <li className="px-3 py-2 text-xs text-slate-400">Chargement…</li>}
            {!loading && results.length === 0 && (
              <li className="px-3 py-2 text-xs text-slate-400">Aucun aliment trouvé.</li>
            )}
            {!loading &&
              results.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(f);
                      setOpen(false);
                    }}
                    className="flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left text-sm hover:bg-emerald-50"
                  >
                    <span className="min-w-0 flex-1 truncate text-slate-700">
                      {f.name}
                      {anyDietFilter && f.dietUncertain && (
                        <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-700">
                          régime incertain
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-slate-400" title={f.category}>
                      {round(f.kcalPer100g)} kcal · P {one(f.proteinPer100g)}
                    </span>
                  </button>
                </li>
              ))}
          </ul>
          <p className="border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-400">
            Base USDA SR Legacy traduite (pour 100 g). Noms parfois littéraux ;
            régime heuristique (cf. « régime incertain »).
          </p>
        </div>
      )}
    </div>
  );
}

export function MealEditor({ meals: m }: { meals: UseMeals }) {
  const { meals, day, savedMeals, savedDishes, filters, setFilters } = m;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Repas de la journée</h2>
        <div className="flex items-center gap-2">
          <LibraryMenu
            label="Insérer un repas enregistré"
            empty="Aucun repas enregistré. Utilisez « Enregistrer » sur un repas."
            names={savedMeals.map((sm) => sm.name)}
            onInsert={m.insertSavedMeal}
            onDelete={m.deleteSavedMeal}
          />
          <button
            type="button"
            onClick={m.loadPresetDay}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Charger une journée type
          </button>
          <button
            type="button"
            onClick={m.addMeal}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Ajouter un repas
          </button>
        </div>
      </div>

      {/* Barre de filtres : restreint les aliments proposés dans tous les
          <select> d'ingrédients. */}
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Filtres</span>
        <FilterCheckbox label="Végétarien" checked={!!filters.vegetarian} onChange={(v) => setFilters((f) => ({ ...f, vegetarian: v }))} />
        <FilterCheckbox label="Vegan" checked={!!filters.vegan} onChange={(v) => setFilters((f) => ({ ...f, vegan: v }))} />
        <FilterCheckbox label="Non transformé" checked={!!filters.unprocessed} onChange={(v) => setFilters((f) => ({ ...f, unprocessed: v }))} />
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
                    onChange={(e) => m.renameMeal(meal.id, e.target.value)}
                    className="flex-1 rounded-lg border border-transparent px-2 py-1 font-medium hover:border-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                  {dm && <MacroPills m={mealMacros(dm)} />}
                  <button
                    type="button"
                    onClick={() => m.saveMeal(meal.id)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => m.removeMeal(meal.id)}
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
                            onChange={(e) => m.renameDish(meal.id, dish.id, e.target.value)}
                            className="flex-1 rounded border border-transparent px-2 py-1 text-sm font-medium hover:border-slate-200 focus:border-emerald-500 focus:outline-none"
                          />
                          {dd && <MacroPills m={dishMacros(dd)} />}
                          <button
                            type="button"
                            onClick={() => m.saveDish(meal.id, dish.id)}
                            className="rounded px-2 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            Enregistrer
                          </button>
                          <button
                            type="button"
                            onClick={() => m.removeDish(meal.id, dish.id)}
                            className="rounded px-2 py-0.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Supprimer le plat"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="space-y-2">
                          {dish.ingredients.map((ing) => (
                            <div key={ing.id} className="flex items-center gap-2 text-sm">
                              <FoodCombobox
                                value={m.resolveFood(ing.foodId)}
                                filters={filters}
                                onSelect={(food) => m.setIngredientFood(meal.id, dish.id, ing.id, food)}
                              />
                              <input
                                type="number"
                                min={0}
                                value={ing.quantity}
                                onChange={(e) => m.setIngredient(meal.id, dish.id, ing.id, { quantity: Number(e.target.value) })}
                                className="w-20 rounded border border-slate-300 px-2 py-1 text-right focus:border-emerald-500 focus:outline-none"
                              />
                              <select
                                value={ing.unit}
                                onChange={(e) => m.setIngredient(meal.id, dish.id, ing.id, { unit: e.target.value as EIngredient["unit"] })}
                                className="w-28 rounded border border-slate-300 bg-white px-2 py-1 focus:border-emerald-500 focus:outline-none"
                                aria-label="Unité"
                              >
                                {UNITS.map((u) => (
                                  <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                                ))}
                              </select>
                              {/* Équivalent en grammes toujours affiché (base des calculs). */}
                              <span className="w-16 shrink-0 text-xs tabular-nums text-slate-400" title="Équivalent en grammes utilisé pour les calculs">
                                ≈ {one(toGrams(ing.quantity, ing.unit))} g
                              </span>
                              <button
                                type="button"
                                onClick={() => m.removeIngredient(meal.id, dish.id, ing.id)}
                                className="rounded px-1.5 text-xs text-slate-300 hover:text-red-600"
                                aria-label="Supprimer l'ingrédient"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => m.addIngredient(meal.id, dish.id)}
                              className="text-xs text-emerald-700 hover:underline"
                            >
                              + Ajouter un ingrédient
                            </button>
                            <CookingMenu
                              onSelect={(method) => m.addIngredients(meal.id, dish.id, cookingIngredients(method))}
                            />
                            <button
                              type="button"
                              onClick={() => m.addIngredients(meal.id, dish.id, VINAIGRETTE)}
                              className="text-xs text-emerald-700 hover:underline"
                            >
                              + Vinaigrette
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => m.addDish(meal.id)}
                      className="text-sm text-emerald-700 hover:underline"
                    >
                      + Ajouter un plat
                    </button>
                    <LibraryMenu
                      label="Insérer un plat enregistré"
                      empty="Aucun plat enregistré. Utilisez « Enregistrer » sur un plat."
                      names={savedDishes.map((d) => d.name)}
                      onInsert={(index) => m.insertSavedDish(meal.id, index)}
                      onDelete={m.deleteSavedDish}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        Valeurs nutritionnelles indicatives (USDA SR Legacy traduite, pour 100 g),
        à revalider. Rendez-vous dans « Comptes rendus » pour l'analyse de la journée.
      </p>
    </section>
  );
}
