# nutricalc — suivi projet

Journal des livraisons + notes de fond. **Backlog actif & coordination multi-agents → [`BACKLOG.md`](BACKLOG.md).**

**Légende**

- **Statut** : ✅ Fait · 🚧 En cours · 🔬 Analysé (reste un correctif) · ⬜ À faire · 🧭 À préciser · ❌ Abandonné
- **Lançable** : ✅ maintenant · ⚠️ sous condition · ⛔ bloqué
- **Effort** : S (petit, < ½ j) · M (moyen) · L (gros) · XL (chantier)

---

## ⬜ À faire

Le **backlog actif** (priorités, blocages, complexité, parallélisabilité, assignation) vit dans **[`BACKLOG.md`](BACKLOG.md)**.

## ✅ Fait

| # | Tâche | Réf. |
|---|-------|------|
| T2 | Enregistrer des repas et des plats (persistance + bibliothèque) | PR #7 |
| T4 | Calcul des macros et des AAE pour les repas | moteur AAE (#6) + `intake.ts` |
| T6 | Suggestions d'aliments pour compléter la journée | PR #15 |
| T7 | Filtre végétarien / vegan / non transformé | PR #9 |
| T10 | Bouton cuisson (beurre / huile d'olive / à sec) | PR #10 |
| T11 | Bouton vinaigrette | PR #10 |
| T12 | Unités ménagères (cuillère, tasse, mug…) + équivalent en grammes | PR #12 |
| T13 | Journée type (petit-déj, déjeuner, en-cas, dîner) | PR #11 |
| T15 | Qualité protéique vs AA limitant : recherche + décision | recherche → `docs/recherche-qualite-proteique.md` ; retrait → PR #16 |
| T18 | Réduire l'encombrement des micronutriments (section repliable) | PR #13 |
| T16 | Score leucine : comptage de prises (N dynamique 3-7) + lisibilité | PR #17 |
| T3 | Refonte en 3 onglets (Objectifs + fiches objectifs / Repas / Comptes rendus) | PR #19 |
| T14 (données) | Base USDA traduite FR, app-ready (`data/foods.fr.json`) + build Python | PR #20 |
| T14 (câblage) | `foods.fr.json` en base unique (chargement paresseux, registre persisté, recherche) | PR #23 |
| T19 | Détail des apports par ingrédient / plat / repas | PR #24 |
| — | Revue de fond de l'algo (analyse + propositions) | PR #22 |
| — | Étude des sources de données (faisabilité CDC T21) | PR #25 |
| T21 (CDC) | Cahier des charges du projet DS (base enrichie + impact planétaire) | repo annexe `Palomia/nutricalc-food-data` (README) |
| — | Point d'info « leucine anabolique » (pédagogie des pics) | PR #14 |

## ❌ Abandonné

| # | Tâche | Raison |
|---|-------|--------|
| T5 | Segmentation aliments classique / moyen / exotique | PR #8 fermée (test non concluant). |

---

## Notes de fond

- **Qualité protéique (T15)** — la dimension « qualité protéique » codée en dur (prime à l'animal) a été **retirée** : redondante avec l'analyse de l'acide aminé limitant et non justifiée hors digestibilité/leucine (écart compensable). Détail sourcé dans [`docs/recherche-qualite-proteique.md`](docs/recherche-qualite-proteique.md). Les pics anaboliques reposent désormais sur les **protéines totales** par repas, sans biais d'origine.
- **Volet environnemental** — non vérifié par la recherche (à documenter séparément avant tout affichage dans l'outil).
- **Base d'aliments (T14)** — **USDA unique, traduite en FR** via un build Python (`data/build_food_db_fr.py`) → `data/foods.fr.json` (PR #20), **câblée comme base unique** dans l'app (recherche, chargement paresseux, remapping des presets — PR #23). L'ancienne double-source EN (PR #18) est fermée.
- **Base enrichie + impact planétaire (T21)** — **CDC livré** (repo annexe **`Palomia/nutricalc-food-data`**, README ; sync `/work/nutricalc-food-data`). Le **projet datascience** (fusion USDA→CIQUAL→Agribalyse, composition fine + impact « limites planétaires ») est mené **dans ce repo annexe**, hors périmètre nutricalc ; son backlog détaillé y vit. Étude de faisabilité des sources : `docs/etude-sources-donnees-t21.md` (#25).
