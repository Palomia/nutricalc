# nutricalc — suivi projet

Outil de gestion des tâches. Tenu à jour au fil des livraisons.

**Légende**

- **Statut** : ✅ Fait · 🚧 En cours · 🔬 Analysé (reste un correctif) · ⬜ À faire · 🧭 À préciser · ❌ Abandonné
- **Lançable** : ✅ maintenant · ⚠️ sous condition · ⛔ bloqué
- **Effort** : S (petit, < ½ j) · M (moyen) · L (gros) · XL (chantier)

---

## ⬜ À faire / en réflexion

| # | Tâche | Statut | Lançable | Effort | Notes |
|---|-------|--------|----------|--------|-------|
| — | Corrections de l'algo (score musculaire + suggestions) | ⬜ | ✅ (débloqué post-#23) | L | Revue livrée (#22). À appliquer sur la **vraie donnée USDA** : P1 recalibrer l'AA limitant, P2 fusionner leucine + répartition & réactiver la fenêtre 25-40 g, P3 `calorieScore` conscient de l'objectif, réalignement des suggestions. |
| T1 | Solution de repli quand la BDD manque de macros/AAE | ⬜ | ✅ | M | Partiellement traité par #23 (l'app tolère les profils AAE absents) ; reste à formaliser le repli et l'affichage des champs manquants (couplé aux corrections d'algo). |
| T20 | Plats et repas standard préréglés (burger, pizza, gratin de courgette ; menu type BigMac) | ⬜ | ✅ | M | Bibliothèque d'aliments composés / repas préréglés. Proche de T13 (journée type) et T2 (bibliothèque de modèles) — réutiliser la persistance existante. |
| T21 | Cahier des charges du projet datascience annexe (base enrichie + impact planétaire) | 🚧 | — | M | **Cadré** (grilling Q1–Q7). CDC en cours de rédaction → repo annexe **`Palomia/nutricalc-food-data`**, sync `/work/nutricalc-food-data`. Étude de sources : `docs/etude-sources-donnees-t21.md` (#25). |
| T22 | Page « approfondie » exposant les champs Tier 1+2 | ⬜ | ⛔ dépend de la base DS (T21) | M | Données collectées mais non exploitées pour l'instant : DIAAS/digestibilité, sodium/sel, NOVA, fer héminique + inhibiteurs, index glycémique, cholestérol, vit. K, choline, B5/B7, fraction comestible/portion. À surfacer plus tard dans une page dédiée. |
| T17 | Compléments alimentaires | ⬜ | ⚠️ « à la toute fin » | L | À comparer aux recommandations d'aliments non transformés qui « fit » bien. Volontairement repoussé. |

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
| — | Point d'info « leucine anabolique » (pédagogie des pics) | PR #14 |

## ❌ Abandonné

| # | Tâche | Raison |
|---|-------|--------|
| T5 | Segmentation aliments classique / moyen / exotique | PR #8 fermée (test non concluant). |

---

## Notes de fond

- **Qualité protéique (T15)** — la dimension « qualité protéique » codée en dur (prime à l'animal) a été **retirée** : redondante avec l'analyse de l'acide aminé limitant et non justifiée hors digestibilité/leucine (écart compensable). Détail sourcé dans [`docs/recherche-qualite-proteique.md`](docs/recherche-qualite-proteique.md). Les pics anaboliques reposent désormais sur les **protéines totales** par repas, sans biais d'origine.
- **Volet environnemental** — non vérifié par la recherche (à documenter séparément avant tout affichage dans l'outil).
- **Base d'aliments (T14)** — direction retenue : **USDA unique, traduite en FR** via un build Python (`data/build_food_db_fr.py`, calcul fait une fois) → `data/foods.fr.json` (PR #20). Le **câblage** comme base unique dans l'app (recherche, chargement paresseux, remapping des presets) est l'étape en cours. L'ancienne double-source EN (PR #18) est fermée.
- **Base enrichie + impact planétaire (T21)** — projet datascience dans un **repo Git annexe** (itératif, séparé). Objectif du CDC ici : spécifier la sortie pour qu'elle soit exploitable dans nutricalc — suivi par plat des AAE, micronutriments, oligo-éléments, types de lipides… (aliments bruts, info la plus précise) **et** impact « limites planétaires » (surtout CO₂ et eau, autres indicateurs bienvenus ; dépendance possible saison / zone géographique). Périmètre exact à cadrer par grilling avant rédaction du CDC.
