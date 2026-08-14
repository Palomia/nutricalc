# Revue de fond de l'algorithme — score musculaire + suggestions

> Revue critique de l'algorithme d'analyse anabolique (point TODO « Revoir en
> profondeur l'algo — score musculaire + suggestions »). **Document d'analyse
> uniquement — aucune modification de code.** Servira de base à un futur refactor.
>
> Périmètre : `src/calc/aminoAcids.ts`, `src/calc/suggestions.ts`,
> `src/calc/macros.ts`, `src/calc/profile.ts`, `src/calc/report.ts`. Appui
> scientifique : `docs/recherche-qualite-proteique.md`.
>
> Date : 2026-08-14. Numéros de ligne relevés sur l'état actuel de la branche.

---

## 1. Cartographie du calcul

### 1.1 Chaîne des entrées

1. `dailyReport(profile)` (`report.ts:21`) assemble les cibles : énergie
   (`energy.ts`), macros (`macros.ts:187`) et, pour l'analyse anabolique,
   `muscleTargets` (`report.ts:37-41`) = `{ aminoAcids, proteinTargetG,
   energyTargetKcal }`.
   - `proteinTargetG = macros.protein.grams = np.proteinGPerKg.target ×
     effectiveWeightKg` (`macros.ts:200`).
   - `energyTargetKcal = TDEE + adjustment.target` — **la cible calorique
     inclut déjà l'ajustement de l'objectif** (surplus/déficit) (`energy.ts:35`).
   - `aminoAcids` = besoins FAO/OMS `mgPerKgBase × aaeFactor × effectiveWeightKg`
     (`macros.ts:146-151`), `aaeFactor` étant le « facteur sportif » du profil
     (1.0 → 2.0 ; `profile.ts:36`, explicitement étiqueté **EXTRAPOLATION
     PRODUIT** non officielle, `profile.ts:31-36`).
2. `analyzeMuscleProfile(day, targets)` (`aminoAcids.ts:216`) agrège l'apport
   réel de la journée : `dayMacros` (protéines/kcal), `dayAminoAcids` (9 AAE, en
   mg) et `proteinDistribution` (par repas).

### 1.2 Les cinq sous-scores (`aminoAcids.ts:227-259`)

| Sous-score | Formule (code) | Réf. | Plafond | Poids |
|---|---|---|---|---|
| `proteinScore` | `clamp01(proteinG / proteinTargetG)` (l.227) | journalier | 1 à 100 % | **0.30** |
| `aaeScore` | `limiting ? clamp01(limiting.coverage) : 0` (l.230) | journalier | 1 | **0.25** |
| `leucineScore` | `clamp01(nbRepas(leucine≥2,5 g) / N)` (l.235-244) | par repas + N journalier | 1 | **0.20** |
| `calorieScore` | `max(0, 1 − |kcal − cible| / cible)` (l.246-249) | journalier | 1 (symétrique) | **0.15** |
| `distributionScore` | `clamp01(pics / 3)` (l.251) | par repas | 1 à 3 pics | **0.10** |

- `limiting.coverage` = couverture de l'AAE **le moins couvert** de la journée
  (`limitingAminoAcid`, `aminoAcids.ts:104-111`) = `intakeMg / targetMg` du pire
  AAE — application de la loi de Liebig / AA limitant.
- `N = clamp(round(proteinTargetG / 35), 3, 7)` (`aminoAcids.ts:240-243`) : cible
  dynamique du nombre de « prises pleines » (~35 g = milieu de la fenêtre 25-40).
- `pic` = repas ≥ 25 g de protéines **totales** (`isAnabolicPeak`,
  `aminoAcids.ts:149`) ; pas de prime à l'origine animale (conforme au doc
  recherche §5).

**Agrégation** (`aminoAcids.ts:253-259`) :

```
total = 100 × (0.30·protein + 0.25·aae + 0.20·leucine + 0.15·calorie + 0.10·distribution)
```

Les poids `MUSCLE_WEIGHTS` (`aminoAcids.ts:174-180`) somment exactement à 1.0.
Bandes (`band`, `aminoAcids.ts:192-197`) : ≥90 excellent, ≥75 très bon, ≥50
correct, sinon limitant.

### 1.3 Suggestions (`suggestions.ts:84-136`)

Score de complémentarité par aliment candidat :

```
score = 0.70·(boostAAlimitant/100g / cibleAA) + 0.30·(prot/100g / cibleProt) [si déficit] − 0.15·(kcal/100g / cibleKcal)
```

(`WEIGHTS`, `suggestions.ts:60`). Filtres : régime actif (`filterFoods`) et
exclusion des aliments déjà présents à > 200 g (`presentGramsThreshold`,
`suggestions.ts:90,100-102`). On ne garde que `score > 0` (l.129), trié
décroissant, top `limit` (défaut 4).

---

## 2. Incohérences et angles morts (vérifiés sur le code)

### 2.1 Le sous-score le plus important est presque insensible à la répartition

`proteinScore` (0.30) + `aaeScore` (0.25) = **55 % du score** dépendent
uniquement des **totaux journaliers** (grammes de protéines, couverture du pire
AAE), sans aucune notion de répartition. Seuls `leucineScore` (0.20) et
`distributionScore` (0.10) portent la répartition, et tous deux sont **bornés
bas** (voir §2.3).

**Cas limite calculé** — 1 000 g de poulet (30 g prot/100 g) en **un seul repas**,
cibles prise de masse 70 kg (`proteinTargetG=140`, `energyTargetKcal=2500`) :

- `proteinScore = clamp01(300/140) = 1.00`
- `aaeScore` : 300 g de protéines de viande couvrent tous les AAE > 1 → `1.00`
- `leucineScore = 1 repas ≥ 2,5 g / N=round(140/35)=4 = 0.25`
- `distributionScore = 1 pic / 3 = 0.333`
- `calorieScore = 1 − |1370 − 2500|/2500 = 0.548`
- **total = 100 × (0.30 + 0.25 + 0.05 + 0.0333 + 0.0822) ≈ 71.5 → « correct »**,
  à 3,5 points de « très bon ».

Un bol de 300 g de protéines avalé en une fois — physiologiquement absurde —
décroche presque « très bon ». C'est l'effet direct du poids de la quantité.

### 2.2 « AA limitant » : les profils désignent souvent valine / histidine / soufrés, pas la lysine attendue

Le doc recherche (§2) conclut que **l'AA réellement critique est la lysine**
(céréales) et que **les AA soufrés ne sont pas limitants en pratique**. Or, en
appliquant les besoins de base (`macros.ts:96-106`) aux profils
(`food.ts` `AMINO_ACID_PROFILES`), l'AAE limitant par source est :

| Profil | AAE limitant (modèle) | Attendu (recherche) |
|---|---|---|
| egg | **leucine** | — (source complète) |
| dairy | **soufrés** | — |
| whey | **histidine** | — (protéine de très haute qualité) |
| meat | **valine** | — |
| fish | **valine** | — |
| soy | **soufrés** | — (haute qualité, DIAAS ~91) |
| legume | **soufrés** | lysine ≈ non limitant en pratique |
| cereal | **lysine** ✅ | lysine ✅ |
| nuts | **lysine** ✅ | lysine ✅ |

Deux problèmes concrets :

- **Le lactosérum (whey), protéine de référence, ressort « limité par
  l'histidine »** (ratio 1,80, le plus bas de tous les profils) : artefact du
  couple `base histidine = 10 mg/kg` × `whey histidine = 18 mg/g`. `aaeScore`
  pénalise donc à tort une source excellente.
- **Légumineuses/soja ressortent « limités par les soufrés »**, ce que le doc
  recherche réfute explicitement (§2). L'`aaeScore` et surtout la **raison
  affichée** par les suggestions (« riche en [AA limitant] », `suggestions.ts:148`)
  peuvent donc afficher un AA limitant contre-intuitif et non conforme aux
  sources validées.

Cause racine : les profils d'AAE (`food.ts`) et les besoins de base
(`macros.ts`) sont des jeux indicatifs saisis séparément ; leur **rapport**
(qui seul détermine l'AA limitant) n'a pas été calibré contre les DIAAS/limitants
connus. À noter : `aaeFactor` multiplie tous les besoins uniformément → il change
la **magnitude** d'`aaeScore` mais **jamais l'identité** de l'AA limitant (le
minimum est invariant d'échelle).

### 2.3 Deux sous-scores « comptent des repas » avec des référentiels et dénominateurs différents

`leucineScore` (0.20) et `distributionScore` (0.10) mesurent des choses très
proches — « combien de repas atteignent un seuil » — mais de façon incohérente :

- `distributionScore` = `pics / 3`, **dénominateur fixe = 3**, seuil = 25 g de
  protéines totales.
- `leucineScore` = `repas au seuil / N`, **dénominateur dynamique N ∈ [3,7]**,
  seuil = 2,5 g de leucine (≈ 31 g de protéines de viande, davantage en végétal).

Conséquences :

- **Redondance partielle** : les deux récompensent « étaler les protéines sur
  plusieurs repas ». ~30 % du score porte une intention presque identique.
- **Divergence côté végétal** : un repas légumineuse à 25 g de protéines
  (leucine ≈ 77 mg/g × 25 = 1,9 g) compte comme **pic** (distribution) mais
  **échoue au seuil leucine**. C'est peut-être le signal voulu (doc §5 : la
  leucine par repas est le seul avantage animal réellement additionnel), mais
  ce n'est ni documenté ni tranché — c'est un effet de bord, pas un choix.
- **Incohérence de bornage** : `distributionScore` sature dès 3 pics et ne
  pénalise **jamais** un excès (6-7 mini-repas → toujours 1.0), alors que le
  champ `bonus` (« 3 à 5 pics », `aminoAcids.ts:164`) — affiché dans l'UI
  (`DayAnalysis.tsx:334-336`) — devient **faux** au-delà de 5. Le score et le
  récit UI se contredisent.

### 2.4 La leucine peut compter deux fois — mais seulement pour l'œuf

Angle à examiner d'après la consigne : la leucine compte-t-elle dans l'AAE
limitant **et** dans son propre sous-score ? Vérification : la leucine n'est
l'AAE limitant que pour le profil **egg** (ratio 2,21, le plus bas). Pour toutes
les autres sources, le limitant est valine, histidine, soufrés ou lysine.

Donc le **double comptage de la leucine est réel mais marginal** : il ne se
produit que pour une journée dominée par l'œuf, où la leucine plafonne `aaeScore`
**et** alimente `leucineScore`. Ce n'est pas la redondance principale (celle de
§2.3 l'est bien davantage). Point d'honnêteté : la crainte « leucine comptée
deux fois partout » n'est **pas** confirmée par le code.

### 2.5 La fenêtre haute 25-40 g est morte : aucun plafond par repas

`inTargetRange` (25-40 g, `aminoAcids.ts:150-151`) est **calculé mais utilisé
nulle part** (ni scoring, ni UI — vérifié par recherche dans `src/`). Le scoring
ne connaît que `isAnabolicPeak` (≥ 25 g). Conséquence : **la borne haute de 40 g
n'a aucun effet**. Un repas de 80 g de protéines vaut exactement un repas de
35 g pour `distributionScore` et `proteinScore`. Le message produit « viser
25-40 g par prise » n'est donc jamais récompensé ni contrôlé par le score.

### 2.6 `calorieScore` symétrique : le même sous-score signifie l'inverse selon l'objectif

`energyTargetKcal` intègre déjà l'ajustement (`energy.ts:35`), donc « être à la
cible » = « avoir réalisé le surplus/déficit voulu ». La pénalité symétrique
autour de la cible **ajustée** est, à ce titre, cohérente en interne.

Le vrai problème est **conceptuel** : c'est un composant d'un score **musculaire**.

- En **prise de masse** (`muscleGain`, surplus +300 kcal) : atteindre la cible
  est effectivement pro-anabolique. ✅
- En **sèche avancée** (`aggressiveCut`, déficit −750 kcal) : atteindre la cible
  = manger 750 kcal **sous** le TDEE — un état catabolique — et pourtant
  `calorieScore` récompense pleinement ce déficit comme « bon pour le muscle ».

Le même sous-score encode donc « adhésion à l'objectif calorique », pas
« énergie disponible pour l'anabolisme », alors qu'il pèse 0.15 d'un **score de
construction musculaire**. De plus, `analyzeMuscleProfile` **ne reçoit pas la
direction de l'objectif** (`MuscleTargets` = seulement `energyTargetKcal`,
`report.ts:37-41`) : le scorer ne peut aujourd'hui pas distinguer surplus voulu
et déficit voulu.

### 2.7 `proteinScore` linéaire, plafonné : rien au-delà de 100 %

`clamp01` (l.228) fige à 1 dès la cible atteinte. Manger 2× ou 3× la cible
protéique n'apporte ni bonus ni malus. C'est **défendable** (l'excès protéique
n'entame pas la qualité anabolique et le doc §4 rappelle que « la quantité prime »),
mais il n'existe **aucun signal de sur-consommation** — cohérent avec l'absence
de plafond par repas (§2.5), à trancher ensemble.

### 2.8 Suggestions : plusieurs angles morts

- **Ignorent 30 % du score** : `suggestFoods` n'optimise que l'AA limitant et le
  déficit protéique (`suggestions.ts:104-125`). Rien ne cible `leucineScore` ni
  `distributionScore`. Suivre les suggestions ne peut donc pas réparer un
  problème de **répartition** ou de **leucine par repas** — pourtant 30 % du
  score et cœur du discours produit.
- **Pas de dimension « par repas »** : l'AA limitant est calculé sur la journée
  entière ; la suggestion ne dit ni **dans quel repas** ajouter, ni comment
  atteindre le seuil leucine d'un repas donné.
- **Étiquette de raison souvent trompeuse** : `aaContrib` porte le poids 0.70 vs
  0.30 pour les protéines, donc `aaContrib >= proteinContrib` (`suggestions.ts:147`)
  est vrai presque toujours → la quasi-totalité des suggestions affiche « riche
  en [AA limitant] », même quand c'est le déficit protéique qui pilote réellement
  le classement. Couplé à §2.2, l'AA nommé peut lui-même être douteux.
- **Seuil de présence en grammes bruts** : `presentGramsThreshold` (200 g,
  `suggestions.ts:90`) compte les grammes d'aliment, pas de protéines : 200 g de
  fromage blanc (peu dense) est traité comme 200 g de blanc de poulet.
- **Pénalité calorique plate** : `kcalPenalty` frappe uniformément (`WEIGHTS.kcalPenalty`
  hors somme des deux autres poids) ; elle peut défavoriser des légumineuses
  denses pourtant idéales pour l'AA limitant.

### 2.9 Sensibilité aux profils extrêmes

- **Âge** : les besoins en AAE (`macros.ts:146`) et le seuil leucine (2,5 g,
  `aminoAcids.ts:118`) sont **fixes quel que soit l'âge**. Or le doc §5 et son
  caveat (§« Limites ») soulignent la **résistance anabolique** du sujet âgé
  (> 65 ans, besoin/seuil supérieurs). Le score ne discrimine pas — angle mort
  reconnu par la recherche.
- **Poids très bas/haut** : cibles protéiques et AAE échelonnées sur
  `effectiveWeightKg = (poids + cible)/2` (`profile.ts:149-151`) → linéaire, pas
  de bug, mais un obèse sévère dose ses protéines sur un poids de référence
  élevé (surdosage possible). À noter, pas urgent.
- **Végétal strict** : `aaeScore` capte bien la limitation lysine des céréales
  (sourcé, doc §2), mais §2.2 montre que soja/légumineuses sont mal étiquetés
  (soufrés) et que le seuil leucine par repas (§2.3) pénalise mécaniquement le
  végétal — sans que ce soit un choix explicité.

### 2.10 Autres points mineurs vérifiés

- `limitingAminoAcid` renvoie `null` si `totalIntake ≤ 0` (`aminoAcids.ts:108-109`)
  → `aaeScore = 0`. Journée vide → total 0, bande « limitant » (test l.187-192).
  Correct et cohérent.
- `calorieScore` peut atteindre 0 dès 2× la cible ; pas de valeur négative
  (`max(0,…)`). OK.
- `MUSCLE_WEIGHTS` somment à 1.0 → `total ∈ [0,100]` garanti (test l.206-211). OK.

---

## 3. Propositions d'amélioration (priorisées)

Chaque proposition distingue **[sourcé]** (appui `docs/recherche-qualite-proteique.md`
ou FAO/OMS) de **[extrapolation produit]** (choix de conception).

### P1 — Recalibrer le rapport profils d'AAE / besoins de base *(priorité haute)*

- **Problème** : §2.2 — l'AA limitant désigné (whey→histidine, soja/légumineuses→soufrés)
  contredit les sources validées ; l'AAE limitant est censé être le juge de
  complétude (doc §1-2).
- **Changement** : auditer et recalibrer `AMINO_ACID_PROFILES` (`food.ts`)
  et/ou `AMINO_ACIDS_MG_PER_KG` (`macros.ts:96`) pour que, source par source,
  l'AA limitant coïncide avec les limitants connus (lysine pour céréales/noix ;
  aucune limitation forte pour whey/œuf/soja/pomme de terre). Vérifier notamment
  le couple histidine (base 10) et soufrés (base 15).
- **Justification** : **[sourcé]** doc §1-2 ; les valeurs actuelles sont
  explicitement « INDICATIVES, à revalider » (`food.ts` en-tête).
- **Impact/risque** : modifie `aaeScore` et les suggestions pour beaucoup de
  journées. Risque : re-calibrage lourd ; à faire avec une table de référence
  (DIAAS/FAO) et des tests de non-régression par profil.

### P2 — Fusionner / clarifier leucine et distribution *(priorité haute)*

- **Problème** : §2.3 redondance et incohérence de dénominateurs ; §2.5 plafond
  40 g mort.
- **Changement** : faire porter à un **unique** sous-score « répartition
  anabolique » le comptage des prises **dans la fenêtre 25-40 g** (réactiver
  `inTargetRange`) **et** le seuil leucine, avec un dénominateur commun `N` déjà
  calculé. Réserver un éventuel malus d'excès (> 40 g/repas) ou le rendre neutre,
  au choix (voir Q4).
- **Justification** : **[sourcé]** fenêtre 25-40 g et seuil leucine par repas
  (doc §5) ; **[extrapolation produit]** pour la fusion en un score unique et le
  dénominateur.
- **Impact/risque** : simplifie le modèle et supprime la contradiction UI (§2.3).
  Risque : rebasculer des poids (le 0.10+0.20 libéré doit être réalloué
  explicitement).

### P3 — Rendre `calorieScore` conscient de l'objectif *(priorité haute)*

- **Problème** : §2.6 — pénalité symétrique incohérente avec un score musculaire
  en déficit.
- **Changement** : passer la **direction de l'objectif** (`goal`/`CalorieGoal`)
  dans `MuscleTargets` (`report.ts:37`), puis rendre `calorieScore` **asymétrique** :
  en surplus/maintenance, récompenser d'atteindre la cible ; en déficit, ne pas
  récompenser le déficit comme pro-anabolique (plafonner l'apport du sous-score
  ou le neutraliser sous maintenance). Alternative : renommer le sous-score en
  « adhésion calorique » pour clarifier qu'il ne mesure pas l'anabolisme.
- **Justification** : **[extrapolation produit]** ; cohérence interne avec la
  sémantique « score de construction musculaire ».
- **Impact/risque** : change les scores des profils déficit (`fatLoss`,
  `aggressiveCut`). Risque : décision de conception à valider (Q2).

### P4 — Suggestions qui couvrent leucine et répartition *(priorité moyenne)*

- **Problème** : §2.8 — les suggestions ignorent 30 % du score et n'ont pas
  d'angle « par repas ».
- **Changement** : ajouter, quand `leucineScore`/`distributionScore` sont bas,
  une suggestion d'**action de répartition** (« ajouter une prise protéinée »,
  « viser 25-40 g au repas X ») plutôt qu'uniquement un aliment. Corriger
  l'étiquette de raison (§2.8) en comparant `aaFrac` et `proteinFrac`
  **avant pondération**, pas `aaContrib`/`proteinContrib`.
- **Justification** : **[extrapolation produit]** ; aligne suggestions et score.
- **Impact/risque** : faible risque ; l'étiquette est un correctif immédiat.

### P5 — Ouvrir la sensibilité à l'âge *(priorité moyenne, à sourcer)*

- **Problème** : §2.9 — seuil leucine et besoins AAE fixes, résistance anabolique
  du sujet âgé ignorée.
- **Changement** : relever le seuil leucine par repas (p. ex. vers 3 g) et/ou les
  besoins pour les > 65 ans.
- **Justification** : **[sourcé partiellement]** doc §5 (MPS âgé inférieure,
  seuil supérieur) — **mais** l'étude population clé exclut les > 65 ans (doc
  « Limites ») : chiffre exact à sourcer avant implémentation. À ne PAS
  transformer en prime animale (doc §6, question ouverte §2).
- **Impact/risque** : sensible ; nécessite une source dédiée. Ne pas
  implémenter « au jugé ».

### P6 — Décider du sort de la borne haute protéique/calorique *(priorité basse)*

- **Problème** : §2.5, §2.7 — aucun signal de sur-consommation.
- **Changement** : soit assumer l'absence de plafond (documenter), soit ajouter
  un léger malus au-delà d'un seuil raisonnable par repas / par jour.
- **Justification** : **[sourcé]** « quantité prime, excès non délétère pour la
  qualité » (doc §4) plaide plutôt pour **assumer** l'absence de malus protéique.
- **Impact/risque** : surtout un choix de discours produit.

### 3.1 Cas de test proposés (discriminants bon/mauvais)

1. **Concentration vs répartition** : même total protéique (140 g) en 1 repas vs
   4 repas de 35 g. Aujourd'hui l'écart de score est faible (~seul leucine 0.20 +
   distribution 0.10 varient). Un bon modèle doit **nettement** séparer les deux.
2. **Repas surdimensionné** : 3 repas de 80 g de protéines vs 3 repas de 35 g.
   Aujourd'hui **scores égaux** (borne 40 g morte, §2.5). Un modèle corrigé doit
   pénaliser (ou au moins ne pas maximiser) le premier.
3. **Whey pur** : journée à base de lactosérum. Aujourd'hui `aaeScore` plafonné
   par « histidine limitante » (§2.2) → une protéine de référence sous-notée.
   Test : `aaeScore` élevé attendu.
4. **Légumineuses/soja** : vérifier que l'AA limitant affiché n'est pas
   « soufrés » (contredit doc §2) mais cohérent avec les sources.
5. **Déficit vs surplus à la cible** : `aggressiveCut` à `energyTargetKcal` vs
   `muscleGain` à `energyTargetKcal`. Aujourd'hui `calorieScore = 1` dans les
   deux cas ; un modèle conscient de l'objectif (P3) doit les différencier.
6. **Végétal bien réparti** : 4 prises de 30 g de protéines végétales
   complémentaires (légumineuse + céréale). Vérifier que le score n'est pas
   pénalisé par une redondance leucine/distribution non voulue (§2.3).

---

## 4. Questions ouvertes (décisions de conception à trancher)

1. **Sémantique du score calorique** : le score musculaire doit-il récompenser
   l'adhésion à un objectif de **déficit** (sèche) au même titre qu'un surplus,
   ou refléter l'anabolisme réel (surplus favorable, déficit défavorable) ?
   (→ P3)
2. **Populations à besoins accrus** (> 65 ans, sportifs de force) : comment
   relever seuil leucine / besoins **sans réintroduire** une hiérarchie animale
   générale (doc, question ouverte §2) ? (→ P5)
3. **Redondance leucine ↔ distribution** : la divergence végétal (§2.3) est-elle
   un **signal voulu** (pénaliser le déficit leucine par repas, doc §5) ou un
   effet de bord à neutraliser ? Faut-il un sous-score unique (P2) ?
4. **Plafond par repas / par jour** : réactive-t-on la fenêtre 25-40 g comme
   contrainte (malus > 40 g) ou reste-t-elle purement indicative (§2.5, §2.7,
   P6) ?
5. **`aaeFactor`** : ce multiplicateur non officiel (`profile.ts:31-36`, jusqu'à
   2.0) durcit `aaeScore` et le dénominateur des suggestions. Le conserve-t-on,
   et sur quelle base le justifier au-delà de l'« extrapolation produit » ?
6. **Pondérations** : les poids 30/25/20/15/10 sont-ils le bon équilibre alors
   que 55 % dépendent des seuls totaux journaliers (§2.1) ? Toute fusion (P2) ou
   neutralisation (P3) impose de les réallouer explicitement.

---

## 5. Synthèse — incohérences majeures

1. **AA limitant mal calibré** (§2.2) : whey→histidine, soja/légumineuses→soufrés,
   à rebours des sources validées (doc §2). Touche `aaeScore` **et** la raison
   des suggestions.
2. **Score dominé par la quantité** (§2.1) : 55 % du poids sur les totaux
   journaliers → un bolus de 300 g de protéines en un repas score ~71,5.
3. **Redondance / incohérence leucine ↔ distribution** (§2.3) + **borne 40 g
   morte** (§2.5) : ~30 % du score mesure « des repas suffisants » de deux façons
   divergentes, et aucun plafond par repas n'est appliqué.
4. **`calorieScore` symétrique** (§2.6) : récompense un déficit de sèche comme
   pro-anabolique ; le scorer ne connaît même pas la direction de l'objectif.
5. **Suggestions désalignées du score** (§2.8) : n'optimisent ni leucine ni
   répartition (30 % du score) et affichent presque toujours « riche en [AA
   limitant] », y compris quand l'AA nommé est douteux.

Propositions prioritaires : **P1** (recalibrer les profils), **P2** (fusionner
leucine/distribution + réactiver 25-40 g), **P3** (calorieScore conscient de
l'objectif).
