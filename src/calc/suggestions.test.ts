import { describe, expect, it } from "vitest";
import { suggestFoods } from "./suggestions";
import { AMINO_ACID_PROFILES, type Food } from "./food";
import { aminoAcidTargets } from "./macros";
import type { MuscleTargets } from "./aminoAcids";
import type { Day } from "./intake";

// Cibles synthétiques (prise de masse, 70 kg) réutilisées par les tests.
const targets = (): MuscleTargets => ({
  aminoAcids: aminoAcidTargets(70, 1.8),
  proteinTargetG: 140,
  energyTargetKcal: 2500,
});

// Jeu de CANDIDATS synthétique (remplace l'ancienne base curatée) : sources
// aux profils d'AAE réels, couvrant les cas testés (céréale pauvre en lysine,
// viande, légumineuse vegan, huile sans protéine).
const rice: Food = {
  id: "riz", name: "Riz", category: "Féculents & pains",
  kcalPer100g: 130, proteinPer100g: 2.7, lipidPer100g: 0.3, carbPer100g: 28,
  aaProfile: AMINO_ACID_PROFILES.cereal, vegetarian: true, vegan: true, unprocessed: false,
};
const chicken: Food = {
  id: "poulet", name: "Poulet", category: "Viandes, poissons, œufs",
  kcalPer100g: 165, proteinPer100g: 31, lipidPer100g: 3.6, carbPer100g: 0,
  aaProfile: AMINO_ACID_PROFILES.meat, vegetarian: false, vegan: false, unprocessed: false,
};
const lentils: Food = {
  id: "lentilles", name: "Lentilles", category: "Féculents & pains",
  kcalPer100g: 116, proteinPer100g: 9, lipidPer100g: 0.4, carbPer100g: 20,
  aaProfile: AMINO_ACID_PROFILES.legume, vegetarian: true, vegan: true, unprocessed: false,
};
const tofu: Food = {
  id: "tofu", name: "Tofu", category: "Féculents & pains",
  kcalPer100g: 144, proteinPer100g: 17, lipidPer100g: 9, carbPer100g: 3,
  aaProfile: AMINO_ACID_PROFILES.soy, vegetarian: true, vegan: true, unprocessed: true,
};
const oil: Food = {
  id: "huile-olive", name: "Huile d'olive", category: "Matières grasses & oléagineux",
  kcalPer100g: 884, proteinPer100g: 0, lipidPer100g: 100, carbPer100g: 0,
  vegetarian: true, vegan: true, unprocessed: false,
};
const CANDIDATES: Food[] = [rice, chicken, lentils, tofu, oil];
const byId: Record<string, Food> = Object.fromEntries(CANDIDATES.map((f) => [f.id, f]));

// Journée bâtie autour d'un aliment candidat, en grammes.
const dayOf = (foodId: string, grams: number): Day => ({
  meals: [{ name: "Repas", dishes: [{ name: "Plat", ingredients: [{ food: byId[foodId], grams }] }] }],
});

describe("suggestFoods — complémentarité", () => {
  it("propose en tête un aliment riche dans l'AA limitant (journée tout céréales → lysine)", () => {
    // Beaucoup de riz : l'AA limitant devient la lysine (profil cereal pauvre).
    const day = dayOf("riz", 1000);
    const sugg = suggestFoods(CANDIDATES, day, targets());
    expect(sugg.length).toBeGreaterThan(0);
    // La tête doit être une source riche en lysine (pas une céréale pauvre).
    expect(sugg[0].food.aaProfile).not.toBe(AMINO_ACID_PROFILES.cereal);
    expect(sugg[0].reason).toContain("lysine");
    // Le riz déjà largement présent (1000 g) n'est pas resuggéré.
    expect(sugg.some((s) => s.food.id === "riz")).toBe(false);
  });

  it("respecte le régime vegan : aucune source animale suggérée", () => {
    const day = dayOf("riz", 1000);
    const sugg = suggestFoods(CANDIDATES, day, targets(), { filter: { vegan: true } });
    expect(sugg.length).toBeGreaterThan(0);
    expect(sugg.every((s) => s.food.vegan)).toBe(true);
    // Une légumineuse (riche en lysine et vegan) doit émerger.
    expect(sugg.some((s) => s.food.aaProfile === AMINO_ACID_PROFILES.legume)).toBe(true);
  });

  it("borne la sortie au top N demandé", () => {
    const day = dayOf("riz", 1000);
    expect(suggestFoods(CANDIDATES, day, targets(), { limit: 2 }).length).toBeLessThanOrEqual(2);
    expect(suggestFoods(CANDIDATES, day, targets(), { limit: 3 }).length).toBeLessThanOrEqual(3);
  });

  it("gère la journée vide : propose des sources protéiques génériques", () => {
    const sugg = suggestFoods(CANDIDATES, { meals: [] }, targets());
    // Sans AA limitant analysable, on retombe sur le déficit protéique.
    expect(sugg.length).toBeGreaterThan(0);
    expect(sugg.every((s) => s.food.proteinPer100g > 0)).toBe(true);
    // Aucun aliment sans protéine (huile) ne doit remonter.
    expect(sugg.some((s) => s.food.id === "huile-olive")).toBe(false);
  });

  it("chaque suggestion porte une raison non vide", () => {
    const sugg = suggestFoods(CANDIDATES, dayOf("riz", 1000), targets());
    expect(sugg.every((s) => s.reason.length > 0)).toBe(true);
  });
});
