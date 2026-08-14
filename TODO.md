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
| T14 (câblage) | Câbler `foods.fr.json` comme base d'aliments **unique** (recherche + chargement paresseux) | 🚧 | ✅ | XL | Données livrées (PR #20). Câblage app en cours : remplacer la base curatée `FOODS`, recherche par saisie dans `MealEditor`, résolution + chargement paresseux (~4,5 Mo), remapper les presets (journée type, cuisson/vinaigrette, suggestions) vers des aliments USDA-FR. |
| — | Revoir en profondeur l'algo (score musculaire + suggestions) | ⬜ | ✅ | L | Cohérence des pondérations, plafonds et seuils (par repas vs journalier), pertinence des critères. |
| T1 | Solution de repli quand la BDD manque de macros/AAE | ⬜ | ⚠️ pertinent avec T14 | M | Prend son sens avec `foods.fr.json` (champs parfois absents : 4 760/7 793 ont un profil AAE complet). |
| T19 | Voir les apports aux mailles aliment, plat et repas | ⬜ | ✅ | M | Recouvrement partiel : les macros par plat/repas sont déjà affichées. Reste le détail à la maille ingrédient et, éventuellement, les AAE par niveau. |
| T20 | Plats et repas standard préréglés (burger, pizza, gratin de courgette ; menu type BigMac) | ⬜ | ✅ | M | Bibliothèque d'aliments composés / repas préréglés. Proche de T13 (journée type) et T2 (bibliothèque de modèles) — réutiliser la persistance existante. |
| T21 | Cahier des charges d'un projet datascience annexe : base d'aliments enrichie + impact planétaire | 🧭 | ⚠️ à cadrer (grilling) | M | Sortie attendue = base d'aliments bruts la plus précise (AAE, micronutriments, oligo-éléments, types de lipides…) + impact « limites planétaires » (surtout CO₂ et eau ; éventuellement saison / zone géographique). Le projet DS vit dans un **repo Git annexe**, itératif ; ici on rédige le **CDC** pour que sa sortie nous soit réellement exploitable dans nutricalc. |
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
