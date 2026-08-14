# nutricalc — backlog & pilotage

Board **actif** du projet : tâches à faire, priorités, blocages, complexité, et qui travaille quoi.
Sert à **coordonner plusieurs agents** et à **recueillir tes idées/requêtes**.

> Rôles des fichiers : **`BACKLOG.md`** (ce fichier) = travail *à faire* + idées. **`TODO.md`** = *journal des livraisons* (Fait / Abandonné) + notes de fond. **`docs/`** = recherche & specs (`recherche-qualite-proteique.md`, `revue-algo-score.md`, `etude-sources-donnees-t21.md`).

## Comment l'utiliser

- **Toi** : ajoute librement des tâches/idées (section « Boîte à idées » en bas, ou une ligne dans le tableau). Change les priorités quand tu veux.
- **Un agent qui prend une tâche** : met son nom/branche dans **Assigné**, passe **Statut** à 🚧, et à la livraison indique la **PR** dans les Notes puis Statut ✅ (et bascule la ligne dans `TODO.md` « Fait »).
- **Avant de lancer des agents en parallèle** : vérifier la colonne **Parallélisable ?** — deux tâches qui touchent les mêmes fichiers ne doivent pas tourner en même temps (conflits/« sable »).

**Légende** — **Prio** : P1 (haute) · P2 (moyenne) · P3 (basse/plus tard). **Cplx** : S (<½j) · M · L · XL (chantier). **Statut** : ⬜ à faire · 🚧 en cours · ⛔ bloqué · ✅ fait.

## Tâches

| ID | Tâche | Prio | Cplx | Statut | Dépend / bloquant | Parallélisable ? | Assigné | Notes |
|----|-------|:----:|:----:|:------:|-------------------|------------------|---------|-------|
| ALGO | Corrections de l'algo (score musculaire + suggestions) | P1 | L | ⬜ | Aucun (débloqué post-#23) | ⚠️ Non avec toute tâche touchant `aminoAcids.ts`/`suggestions.ts`/`food.ts` → **lancer seule** | — | Revue = `docs/revue-algo-score.md` (#22). P1 recalibrer l'AA limitant (sur vraie donnée USDA), P2 fusionner leucine + répartition & réactiver la fenêtre 25-40 g, P3 `calorieScore` conscient de l'objectif, réaligner les suggestions. |
| T21-DS | Projet datascience : produire la base d'aliments enrichie | P1 | XL | 🚧 | Aucun (CDC prêt) | ✅ Oui — **repo annexe**, indépendant de nutricalc | pipeline (branche `feat/pipeline-v1`, repo annexe) | Piloté dans `Palomia/nutricalc-food-data` (`/work/nutricalc-food-data`), CDC = README. Fusion USDA→CIQUAL→Agribalyse ; sortie = base qui remplacera `foods.fr.json`. **Avancement :** socle posé (schéma + enveloppe de champ + validateur stdlib), loader **pivot USDA** en cours (hors-ligne, CSV SR Legacy importés). Sous-board détaillé + coordination des agents : `BACKLOG.md` **du repo annexe**. |
| T20 | Plats & repas standard préréglés (burger, pizza, gratin, menu BigMac) | P2 | M | ⬜ | Aucun | ⚠️ Touche presets/`useMeals`/`MealEditor` → éviter en //​ avec ALGO/T1 | — | Bibliothèque d'aliments composés / repas préréglés ; réutiliser la persistance et le remapping presets (`presetFoods.ts`). |
| T1 | Repli quand la BDD manque de macros/AAE | P2 | M | ⬜ | Couplé à ALGO | ⚠️ Touche `aminoAcids.ts`/`food.ts` → grouper avec ALGO | — | Partiellement traité par #23 (l'app tolère les profils AAE absents) ; reste à formaliser repli + affichage des champs manquants. |
| T22 | Page « approfondie » (champs Tier 1+2) | P3 | M | ⛔ | Dépend de la base DS (T21-DS) | ✅ (une fois débloquée) | — | Exposer DIAAS/digestibilité, sodium/sel, NOVA, fer héminique + inhibiteurs, index glycémique, cholestérol, vit. K, choline, B5/B7, fraction comestible/portion. Données collectées mais non affichées aujourd'hui. |
| T17 | Compléments alimentaires | P3 | L | ⬜ | « À la toute fin » (choix) | ✅ | — | À comparer aux recommandations d'aliments non transformés qui « fit » bien. |

## Boîte à idées (à trier)

_Dépose ici tes idées brutes ; on les transformera en tâches (ID + prio + cplx) au prochain passage._

- …
