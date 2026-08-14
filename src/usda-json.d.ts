// Déclaration ambiante pour l'import DYNAMIQUE de la base USDA (tâche #14).
//
// Objectif : donner un type minimal à `import("…/foods.sr_legacy.json")` sans
// activer `resolveJsonModule`, ce qui éviterait que `tsc` analyse les ~3 Mo du
// fichier (typage explicite côté `usdaFoods.ts`, qui affine `foods` en
// `UsdaRawFood[]`). Le contenu réel est résolu par Vite en un chunk séparé.
declare module "*/foods.sr_legacy.json" {
  const data: { foods: unknown[] };
  export default data;
}
