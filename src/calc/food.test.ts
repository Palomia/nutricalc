import { describe, expect, it } from "vitest";
import { FOODS, filterFoods, type Food } from "./food";

describe("food — attributs de régime", () => {
  it("tout aliment vegan est aussi végétarien (vegan ⇒ vegetarian)", () => {
    for (const f of FOODS) {
      if (f.vegan) expect(f.vegetarian, `${f.id} vegan mais non végétarien`).toBe(true);
    }
  });

  it("les chairs animales (viande/poisson) ne sont ni végétariennes ni vegan", () => {
    const chairs = ["poulet-blanc-cuit", "steak-hache-15-cuit", "saumon-cuit"];
    for (const id of chairs) {
      const f = FOODS.find((x) => x.id === id)!;
      expect(f.vegetarian, `${id} devrait être non végétarien`).toBe(false);
      expect(f.vegan, `${id} devrait être non vegan`).toBe(false);
    }
  });

  it("œuf et laitages sont végétariens mais non vegan", () => {
    const ovoLacto = ["oeuf-dur", "emmental", "lait-demi-ecreme", "yaourt-nature"];
    for (const id of ovoLacto) {
      const f = FOODS.find((x) => x.id === id)!;
      expect(f.vegetarian, `${id} devrait être végétarien`).toBe(true);
      expect(f.vegan, `${id} ne devrait pas être vegan`).toBe(false);
    }
  });

  it("tous les champs de régime sont renseignés (booléens) sur chaque aliment", () => {
    for (const f of FOODS) {
      expect(typeof f.vegetarian).toBe("boolean");
      expect(typeof f.vegan).toBe("boolean");
      expect(typeof f.unprocessed).toBe("boolean");
    }
  });
});

// Jeu d'aliments synthétiques couvrant les combinaisons utiles.
const base = { category: "Fruits & légumes", kcalPer100g: 0, proteinPer100g: 0, lipidPer100g: 0, carbPer100g: 0 } as const;
const veganBrut: Food = { id: "a", name: "A", ...base, vegetarian: true, vegan: true, unprocessed: true };
const veganTransfo: Food = { id: "b", name: "B", ...base, vegetarian: true, vegan: true, unprocessed: false };
const vegetarienBrut: Food = { id: "c", name: "C", ...base, vegetarian: true, vegan: false, unprocessed: true };
const viande: Food = { id: "d", name: "D", ...base, vegetarian: false, vegan: false, unprocessed: true };
const jeu = [veganBrut, veganTransfo, vegetarienBrut, viande];

describe("filterFoods", () => {
  it("sans critère : renvoie tous les aliments", () => {
    expect(filterFoods(jeu, {})).toEqual(jeu);
  });

  it("un critère à false est ignoré (aucune restriction)", () => {
    expect(filterFoods(jeu, { vegetarian: false, vegan: false, unprocessed: false })).toEqual(jeu);
  });

  it("végétarien : exclut la viande, garde œufs/laitages et végétaux", () => {
    const res = filterFoods(jeu, { vegetarian: true });
    expect(res.map((f) => f.id)).toEqual(["a", "b", "c"]);
  });

  it("vegan : ne garde que les aliments 100 % végétaux", () => {
    const res = filterFoods(jeu, { vegan: true });
    expect(res.map((f) => f.id)).toEqual(["a", "b"]);
  });

  it("non transformé : ne garde que les aliments bruts", () => {
    const res = filterFoods(jeu, { unprocessed: true });
    expect(res.map((f) => f.id)).toEqual(["a", "c", "d"]);
  });

  it("combinaison vegan + non transformé (ET logique)", () => {
    const res = filterFoods(jeu, { vegan: true, unprocessed: true });
    expect(res.map((f) => f.id)).toEqual(["a"]);
  });

  it("ne mute pas le tableau d'entrée", () => {
    const copie = [...jeu];
    filterFoods(jeu, { vegan: true });
    expect(jeu).toEqual(copie);
  });
});
