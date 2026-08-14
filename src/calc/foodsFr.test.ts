import { describe, expect, it } from "vitest";
import { normalize, matchesDiet, searchFoodsFr } from "./foodsFr";
import type { Food } from "./food";

describe("foodsFr — normalisation", () => {
  it("passe en minuscules et supprime les accents", () => {
    expect(normalize("Pâtes Cuites")).toBe("pates cuites");
    expect(normalize("Œuf")).toBe("œuf"); // ligature conservée (pas un diacritique)
    expect(normalize("Céréales à grAIns")).toBe("cereales a grains");
  });
});

const mk = (over: Partial<Food>): Food => ({
  id: "x", name: "X", category: "Autres",
  kcalPer100g: 0, proteinPer100g: 0, lipidPer100g: 0, carbPer100g: 0,
  vegetarian: false, vegan: false, unprocessed: false, ...over,
});

describe("foodsFr — filtre de régime tolérant", () => {
  it("vegan strict écarte les non-vegan certains", () => {
    expect(matchesDiet(mk({ vegan: false }), { vegan: true })).toBe(false);
    expect(matchesDiet(mk({ vegan: true, vegetarian: true }), { vegan: true })).toBe(true);
  });

  it("ne masque PAS un régime incertain sous filtre végétarien/vegan", () => {
    const uncertain = mk({ vegetarian: false, vegan: false, dietUncertain: true });
    expect(matchesDiet(uncertain, { vegetarian: true })).toBe(true);
    expect(matchesDiet(uncertain, { vegan: true })).toBe(true);
  });

  it("« non transformé » reste strict (pas d'exception pour l'incertitude)", () => {
    const uncertain = mk({ unprocessed: false, dietUncertain: true });
    expect(matchesDiet(uncertain, { unprocessed: true })).toBe(false);
  });
});

describe("foodsFr — recherche sur la base FR (chargement paresseux)", () => {
  it("trouve un aliment par sous-chaîne insensible à la casse/aux accents", async () => {
    const res = await searchFoodsFr("poulet", {}, 20);
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((f) => normalize(f.name).includes("poulet"))).toBe(true);
    // Les aliments FR portent leur profil d'AAE INLINE quand il est disponible.
    const withAa = res.find((f) => f.aaProfile);
    if (withAa) expect(typeof withAa.aaProfile!.leucine).toBe("number");
  });

  it("borne le nombre de résultats", async () => {
    const res = await searchFoodsFr("a", {}, 10);
    expect(res.length).toBeLessThanOrEqual(10);
  });
});
