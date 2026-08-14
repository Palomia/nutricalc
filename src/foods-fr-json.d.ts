// Déclaration de module pour l'import DYNAMIQUE de la base d'aliments FR.
//
// On type le module comme `unknown` VOLONTAIREMENT : sans cela, avec
// `resolveJsonModule`, TypeScript inférerait un type littéral à partir des
// ~4,5 Mo de JSON — coûteux, voire ingérable pour `tsc`. Le module `foodsFr.ts`
// se charge de valider/convertir la forme au chargement (via une assertion de
// type contrôlée). L'import reste dynamique → chunk asynchrone séparé au build.
declare module "*/foods.fr.json" {
  const value: unknown;
  export default value;
}
