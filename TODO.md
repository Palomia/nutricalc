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
| T14 | Implémenter `foods.sr_legacy.json` dans l'app | ⬜ | ✅ (chantier dédié) | XL | 7 793 aliments (noms EN), à mapper vers le type `Food` et au moteur AAE ; nécessite un sélecteur avec recherche. À traiter seul (gros impact sur `food.ts` + `MealPlanner`). |
| T1 | Solution de repli quand la BDD manque de macros/AAE | ⬜ | ⚠️ pertinent surtout après T14 | M | Sur la base `FOODS` actuelle (complète) le repli a peu d'objet ; prend son sens avec `foods.json` (champs parfois absents). |
| — | Revoir en profondeur l'algo (score musculaire + suggestions) | ⬜ | ✅ | L | Cohérence des pondérations, plafonds et seuils (par repas vs journalier), pertinence des critères. Voir aussi T16. |
| T16 | Correctif lisibilité score leucine (287 % ARJ → sous-score 67 %) | 🔬 | ✅ | S | Cause identifiée : besoin *journalier* (~2,5 g/j) vs seuil anabolique *par repas* (2,5 g/repas), même chiffre + plafonnement + moyenne par repas. Reste à clarifier l'UI (distinguer « couverture journalière » et « atteinte du seuil par repas »). |
| T3 | « Une meilleure … avec des exemples et des sources » | 🧭 | ⚠️ à préciser | ? | Intitulé ambigu : meilleure quoi (base ? interface ? explications ?) et quelles sources/exemples. À cadrer avant de lancer. |
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
| — | Point d'info « leucine anabolique » (pédagogie des pics) | PR #14 |

## ❌ Abandonné

| # | Tâche | Raison |
|---|-------|--------|
| T5 | Segmentation aliments classique / moyen / exotique | PR #8 fermée (test non concluant). |

---

## Notes de fond

- **Qualité protéique (T15)** — la dimension « qualité protéique » codée en dur (prime à l'animal) a été **retirée** : redondante avec l'analyse de l'acide aminé limitant et non justifiée hors digestibilité/leucine (écart compensable). Détail sourcé dans [`docs/recherche-qualite-proteique.md`](docs/recherche-qualite-proteique.md). Les pics anaboliques reposent désormais sur les **protéines totales** par repas, sans biais d'origine.
- **Volet environnemental** — non vérifié par la recherche (à documenter séparément avant tout affichage dans l'outil).
