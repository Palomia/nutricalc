// Saisie d'une journée de repas et comparaison à la cible de macros.
//
// Composant autonome : il gère en mémoire une journée (repas → plats →
// ingrédients puisés dans la base `FOODS`), agrège les macros via `intake.ts`
// et, si une cible est fournie, affiche la couverture (apport / cible).
//
// Volontairement découplé de l'API `macroTargets` : il n'accepte qu'une cible
// minimale (grammes de macro + kcal), pour être câblé dans App.tsx en une ligne
// quelle que soit la manière dont la cible est calculée.
import { useEffect, useMemo, useRef, useState } from "react";
import { FOODS, FOODS_BY_ID, FOOD_CATEGORIES, filterFoods, type FoodFilter } from "./calc/food";
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
import {
  DAY_KEY,
  SAVED_MEALS_KEY,
  SAVED_DISHES_KEY,
  serializeDay,
  serializeSaved,
  deserializeDay,
  deserializeSavedMeals,
  deserializeSavedDishes,
  nextIdFrom,
  toSavedMeal,
  toSavedDish,
  fromSavedMeal,
  fromSavedDish,
} from "./calc/storage";
import type { EMeal, EIngredient, SavedMeal, SavedDish } from "./calc/storage";
import {
  COOKING_METHODS,
  cookingIngredients,
  VINAIGRETTE,
  type ComboIngredient,
  type CookingMethod,
} from "./calc/cooking";
import { buildPresetDay } from "./calc/presetDay";
import { toGrams, UNITS, UNIT_LABELS, DEFAULT_UNIT } from "./calc/units";

// Cible de comparaison, en valeurs absolues journalières.
export interface MacroGoal {
  proteinG: number;
  lipidG: number;
  carbG: number;
  kcal: number;
}

// Types d'édition (EMeal/EDish/EIngredient) et fonctions de (dé)sérialisation :
// cf. `./calc/storage`. Les aliments sont référencés par id, résolus à l'agrégation.

// Lecture localStorage tolérante (SSR/tests sans DOM, quota, JSON absent).
function loadRaw(key: string): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}
function saveRaw(key: string, value: string): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  } catch {
    // quota dépassé / stockage indisponible : on ignore silencieusement.
  }
}

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
          // La quantité saisie (dans son unité ménagère) est convertie en
          // grammes ici, pour qu'intake.ts reste une simple règle de trois.
          .map((i) => ({ food: FOODS_BY_ID[i.foodId], grams: toGrams(i.quantity, i.unit) }))
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

// Infobulle pédagogique locale (contenu UI seulement, sans effet sur le calcul).
// Reprend le style des infobulles d'App.tsx (bordure slate, fond blanc, ombre,
// texte xs, titres emerald-700) via une icône ⓘ, affichée au survol ET au focus
// clavier pour rester accessible.
interface InfoTipContent {
  intro: string;
  sections: { heading: string; items: string[] }[];
}

function InfoTip({ label, tip }: { label: string; tip: InfoTipContent }) {
  return (
    <span
      tabIndex={0}
      role="button"
      aria-label={label}
      className="group/tip relative inline-flex cursor-help items-center align-middle"
    >
      <span aria-hidden className="text-xs text-slate-400">ⓘ</span>
      <div
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden w-72 rounded-lg border border-slate-200 bg-white p-3 text-left text-xs normal-case leading-relaxed tracking-normal text-slate-600 shadow-lg group-hover/tip:block group-focus-within/tip:block"
      >
        <p className="mb-2 font-medium text-slate-800">{tip.intro}</p>
        {tip.sections.map((s, i) => (
          <div key={s.heading}>
            <p className="font-semibold text-emerald-700">{s.heading}</p>
            <ul className={(i < tip.sections.length - 1 ? "mb-2 " : "") + "ml-4 list-disc"}>
              {s.items.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </span>
  );
}

// Explication de la « leucine anabolique » : pourquoi viser des pics répartis.
const LEUCINE_ANABOLIC_TIP: InfoTipContent = {
  intro:
    "La leucine est l'acide aminé qui « déclenche » la synthèse des protéines musculaires (MPS) après un repas.",
  sections: [
    {
      heading: "Un seuil à atteindre par repas",
      items: [
        "Il faut ~2 à 3 g de leucine (optimal ~2,5 g) et ~25 à 40 g de protéines de qualité dans une même prise pour déclencher un pic anabolique.",
        "En dessous du seuil, la MPS n'est stimulée que partiellement.",
      ],
    },
    {
      heading: "Pourquoi répartir les pics",
      items: [
        "Viser 3 à 5 pics dans la journée relance la MPS plusieurs fois.",
        "À quantité totale de protéines égale, c'est plus favorable à la construction musculaire qu'un seul gros apport.",
      ],
    },
    {
      heading: "À garder en tête",
      items: [
        "Ce raisonnement est PAR REPAS, distinct de la couverture JOURNALIÈRE des besoins en leucine.",
        "Un total journalier élevé ne garantit pas que chaque prise atteigne le seuil.",
        "Repères indicatifs (physiologie du sport), pas une prescription.",
      ],
    },
  ],
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
          <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            Leucine et répartition par repas
            <InfoTip label="En savoir plus sur la leucine et les pics anaboliques" tip={LEUCINE_ANABOLIC_TIP} />
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

// Menu déroulant sobre listant les modèles enregistrés (repas ou plats) avec,
// pour chacun, l'insertion et la suppression. Réutilise l'esthétique <details>
// des panneaux existants.
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

// Menu « Cuisson » : matière grasse ajoutée au plat (tâche #10). « À sec »
// n'ajoute rien. Reprend l'esthétique <details> des autres menus.
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

export function MealPlanner({ target, muscleTargets }: { target?: MacroGoal; muscleTargets?: MuscleTargets }) {
  // Journée en cours restaurée depuis localStorage (état vide si absent/invalide).
  const [meals, setMeals] = useState<EMeal[]>(() => deserializeDay(loadRaw(DAY_KEY)));
  // Compteur d'ids : au-delà du max des ids restaurés pour éviter les collisions.
  const nextId = useRef(0);
  if (nextId.current === 0) nextId.current = nextIdFrom(meals);
  const id = () => nextId.current++;

  // Bibliothèque de modèles réutilisables (repas / plats enregistrés).
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>(() =>
    deserializeSavedMeals(loadRaw(SAVED_MEALS_KEY)),
  );
  const [savedDishes, setSavedDishes] = useState<SavedDish[]>(() =>
    deserializeSavedDishes(loadRaw(SAVED_DISHES_KEY)),
  );

  // Persistance : à chaque changement, on réécrit la clé correspondante.
  useEffect(() => saveRaw(DAY_KEY, serializeDay(meals)), [meals]);
  useEffect(() => saveRaw(SAVED_MEALS_KEY, serializeSaved(savedMeals)), [savedMeals]);
  useEffect(() => saveRaw(SAVED_DISHES_KEY, serializeSaved(savedDishes)), [savedDishes]);

  // Filtres de régime appliqués aux aliments proposés dans les <select>.
  const [filters, setFilters] = useState<FoodFilter>({});
  const filteredFoods = useMemo(() => filterFoods(FOODS, filters), [filters]);

  // Options d'un <select> d'ingrédient, groupées par catégorie et restreintes
  // au filtre. L'aliment déjà sélectionné est toujours conservé (même s'il ne
  // passe plus le filtre) et signalé « hors filtre », pour ne pas le faire
  // disparaître silencieusement et corrompre le state.
  const foodOptions = (selectedId: string) => {
    const selected = FOODS_BY_ID[selectedId];
    const outsideFilter = !!selected && !filteredFoods.some((f) => f.id === selectedId);
    return FOOD_CATEGORIES.map((cat) => {
      const foods = filteredFoods.filter((f) => f.category === cat);
      if (outsideFilter && selected.category === cat) foods.push(selected);
      if (foods.length === 0) return null;
      return (
        <optgroup key={cat} label={cat}>
          {foods.map((f) => (
            <option key={f.id} value={f.id}>
              {outsideFilter && f.id === selectedId ? `${f.name} (hors filtre)` : f.name}
            </option>
          ))}
        </optgroup>
      );
    });
  };


  const day = useMemo(() => toDay(meals), [meals]);
  const total = useMemo(() => dayMacros(day), [day]);
  const analysis = useMemo(
    () => (muscleTargets ? analyzeMuscleProfile(day, muscleTargets) : null),
    [day, muscleTargets],
  );

  const addMeal = () =>
    setMeals((ms) => [...ms, { id: id(), name: `Repas ${ms.length + 1}`, dishes: [] }]);

  // Charge la journée type (§13) : ids frais via l'allocateur commun. Si la
  // journée n'est pas vide, on demande confirmation avant de la remplacer.
  const loadPresetDay = () => {
    if (meals.length > 0 && !window.confirm("Remplacer la journée en cours par une journée type ?")) {
      return;
    }
    setMeals(buildPresetDay(id));
  };

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
                  ? { ...d, ingredients: [...d.ingredients, { id: id(), foodId: (filteredFoods[0] ?? FOODS[0]).id, quantity: 100, unit: DEFAULT_UNIT }] }
                  : d,
              ),
            }
          : m,
      ),
    );

  // Ajout groupé d'ingrédients préréglés (cuisson / vinaigrette). Chaque item
  // reçoit un id d'édition frais ; « à sec » (liste vide) ne change rien.
  const addIngredients = (mealId: number, dishId: number, items: ComboIngredient[]) => {
    if (items.length === 0) return;
    setMeals((ms) =>
      ms.map((m) =>
        m.id === mealId
          ? {
              ...m,
              dishes: m.dishes.map((d) =>
                d.id === dishId
                  ? {
                      ...d,
                      ingredients: [
                        ...d.ingredients,
                        // Les combos (cuisson/vinaigrette) sont exprimés en
                        // grammes → on les insère avec l'unité « gramme ».
                        ...items.map((it) => ({ id: id(), foodId: it.foodId, quantity: it.grams, unit: DEFAULT_UNIT })),
                      ],
                    }
                  : d,
              ),
            }
          : m,
      ),
    );
  };

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

  // --- Bibliothèque : enregistrer / insérer / supprimer des modèles ---

  const saveMeal = (mealId: number) => {
    const m = meals.find((x) => x.id === mealId);
    if (!m) return;
    const name = window.prompt("Enregistrer ce repas sous le nom :", m.name);
    if (!name) return;
    setSavedMeals((ls) => [...ls, { ...toSavedMeal(m), name }]);
  };

  const insertSavedMeal = (index: number) =>
    setMeals((ms) => [...ms, fromSavedMeal(savedMeals[index], id)]);

  const deleteSavedMeal = (index: number) =>
    setSavedMeals((ls) => ls.filter((_, i) => i !== index));

  const saveDish = (mealId: number, dishId: number) => {
    const d = meals.find((x) => x.id === mealId)?.dishes.find((x) => x.id === dishId);
    if (!d) return;
    const name = window.prompt("Enregistrer ce plat sous le nom :", d.name);
    if (!name) return;
    setSavedDishes((ls) => [...ls, { ...toSavedDish(d), name }]);
  };

  const insertSavedDish = (mealId: number, index: number) =>
    setMeals((ms) =>
      ms.map((m) =>
        m.id === mealId
          ? { ...m, dishes: [...m.dishes, fromSavedDish(savedDishes[index], id)] }
          : m,
      ),
    );

  const deleteSavedDish = (index: number) =>
    setSavedDishes((ls) => ls.filter((_, i) => i !== index));

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Repas de la journée</h2>
        <div className="flex items-center gap-2">
          <LibraryMenu
            label="Insérer un repas enregistré"
            empty="Aucun repas enregistré. Utilisez « Enregistrer » sur un repas."
            names={savedMeals.map((m) => m.name)}
            onInsert={insertSavedMeal}
            onDelete={deleteSavedMeal}
          />
          <button
            type="button"
            onClick={loadPresetDay}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Charger une journée type
          </button>
          <button
            type="button"
            onClick={addMeal}
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
                    onChange={(e) => renameMeal(meal.id, e.target.value)}
                    className="flex-1 rounded-lg border border-transparent px-2 py-1 font-medium hover:border-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                  {dm && <MacroPills m={mealMacros(dm)} />}
                  <button
                    type="button"
                    onClick={() => saveMeal(meal.id)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                  >
                    Enregistrer
                  </button>
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
                            onClick={() => saveDish(meal.id, dish.id)}
                            className="rounded px-2 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            Enregistrer
                          </button>
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
                                {foodOptions(ing.foodId)}
                              </select>
                              <input
                                type="number"
                                min={0}
                                value={ing.quantity}
                                onChange={(e) => setIngredient(meal.id, dish.id, ing.id, { quantity: Number(e.target.value) })}
                                className="w-20 rounded border border-slate-300 px-2 py-1 text-right focus:border-emerald-500 focus:outline-none"
                              />
                              <select
                                value={ing.unit}
                                onChange={(e) => setIngredient(meal.id, dish.id, ing.id, { unit: e.target.value as EIngredient["unit"] })}
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
                                onClick={() => removeIngredient(meal.id, dish.id, ing.id)}
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
                              onClick={() => addIngredient(meal.id, dish.id)}
                              className="text-xs text-emerald-700 hover:underline"
                            >
                              + Ajouter un ingrédient
                            </button>
                            <CookingMenu
                              onSelect={(method) => addIngredients(meal.id, dish.id, cookingIngredients(method))}
                            />
                            <button
                              type="button"
                              onClick={() => addIngredients(meal.id, dish.id, VINAIGRETTE)}
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
                      onClick={() => addDish(meal.id)}
                      className="text-sm text-emerald-700 hover:underline"
                    >
                      + Ajouter un plat
                    </button>
                    <LibraryMenu
                      label="Insérer un plat enregistré"
                      empty="Aucun plat enregistré. Utilisez « Enregistrer » sur un plat."
                      names={savedDishes.map((d) => d.name)}
                      onInsert={(index) => insertSavedDish(meal.id, index)}
                      onDelete={deleteSavedDish}
                    />
                  </div>
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
