# nutricalc — design

> Calculer les apports journaliers recommandés d'un adulte : de combien
> d'énergie, de macronutriments et de micronutriments a-t-il besoin par jour ?

## Périmètre

Trois familles de sorties, pour un adulte (18-64 ans) non enceinte/allaitant :

| Famille          | Contenu                                                        |
| ---------------- | -------------------------------------------------------------- |
| Énergie          | Métabolisme de base + besoin énergétique total (kcal/j)        |
| Macronutriments  | Protéines, lipides, glucides (grammes, kcal, % de l'énergie)   |
| Micronutriments  | Vitamines et minéraux (références ANSES, adaptées au sexe)     |

## Entrées

Un `Profile` : sexe biologique, âge, poids (kg), taille (cm), niveau
d'activité. Rien n'est persisté — les valeurs servent au calcul en mémoire
puis sont oubliées. Aucune donnée personnelle réelle n'entre dans le dépôt
(seuls des profils synthétiques servent d'exemples).

## Formules

**Énergie.** Métabolisme de base par Mifflin-St Jeor (1990) :

```
BMR = 10·poids(kg) + 6,25·taille(cm) − 5·âge(ans) + s
      s = +5 (homme), −161 (femme)
TDEE = BMR × facteur d'activité   (1,2 sédentaire … 1,9 très actif)
```

**Macronutriments** (références ANSES pour l'adulte) :

- Protéines : RNP **0,83 g/kg/j**.
- Lipides : **35-40 %** de l'apport énergétique total (AET) — on vise 37,5 %.
- Glucides : **40-55 %** de l'AET — ici le complément de l'énergie restante.

**Découpage des macronutriments** (sous chaque macro) :

- Protéines → 9 acides aminés indispensables (besoins moyens FAO/OMS/UNU 2007,
  mg/kg/j, identiques hommes/femmes ; besoins moyens, pas des RNP).
- Lipides → familles d'acides gras (AFSSA/ANSES 2006-SA-0359) : AGS ≤ 12 %
  AET (dont laurique+myristique+palmitique ≤ 8 %), oléique 15-20 %, linoléique
  ω-6 4 %, ALA ω-3 1 %, EPA 250 mg/j, DHA 250 mg/j.
- Glucides → fibres 30 g/j (AS, ANSES 2016), sucres hors lactose/galactose
  ≤ 100 g/j (limite ANSES), sucres libres/ajoutés < 10 % AET (objectif OMS ;
  < 5 % idéalement).

**Micronutriments.** Table de références par nutriment et par sexe, chaque
valeur étiquetée RNP (Référence Nutritionnelle pour la Population) ou AS
(Apport Satisfaisant).

## Sources et fiabilité

Les valeurs micronutriments sont **indicatives**, tirées des références
nutritionnelles ANSES (actualisation 2016-2021), arrondies. Plusieurs
dépendent de facteurs non modélisés (pertes menstruelles pour le fer, phytates
pour le zinc, âge). **À revalider contre le tableau officiel ANSES avant tout
usage réel.** Cet outil est informatif et ne remplace pas un avis médical ou
diététique.

## Limites

- Adultes uniquement ; ni enfants, ni grossesse, ni allaitement.
- Pas de pathologie ni de régime particulier.
- Micronutriments non modulés par l'âge fin ni par la composition du régime.

## Architecture

La même logique de calcul existe en deux implémentations qui doivent rester
d'accord (mêmes formules, mêmes valeurs, mêmes tests) :

```
src/calc/        app web — logique portée en TypeScript
  profile.ts     entrées + validation
  energy.ts      BMR + TDEE
  macros.ts      répartition protéines / lipides / glucides
  micros.ts      table de références ANSES
  report.ts      assemblage
  *.test.ts      tests Vitest
src/App.tsx      UI : formulaire de profil → rapport
poc/nutricalc/   proof of concept Python (mêmes formules, rendu texte + CLI)
```

Le POC Python a servi à figer les formules et les valeurs ; l'app web est la
cible. Les deux suites de tests encodent les mêmes cas de référence.

## Tech

Aligné sur les conventions de `countdown` (etrobert) :

- **Nix flake** + **direnv** (`use flake`) pour l'environnement reproductible ;
  `node`, `pnpm`, `python` viennent du devShell.
- App web : **pnpm + Vite + React + TypeScript + Tailwind + Vitest**.
- `nix build .#default` construit **et teste le POC Python** via `doCheck`
  (pytest). L'app web se construit avec `pnpm` dans le devShell (pas de
  fixed-output derivation Nix : le sandbox n'a pas le CA du proxy
  d'entreprise et ne peut pas joindre le registre npm). La CI teste les deux.
- **CI GitHub Actions** sur runner `ubuntu-latest` avec Nix installé à la volée
  (countdown vise un runner self-hosted privé — non réutilisable ici).
- `base: "./"` dans la config Vite pour un service depuis un sous-chemin.

## Process

1. **Repo + scaffold** aux conventions countdown. ✅
2. **POC Python** : énergie + macros + micronutriments, testé. ✅
3. **App web** : logique portée en TS, UI de saisie + rapport, testée. ✅
4. À venir : déploiement (module NixOS + Caddy), modulation par âge.
