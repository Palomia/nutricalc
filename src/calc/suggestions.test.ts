import { describe, expect, it } from "vitest";
import { suggestFoods } from "./suggestions";
import { FOODS_BY_ID } from "./food";
import { aminoAcidTargets } from "./macros";
import type { MuscleTargets } from "./aminoAcids";
import type { Day } from "./intake";

// Cibles synthétiques (prise de masse, 70 kg) réutilisées par les tests.
const targets = (): MuscleTargets => ({
  aminoAcids: aminoAcidTargets(70, 1.8),
  proteinTargetG: 140,
  energyTargetKcal: 2500,
});

// Journée bâtie autour d'un aliment de la base, en grammes.
const dayOf = (foodId: string, grams: number): Day => ({
  meals: [{ name: "Repas", dishes: [{ name: "Plat", ingredients: [{ food: FOODS_BY_ID[foodId], grams }] }] }],
});

describe("suggestFoods — complémentarité", () => {
  it("propose en tête un aliment riche dans l'AA limitant (journée tout céréales → lysine)", () => {
    // Beaucoup de riz : l'AA limitant devient la lysine (profil cereal pauvre).
    const day = dayOf("riz-blanc-cuit", 1000);
    const sugg = suggestFoods(day, targets());
    expect(sugg.length).toBeGreaterThan(0);
    // La tête doit être une source riche en lysine (viande/poisson/laitage/œuf),
    // pas une céréale pauvre en lysine.
    expect(sugg[0].food.aaProfile).not.toBe("cereal");
    expect(sugg[0].reason).toContain("lysine");
    // Le riz déjà largement présent (1000 g) n'est pas resuggéré.
    expect(sugg.some((s) => s.food.id === "riz-blanc-cuit")).toBe(false);
  });

  it("respecte le régime vegan : aucune source animale suggérée", () => {
    const day = dayOf("riz-blanc-cuit", 1000);
    const sugg = suggestFoods(day, targets(), { filter: { vegan: true } });
    expect(sugg.length).toBeGreaterThan(0);
    expect(sugg.every((s) => s.food.vegan)).toBe(true);
    // Une légumineuse (riche en lysine et vegan) doit émerger.
    expect(sugg.some((s) => s.food.aaProfile === "legume")).toBe(true);
  });

  it("borne la sortie au top N demandé", () => {
    const day = dayOf("riz-blanc-cuit", 1000);
    expect(suggestFoods(day, targets(), { limit: 2 }).length).toBeLessThanOrEqual(2);
    expect(suggestFoods(day, targets(), { limit: 3 }).length).toBeLessThanOrEqual(3);
  });

  it("gère la journée vide : propose des sources protéiques génériques", () => {
    const sugg = suggestFoods({ meals: [] }, targets());
    // Sans AA limitant analysable, on retombe sur le déficit protéique.
    expect(sugg.length).toBeGreaterThan(0);
    expect(sugg.every((s) => s.food.proteinPer100g > 0)).toBe(true);
    // Aucun aliment sans protéine (huile, vinaigre) ne doit remonter.
    expect(sugg.some((s) => s.food.id === "huile-olive")).toBe(false);
  });

  it("chaque suggestion porte une raison non vide", () => {
    const sugg = suggestFoods(dayOf("riz-blanc-cuit", 1000), targets());
    expect(sugg.every((s) => s.reason.length > 0)).toBe(true);
  });
});
