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

**Micronutriments.** Table de références par nutriment et par sexe
(`micros.py`), chaque valeur étiquetée RNP (Référence Nutritionnelle pour la
Population) ou AS (Apport Satisfaisant).

## Sources et fiabilité

Les valeurs micronutriments sont **indicatives**, tirées des références
nutritionnelles ANSES (actualisation 2016-2021), arrondies. Plusieurs
dépendent de facteurs non modélisés (pertes menstruelles pour le fer, phytates
pour le zinc, âge). **À revalider contre le tableau officiel ANSES avant tout
usage réel.** Cet outil est informatif et ne remplace pas un avis médical ou
diététique.

## Limites (POC)

- Adultes uniquement ; ni enfants, ni grossesse, ni allaitement.
- Pas de pathologie ni de régime particulier.
- Micronutriments non modulés par l'âge fin ni par la composition du régime.

## Architecture

```
poc/nutricalc/
  profile.py   entrées + validation
  energy.py    BMR + TDEE
  macros.py    répartition protéines / lipides / glucides
  micros.py    table de références ANSES
  report.py    assemblage + rendu texte
  __main__.py  démo CLI (profil synthétique)
```

Le cœur du calcul est du Python pur (sans dépendance) : il pourra être
transcrit tel quel en TypeScript pour l'app web, ou exposé derrière une API.

## Tech

Aligné sur les conventions de `countdown` (etrobert) :

- **Nix flake** + **direnv** (`use flake`) pour l'environnement reproductible.
- `nix build .#default` construit le POC et **lance pytest via `doCheck`** :
  CI rouge si la suite échoue.
- **CI GitHub Actions** sur runner `ubuntu-latest` avec Nix installé à la volée
  (countdown vise un runner self-hosted privé — non réutilisable ici).
- Phase web à venir : pnpm + Vite + React + TypeScript + Tailwind + Vitest.

## Process

1. **Repo + scaffold** aux conventions countdown. ✅
2. **POC Python** : énergie + macros + micronutriments, testé. ✅
3. **App web** : réutilise la logique du POC, UI de saisie du profil et
   affichage du rapport.
