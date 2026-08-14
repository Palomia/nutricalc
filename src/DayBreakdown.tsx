// Détail des apports par maille (onglet « Comptes rendus », tâche #19).
//
// Vue hiérarchique repas → plats → ingrédients. À chaque niveau on montre les
// MACROS (kcal, P/L/G) et, de façon repliable, les 9 acides aminés indispensables
// (AAE). La présentation s'appuie EXCLUSIVEMENT sur les fonctions pures existantes
// (intake.ts, aminoAcids.ts) : ce composant ne calcule rien lui-même et reste
// agnostique de la source des aliments (il opère sur des objets `Food`/`Ingredient`
// déjà résolus, quelle que soit la base d'aliments).
import {
  dishMacros,
  ingredientMacros,
  mealMacros,
  type Day,
  type Dish,
  type Ingredient,
  type MacroIntake,
  type Meal,
} from "./calc/intake";
import {
  AMINO_ACID_KEYS,
  dishAminoAcids,
  ingredientAminoAcids,
  mealAminoAcids,
  type AminoAcidAmounts,
} from "./calc/aminoAcids";
import type { AminoAcidKey } from "./calc/macros";

const round = (n: number) => Math.round(n);
const one = (n: number) => Math.round(n * 10) / 10;

// Libellés courts des 9 AAE (les groupes combinés sont abrégés pour tenir sur
// une ligne). Purement UI, sans effet sur le calcul.
const AAE_LABELS: Record<AminoAcidKey, string> = {
  histidine: "Histidine",
  isoleucine: "Isoleucine",
  leucine: "Leucine",
  lysine: "Lysine",
  sulfur: "Soufrés (Met + Cys)",
  aromatic: "Aromatiques (Phe + Tyr)",
  threonine: "Thréonine",
  tryptophan: "Tryptophane",
  valine: "Valine",
};

function MacroPills({ m }: { m: MacroIntake }) {
  return (
    <span className="tabular-nums text-slate-500">
      {round(m.kcal)} kcal · P {round(m.proteinG)} · L {round(m.lipidG)} · G {round(m.carbG)} (g)
    </span>
  );
}

// Bloc repliable des 9 AAE d'un niveau donné (mg). Masqué si aucun AAE analysable
// (aliments à protéines négligeables → tout à zéro).
function AminoAcidsDetails({ aa, label }: { aa: AminoAcidAmounts; label: string }) {
  const total = AMINO_ACID_KEYS.reduce((s, k) => s + aa[k], 0);
  if (total <= 0) return null;
  return (
    <details className="group mt-1">
      <summary className="cursor-pointer text-[11px] text-slate-500 hover:underline">
        {label}
      </summary>
      <div className="mt-1 space-y-0.5">
        {AMINO_ACID_KEYS.map((k) => (
          <div key={k} className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">{AAE_LABELS[k]}</span>
            <span className="tabular-nums text-slate-500">{round(aa[k])} mg</span>
          </div>
        ))}
      </div>
    </details>
  );
}

function IngredientRow({ ingredient }: { ingredient: Ingredient }) {
  return (
    <div className="border-t border-slate-100 py-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="truncate text-slate-600">
          {ingredient.food.name}
          <span className="ml-1 text-slate-400">{one(ingredient.grams)} g</span>
        </span>
        <MacroPills m={ingredientMacros(ingredient)} />
      </div>
      <AminoAcidsDetails aa={ingredientAminoAcids(ingredient)} label="AAE de l'ingrédient" />
    </div>
  );
}

function DishBlock({ dish }: { dish: Dish }) {
  return (
    <details className="group mt-2 rounded-lg border border-slate-100 bg-slate-50/50 p-2">
      <summary className="flex cursor-pointer items-center justify-between text-sm">
        <span className="font-medium text-slate-700">
          <span className="mr-1 text-slate-400 group-open:hidden">▸</span>
          <span className="mr-1 hidden text-slate-400 group-open:inline">▾</span>
          {dish.name || "Plat"}
        </span>
        <MacroPills m={dishMacros(dish)} />
      </summary>
      <div className="mt-1 pl-3">
        {dish.ingredients.length === 0 ? (
          <p className="py-1 text-xs text-slate-400">Aucun ingrédient.</p>
        ) : (
          dish.ingredients.map((ing, i) => <IngredientRow key={i} ingredient={ing} />)
        )}
        <AminoAcidsDetails aa={dishAminoAcids(dish)} label="AAE du plat" />
      </div>
    </details>
  );
}

function MealBlock({ meal }: { meal: Meal }) {
  return (
    <details className="group rounded-xl border border-slate-200 bg-white p-3">
      <summary className="flex cursor-pointer items-center justify-between text-sm">
        <span className="font-semibold text-slate-800">
          <span className="mr-1 text-slate-400 group-open:hidden">▸</span>
          <span className="mr-1 hidden text-slate-400 group-open:inline">▾</span>
          {meal.name || "Repas"}
        </span>
        <MacroPills m={mealMacros(meal)} />
      </summary>
      <div className="mt-1">
        {meal.dishes.length === 0 ? (
          <p className="py-1 text-xs text-slate-400">Aucun plat.</p>
        ) : (
          meal.dishes.map((dish, i) => <DishBlock key={i} dish={dish} />)
        )}
        <AminoAcidsDetails aa={mealAminoAcids(meal)} label="AAE du repas" />
      </div>
    </details>
  );
}

// Vue « détail des apports » de la journée. Chaque repas est repliable ; à
// l'intérieur, chaque plat l'est aussi, jusqu'aux ingrédients.
export function DayBreakdown({ day }: { day: Day }) {
  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Détail des apports par maille
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Repas → plats → ingrédients. Macros à chaque niveau ; dépliez pour voir les
        9 acides aminés indispensables (AAE).
      </p>
      <div className="mt-3 space-y-2">
        {day.meals.map((meal, i) => (
          <MealBlock key={i} meal={meal} />
        ))}
      </div>
    </div>
  );
}
