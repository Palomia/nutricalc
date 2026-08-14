import { describe, expect, it } from "vitest";
import {
  dietFromCategory,
  mapCategory,
  normalizeUsdaFood,
  searchUsdaFoods,
  usdaAminoAcidProfile,
  type UsdaRawFood,
} from "./usdaFoods";
import { ingredientAminoAcids } from "./aminoAcids";

// Fixtures représentatives (valeurs plausibles, non tirées d'un aliment réel
// nominatif) — on N'ITÈRE PAS sur les 7 793 entrées.

// Source protéique au profil d'AA COMPLET (11 champs), protéines = 20 g.
const chicken: UsdaRawFood = {
  fdc_id: 1001,
  name: "Chicken breast, cooked",
  category: "Poultry Products",
  kcal: 165,
  protein_g: 20,
  fat_g: 3.6,
  carb_g: 0,
  histidine_g: 0.6,
  isoleucine_g: 1.0,
  leucine_g: 2.0, // 2 / 20 × 1000 = 100 mg/g
  lysine_g: 1.8,
  methionine_g: 0.5,
  cystine_g: 0.3, // sulfur = 0.8 / 20 × 1000 = 40 mg/g
  phenylalanine_g: 0.8,
  tyrosine_g: 0.6, // aromatic = 1.4 / 20 × 1000 = 70 mg/g
  threonine_g: 0.9,
  tryptophan_g: 0.24,
  valine_g: 1.0,
};

describe("usdaAminoAcidProfile — profil inline (mg/g de protéine)", () => {
  it("calcule le profil depuis les grammes réels, avec groupes combinés", () => {
    const p = usdaAminoAcidProfile(chicken)!;
    expect(p).toBeDefined();
    expect(p.leucine).toBeCloseTo(100, 6); // 2 g / 20 g × 1000
    expect(p.sulfur).toBeCloseTo(40, 6); // (0.5 + 0.3) / 20 × 1000
    expect(p.aromatic).toBeCloseTo(70, 6); // (0.8 + 0.6) / 20 × 1000
    expect(p.histidine).toBeCloseTo(30, 6);
    expect(p.tryptophan).toBeCloseTo(12, 6);
  });

  it("profil incomplet (un AA manquant) → pas de profil", () => {
    expect(usdaAminoAcidProfile({ ...chicken, lysine_g: undefined })).toBeUndefined();
  });

  it("protéines nulles ou absentes → pas de profil", () => {
    expect(usdaAminoAcidProfile({ ...chicken, protein_g: 0 })).toBeUndefined();
    expect(usdaAminoAcidProfile({ ...chicken, protein_g: undefined })).toBeUndefined();
  });
});

describe("normalizeUsdaFood — macros et repli", () => {
  it("mappe les macros et préfixe l'id", () => {
    const f = normalizeUsdaFood(chicken);
    expect(f.id).toBe("usda-1001");
    expect(f.name).toBe("Chicken breast, cooked");
    expect(f.kcalPer100g).toBe(165);
    expect(f.proteinPer100g).toBe(20);
    expect(f.lipidPer100g).toBe(3.6);
    expect(f.carbPer100g).toBe(0);
    expect(f.aaProfileValues?.leucine).toBeCloseTo(100, 6);
  });

  it("kcal absent → recalcul 4/9/4 depuis les macros", () => {
    const f = normalizeUsdaFood({ ...chicken, kcal: undefined });
    // 20×4 + 3.6×9 + 0×4 = 80 + 32.4 = 112.4
    expect(f.kcalPer100g).toBeCloseTo(112.4, 6);
  });

  it("macro absente → 0 (non revendiqué comme mesuré)", () => {
    const raw: UsdaRawFood = { fdc_id: 2, name: "Mystère", category: "Beverages", kcal: 10 };
    const f = normalizeUsdaFood(raw);
    expect(f.proteinPer100g).toBe(0);
    expect(f.lipidPer100g).toBe(0);
    expect(f.carbPer100g).toBe(0);
    expect(f.kcalPer100g).toBe(10);
    expect(f.aaProfileValues).toBeUndefined();
  });
});

describe("mapCategory — correspondance best-effort", () => {
  it("mappe les catégories connues vers les catégories FR", () => {
    expect(mapCategory("Poultry Products")).toBe("Viandes, poissons, œufs");
    expect(mapCategory("Dairy and Egg Products")).toBe("Produits laitiers");
    expect(mapCategory("Fruits and Fruit Juices")).toBe("Fruits & légumes");
    expect(mapCategory("Cereal Grains and Pasta")).toBe("Féculents & pains");
    expect(mapCategory("Fats and Oils")).toBe("Matières grasses & oléagineux");
  });

  it("catégorie inconnue → « Autres »", () => {
    expect(mapCategory("Sweets")).toBe("Autres");
    expect(mapCategory("Soups, Sauces, and Gravies")).toBe("Autres");
    expect(mapCategory("Inexistant")).toBe("Autres");
  });
});

describe("dietFromCategory — heuristique de régime", () => {
  it("chairs animales : ni végétarien ni vegan", () => {
    for (const c of ["Beef Products", "Finfish and Shellfish Products", "Sausages and Luncheon Meats"]) {
      expect(dietFromCategory(c)).toEqual({ vegetarian: false, vegan: false, unprocessed: false });
    }
  });

  it("œufs & laitages : végétarien non vegan", () => {
    expect(dietFromCategory("Dairy and Egg Products")).toEqual({ vegetarian: true, vegan: false, unprocessed: false });
  });

  it("végétaux nets : vegan (donc végétarien)", () => {
    for (const c of ["Vegetables and Vegetable Products", "Legumes and Legume Products", "Nut and Seed Products"]) {
      expect(dietFromCategory(c)).toEqual({ vegetarian: true, vegan: true, unprocessed: false });
    }
  });

  it("incertain (boissons, matières grasses…) : ne prétend pas", () => {
    for (const c of ["Beverages", "Fats and Oils", "Fast Foods"]) {
      expect(dietFromCategory(c)).toEqual({ vegetarian: false, vegan: false, unprocessed: false });
    }
  });
});

describe("searchUsdaFoods — recherche par nom", () => {
  const foods = [
    normalizeUsdaFood(chicken),
    normalizeUsdaFood({ fdc_id: 3, name: "Rice, white, cooked", category: "Cereal Grains and Pasta", protein_g: 2.7 }),
    normalizeUsdaFood({ fdc_id: 4, name: "Chicken thigh, roasted", category: "Poultry Products", protein_g: 24 }),
  ];

  it("filtre par sous-chaîne insensible à la casse", () => {
    const res = searchUsdaFoods(foods, "chicken");
    expect(res.map((f) => f.id)).toEqual(["usda-1001", "usda-4"]);
  });

  it("requête vide → aucun résultat", () => {
    expect(searchUsdaFoods(foods, "  ")).toEqual([]);
  });

  it("respecte la limite de résultats", () => {
    expect(searchUsdaFoods(foods, "c", 1)).toHaveLength(1);
  });
});

describe("ingredientAminoAcids — cohérence avec un profil inline USDA", () => {
  it("dérive les AAE du profil inline × grammes de protéines", () => {
    const food = normalizeUsdaFood(chicken); // 20 g prot / 100 g, leucine 100 mg/g
    // 200 g → 40 g de protéines → leucine = 100 × 40 = 4000 mg.
    const aa = ingredientAminoAcids({ food, grams: 200 });
    expect(aa.leucine).toBeCloseTo(4000, 6);
    expect(aa.sulfur).toBeCloseTo(40 * 40, 6); // 40 mg/g × 40 g
    expect(aa.aromatic).toBeCloseTo(70 * 40, 6);
  });

  it("aliment USDA sans profil → aucun AAE", () => {
    const food = normalizeUsdaFood({ fdc_id: 9, name: "Cola", category: "Beverages", kcal: 40, carb_g: 10 });
    const aa = ingredientAminoAcids({ food, grams: 500 });
    expect(aa.leucine).toBe(0);
    expect(aa.lysine).toBe(0);
  });
});
