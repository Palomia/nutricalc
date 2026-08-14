// État partagé de la « journée » : repas → plats → ingrédients, bibliothèque de
// modèles (repas / plats enregistrés), filtres de régime et persistance
// localStorage.
//
// Ce hook a été EXTRAIT de MealPlanner pour que la SAISIE (onglet « Repas ») et
// l'ANALYSE (onglet « Comptes rendus ») partagent rigoureusement le même état :
// même journée, même bibliothèque, même compteur d'ids (aucune collision de clés
// React), mêmes clés de persistance (cf. storage.ts). La logique de calcul reste
// inchangée : le hook se contente d'orchestrer l'état d'édition et d'en dériver
// la journée agrégeable (`day`).
import { useEffect, useMemo, useRef, useState } from "react";
import type { Food, FoodFilter } from "./calc/food";
import type { Day } from "./calc/intake";
import {
  DAY_KEY,
  SAVED_MEALS_KEY,
  SAVED_DISHES_KEY,
  FOOD_REGISTRY_KEY,
  serializeDay,
  serializeSaved,
  serializeRegistry,
  deserializeDay,
  deserializeSavedMeals,
  deserializeSavedDishes,
  deserializeRegistry,
  nextIdFrom,
  toSavedMeal,
  toSavedDish,
  fromSavedMeal,
  fromSavedDish,
} from "./calc/storage";
import type { EMeal, EIngredient, SavedMeal, SavedDish } from "./calc/storage";
import type { ComboIngredient } from "./calc/cooking";
import { buildPresetDay } from "./calc/presetDay";
import { PRESET_FOODS, DEFAULT_FOOD_ID } from "./calc/presetFoods";
import { toGrams, DEFAULT_UNIT } from "./calc/units";

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

// Registre : id d'aliment → fiche `Food`. Type de l'index en mémoire.
type Registry = Record<string, Food>;

// Registre de départ : les aliments de presets (extraits de foods.fr.json),
// toujours résolubles (journée type, cuisson, vinaigrette, suggestions).
function seedRegistry(): Registry {
  const reg: Registry = {};
  for (const f of PRESET_FOODS) reg[f.id] = f;
  return reg;
}

// Conversion état d'édition → journée agrégeable par intake.ts. La quantité
// saisie (unité ménagère) est convertie en grammes ici, pour qu'intake.ts reste
// une simple règle de trois. Un ingrédient dont l'aliment n'est pas (encore)
// dans le registre est ignoré (comme auparavant avec un id inconnu).
function toDay(meals: EMeal[], registry: Registry): Day {
  return {
    meals: meals.map((m) => ({
      name: m.name,
      dishes: m.dishes.map((d) => ({
        name: d.name,
        ingredients: d.ingredients
          .map((i) => ({ food: registry[i.foodId], grams: toGrams(i.quantity, i.unit) }))
          .filter((i): i is { food: Food; grams: number } => i.food !== undefined),
      })),
    })),
  };
}

const SUGGESTION_MEAL = "Suggestions";

export interface UseMeals {
  meals: EMeal[];
  day: Day;
  savedMeals: SavedMeal[];
  savedDishes: SavedDish[];
  filters: FoodFilter;
  setFilters: React.Dispatch<React.SetStateAction<FoodFilter>>;
  // Résolution d'un id d'aliment vers sa fiche (registre en mémoire).
  resolveFood: (foodId: string) => Food | undefined;
  // Aliments « courants » (presets + aliments déjà sélectionnés) : jeu de
  // candidats du moteur de suggestions (perf ; cf. suggestions.ts).
  commonFoods: Food[];
  // Handlers d'édition « repas »
  addMeal: () => void;
  removeMeal: (mealId: number) => void;
  renameMeal: (mealId: number, name: string) => void;
  // Handlers d'édition « plat »
  addDish: (mealId: number) => void;
  removeDish: (mealId: number, dishId: number) => void;
  renameDish: (mealId: number, dishId: number, name: string) => void;
  // Handlers d'édition « ingrédient »
  addIngredient: (mealId: number, dishId: number) => void;
  addIngredients: (mealId: number, dishId: number, items: ComboIngredient[]) => void;
  removeIngredient: (mealId: number, dishId: number, ingId: number) => void;
  setIngredient: (mealId: number, dishId: number, ingId: number, patch: Partial<EIngredient>) => void;
  // Choix d'un aliment via la recherche FR : enregistre sa fiche au registre
  // (pour la persistance / résolution) puis fixe le `foodId` de l'ingrédient.
  setIngredientFood: (mealId: number, dishId: number, ingId: number, food: Food) => void;
  // Insertions / journée type / suggestions
  loadPresetDay: () => void;
  addSuggestedFood: (foodId: string) => void;
  // Bibliothèque de modèles
  saveMeal: (mealId: number) => void;
  insertSavedMeal: (index: number) => void;
  deleteSavedMeal: (index: number) => void;
  saveDish: (mealId: number, dishId: number) => void;
  insertSavedDish: (mealId: number, index: number) => void;
  deleteSavedDish: (index: number) => void;
}

export function useMeals(): UseMeals {
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

  // Registre des aliments sélectionnés (persisté). On part TOUJOURS des presets
  // puis on superpose le registre restauré : la journée / la bibliothèque se
  // résolvent après refresh sans recharger foods.fr.json.
  const [registry, setRegistry] = useState<Registry>(() => {
    const reg = seedRegistry();
    for (const f of deserializeRegistry(loadRaw(FOOD_REGISTRY_KEY))) reg[f.id] = f;
    return reg;
  });

  // Persistance : à chaque changement, on réécrit la clé correspondante.
  useEffect(() => saveRaw(DAY_KEY, serializeDay(meals)), [meals]);
  useEffect(() => saveRaw(SAVED_MEALS_KEY, serializeSaved(savedMeals)), [savedMeals]);
  useEffect(() => saveRaw(SAVED_DISHES_KEY, serializeSaved(savedDishes)), [savedDishes]);
  useEffect(
    () => saveRaw(FOOD_REGISTRY_KEY, serializeRegistry(Object.values(registry))),
    [registry],
  );

  // Filtres de régime appliqués à la recherche d'ingrédients (MealEditor) et au
  // moteur de suggestions.
  const [filters, setFilters] = useState<FoodFilter>({});

  const resolveFood = (foodId: string): Food | undefined => registry[foodId];
  const commonFoods = useMemo(() => Object.values(registry), [registry]);

  // Enregistre une fiche `Food` au registre (idempotent).
  const registerFood = (food: Food) =>
    setRegistry((reg) => (reg[food.id] ? reg : { ...reg, [food.id]: food }));

  const day = useMemo(() => toDay(meals, registry), [meals, registry]);

  const addMeal = () =>
    setMeals((ms) => [...ms, { id: id(), name: `Repas ${ms.length + 1}`, dishes: [] }]);

  // Insère un aliment suggéré (100 g / unité gramme) dans un repas dédié
  // « Suggestions » — créé au besoin — pour ne pas perturber les repas saisis.
  const addSuggestedFood = (foodId: string) =>
    setMeals((ms) => {
      const idx = ms.findIndex((m) => m.name === SUGGESTION_MEAL);
      const ing: EIngredient = { id: id(), foodId, quantity: 100, unit: DEFAULT_UNIT };
      if (idx === -1)
        return [
          ...ms,
          { id: id(), name: SUGGESTION_MEAL, dishes: [{ id: id(), name: "À compléter", ingredients: [ing] }] },
        ];
      return ms.map((m, i) => {
        if (i !== idx) return m;
        if (m.dishes.length === 0)
          return { ...m, dishes: [{ id: id(), name: "À compléter", ingredients: [ing] }] };
        return {
          ...m,
          dishes: m.dishes.map((d, di) => (di === 0 ? { ...d, ingredients: [...d.ingredients, ing] } : d)),
        };
      });
    });

  // Charge la journée type (§13) : ids frais via l'allocateur commun. Si la
  // journée n'est pas vide, on demande confirmation avant de la remplacer.
  const loadPresetDay = () => {
    if (meals.length > 0 && !window.confirm("Remplacer la journée en cours par une journée type ?")) {
      return;
    }
    setMeals(buildPresetDay(id));
  };

  const removeMeal = (mealId: number) => setMeals((ms) => ms.filter((m) => m.id !== mealId));

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
                  ? { ...d, ingredients: [...d.ingredients, { id: id(), foodId: DEFAULT_FOOD_ID, quantity: 100, unit: DEFAULT_UNIT }] }
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

  // Choix d'un aliment issu de la recherche FR : on enregistre d'abord sa fiche
  // (résolution / persistance) puis on fixe le `foodId` de l'ingrédient.
  const setIngredientFood = (mealId: number, dishId: number, ingId: number, food: Food) => {
    registerFood(food);
    setIngredient(mealId, dishId, ingId, { foodId: food.id });
  };

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

  return {
    meals,
    day,
    savedMeals,
    savedDishes,
    filters,
    setFilters,
    resolveFood,
    commonFoods,
    addMeal,
    removeMeal,
    renameMeal,
    addDish,
    removeDish,
    renameDish,
    addIngredient,
    addIngredients,
    removeIngredient,
    setIngredient,
    setIngredientFood,
    loadPresetDay,
    addSuggestedFood,
    saveMeal,
    insertSavedMeal,
    deleteSavedMeal,
    saveDish,
    insertSavedDish,
    deleteSavedDish,
  };
}
