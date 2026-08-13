# Recherche — Qualité protéique animale vs végétale (point TODO #15)

> Compte rendu de la recherche sourcée menée pour décider du sort de la dimension
> « qualité protéique » de nutricalc (classement en dur animal > végétal).
> Méthode : recherche multi-sources + vérification adverse (3 votes par
> affirmation, 2/3 réfutations pour éliminer). **21 sources**, 95 affirmations
> extraites, **25 vérifiées → 22 confirmées, 3 réfutées, 0 non conclusives.**
>
> Date : 2026-08-13. Outil : harnais *deep-research*. À revalider avant tout
> usage clinique — valeurs indicatives.

## Question posée

Dans un outil qui mesure **déjà** la complétude en acides aminés (analyse de
l'**acide aminé limitant**, référentiel FAO/OMS), est-il scientifiquement
justifié d'ajouter une dimension « qualité protéique » qui classe en dur les
sources animales (œufs, laitages, viande, poisson) **au-dessus** des sources
végétales (légumineuses, céréales, oléagineux) ? Faut-il la **conserver, la
reformuler ou la retirer** dans un outil à visée bas-carbone ?

## Réponse de synthèse

Une « prime de qualité » codée en dur qui classe **systématiquement** l'animal
au-dessus du végétal n'est que **partiellement justifiée** et, dans un outil qui
calcule déjà l'acide aminé limitant, **largement redondante**.

- Le **DIAAS** confirme un écart *moyen* animal > végétal (porc/caséine ~117,
  œuf ~101 vs pois ~70, riz ~47, maïs ~36), mais l'écart **n'est pas catégoriel**
  (soja ~91, pomme de terre ~100 atteignent la gamme « haute qualité »).
- Sa cause profonde — le **déficit en lysine** des céréales (et, marginalement,
  en AA soufrés des légumineuses) — est **exactement ce que capte déjà l'analyse
  de l'AA limitant**.
- Pour un **adulte sain non carencé**, l'adéquation protéique dépend d'abord de
  la **quantité**, pas de la qualité. La moindre digestibilité végétale se
  modélise par une pénalité **modeste (~5 %)**, compensée par la complémentarité
  et un apport légèrement supérieur.
- Le **seul avantage animal réellement additionnel** est le **seuil anabolique
  par repas** (leucine), mais il est **dose-compensable** et surtout pertinent
  chez les sujets âgés / sportifs.

**Recommandation : retirer ou reformuler le classement animal > végétal codé en
dur.** Au mieux, le conserver comme un **signal contextuel « leucine / seuil
anabolique par repas »** (ciblé âgés/sportifs), pas comme une hiérarchie
générale — ce qui est cohérent avec une visée bas-carbone.

---

## Conclusions vérifiées

### 1. L'écart DIAAS animal > végétal existe mais n'est pas absolu, et repose sur ce que l'AA limitant capte déjà — *confiance : élevée*

En DIAAS (référence 0,5–3 ans) : porc et caséine ~117, œuf ~101, lactosérum ~85
dépassent pois ~70, riz ~47, maïs ~36 ; **mais** soja ~91 et pomme de terre ~100
atteignent la gamme haute/excellente → l'écart n'est **pas catégoriel**. La FAO
recommande le DIAAS (vs PDCAAS) précisément parce qu'il note **chaque AA
indispensable** via la digestibilité iléale réelle et **retient le plus bas
(l'AA limitant)**. Les déficits caractéristiques (lysine des céréales, Met+Cys
des légumineuses) sont exactement ce qu'une analyse d'AA limitant identifie.
PDCAAS surestime systématiquement les sources de moindre qualité (surtout
végétales).

Sources : PMC7590266 ; FAO (PDF DIAAS) ; Cambridge BJN (DIAAS dairy/plant).

### 2. La cause profonde de l'infériorité végétale est le déficit en **lysine** ; les AA soufrés ne sont pas limitants en pratique — *confiance : élevée*

La complémentarité céréales/légumineuses est classiquement présentée comme
« céréales pauvres en lysine + légumineuses pauvres en AA soufrés », mais **en
pratique les AA soufrés ne sont pas limitants** (teneurs suffisantes dans la
plupart des végétaux). « L'acide aminé réellement critique est la lysine. »
Cette dimension unique est **intégralement captée par une analyse d'AA
limitant**.

Sources : Frontiers Nutrition 2021 (809685) ; PMC7590266.

### 3. La complémentarité végétale sur la journée compense largement les déficits et peut atteindre un DIAAS de 100 sans aucune protéine animale — *confiance : élevée*

Mélanges 100 % végétaux atteignant DIAAS 100 : pois/blé/pomme de terre 25/25/50,
maïs/pomme de terre 25/75. Le cadre FAO **ne tronque pas** les DIAAS > 100 des
aliments individuels, justement pour permettre à une source de compenser une
autre dans un régime mixte (si l'apport azoté total est suffisant). Mélanger
légumineuses et céréales relève le DIAAS vs la céréale seule (mung+millet 66 vs
millet 22 ; azuki+adlay 51 vs adlay 16). **Nuance :** pour des céréales très
pauvres, le mélange restait sous le seuil « bonne source » (75) → la
complémentarité améliore mais ne compense pas *totalement* dans les cas extrêmes.

Sources : PMC7590266 ; FAO (PDF DIAAS) ; PMC8541063.

### 4. Pour un adulte sain non carencé, l'adéquation dépend d'abord de la **quantité**, pas de la qualité ; l'écart de digestibilité (~5 %) est facilement compensé — *confiance : élevée*

Chez 1678 adultes français (INCA2) : prévalence d'inadéquation **< 0,05 %** pour
chaque AA et **0,31 %** pour les protéines. Substituer l'animal par du végétal
maintient l'adéquation quasi totale **jusqu'à ~50 %** de protéines végétales ;
l'inadéquation en lysine n'émerge qu'**au-delà de ~70 %**. La moindre
digestibilité végétale est modélisée par une **pénalité unique de 5 %**. En
privilégiant légumineuses/noix/graines plutôt que céréales, l'adéquation tient
jusqu'à **77–84 %** de protéines végétales. Titre de l'étude : « *Protein
Adequacy Is Primarily a Matter of Protein Quantity, Not Quality* ».
**Caveat :** l'étude exclut les > 65 ans (besoins supérieurs).

Source : PMC5748783.

### 5. Il existe un déficit anabolique par repas (leucine) pour certaines sources végétales, mais il est dose-compensable et le seuil est atteignable via des mélanges — *confiance : élevée*

Teneur en leucine plus basse côté végétal (**~7,1 % vs ~8,8 %**) ; la leucine
est le nutriment signal déclenchant la synthèse protéique musculaire (MPS). Chez
le sujet **âgé**, soja/blé isolés donnent une MPS **30–40 % inférieure** au
lactosérum à dose égale. **Mais** ce déficit est **dose-compensable** (60 g de
blé restaurent la MPS chez l'homme âgé) et un mélange végétal optimisé de 30 g
peut contenir **3 g de leucine**, suffisant pour déclencher la MPS. Les portions
animales « ounce-equivalent » livrent plus d'EAA (porc 7,36 g vs haricots noirs
3,02 g), mais c'est en partie un **artefact du cadrage par portion** (et l'étude
est financée par le *National Pork Board*). **C'est le seul avantage animal
réellement additionnel à l'AA limitant**, et il reste ciblé (âgés, sportifs) et
contournable.

Sources : PMC6723444 ; Frontiers Nutrition 2021 (809685) ; PMC10343739.

### 6. Recommandation de conception : retirer ou reformuler le classement animal > végétal codé en dur — *confiance : moyenne*

Synthèse : (a) l'écart de complétude/digestibilité est déjà capté par l'AA
limitant (lysine) que l'outil calcule ; (b) pour l'adulte sain, quantité >
qualité et l'écart de digestibilité (~5 %) est compensable ; (c) la
complémentarité végétale atteint DIAAS 100 ; (d) le seul apport additionnel est
le seuil anabolique leucine par repas, ciblé et dose-compensable. Une **prime
forfaitaire animale double** donc ce que l'AA limitant mesure déjà et **pénalise
à tort** des sources végétales de haute qualité (soja, pomme de terre,
mélanges). → La retirer, ou la reformuler en **signal contextuel « leucine par
repas »** plutôt qu'une hiérarchie générale. *Confiance moyenne : recommandation
de conception synthétisée, non tirée d'une source unique.*

Sources : PMC5748783 ; PMC7590266 ; PMC6723444.

---

## Affirmations réfutées (à NE PAS réutiliser)

Éliminées par vote 0–3 lors de la vérification adverse :

1. **« Les 4 protéines laitières testées sont toutes “excellentes” (DIAAS ≥ 100)
   tandis que soja et pois ne sont que “bons” et le blé sous les seuils. »**
   — trop catégorique, contredit par les valeurs réelles (soja/pomme de terre
   élevés). Source : Cambridge BJN.
2. **« Des mélanges d'isolats végétaux reproduisent le profil AA animal à ~98 %
   (lait 98,8 %, caséine 98,0 %). »** — non confirmé. Source : Frontiers
   Nutrition 2021 (809685).
3. **« Les aliments animaux produisent des pics plasmatiques de BCAA/leucine
   supérieurs à tous les temps (~120 min). »** — non confirmé. Source :
   PMC10343739.

---

## Limites et angles morts

- **Volet environnemental non vérifié.** Aucune des 22 affirmations confirmées ne
  porte sur l'empreinte carbone / eau / terres : les sources environnementales
  (Our World in Data, d'après Poore & Nemecek 2018) ont été **cherchées mais pas
  passées au crible de vérification** dans ce lot. Le consensus externe est
  largement défavorable à l'animal (ex. ordres de grandeur cités en recherche,
  **non vérifiés ici** : bœuf ~25–35 vs tofu ~3,5, pois ~0,8 kgCO₂eq / 100 g de
  protéines), mais **à documenter séparément** avant tout affichage dans l'outil.
- La plupart des valeurs DIAAS publiées utilisent le **référentiel enfant
  0,5–3 ans**, plus strict que le référentiel adulte → conservateur pour un
  adulte sain, mais pas directement transposable.
- L'étude population clé (PMC5748783) **exclut les > 65 ans**, dont les besoins
  et le seuil anabolique sont supérieurs.
- L'étude « ounce-equivalent » (PMC10343739) est **financée par le National Pork
  Board** (conflit d'intérêt) et compare des portions **non appariées** en
  protéines.
- Domaine stable : les données **FAO 2013** restent le standard en 2026.

## Questions ouvertes

1. Ampleur chiffrée réelle de l'empreinte carbone / eau / terres animale vs
   végétale — indispensable pour étayer la visée bas-carbone de l'outil.
2. Comment traiter les populations à besoins accrus (> 65 ans, sportifs de
   force) — chez qui le seuil anabolique leucine par repas discrimine vraiment —
   **sans réintroduire** une hiérarchie animale générale ?
3. Faut-il pondérer le score par la **faisabilité pratique de la
   complémentarité** (répartition des sources sur la journée / le repas) plutôt
   que par l'origine animale/végétale ?
4. Quel seuil de leucine par repas retenir, et comment le calculer de façon
   fiable à partir du profil d'AA déjà présent dans la base, pour remplacer la
   prime forfaitaire par un indicateur ciblé ?

## Implications pour nutricalc (décision #15)

- La dimension `proteinQuality` (tiers `excellent`/`tresBon`/`moyen`/`faible`
  de `src/calc/food.ts`) et son usage dans `aminoAcids.ts`
  (`proteinQualityScore`, pondération de `qualityProteinG` → pics anaboliques)
  **font largement doublon** avec `limitingAminoAcid`, déjà en place et mieux
  sourcé.
- Piste privilégiée : **retirer la hiérarchie animale forfaitaire**, garder l'AA
  limitant comme juge de complétude, et **reformuler la leucine en indicateur
  par repas** (déjà partiellement présent via `LEUCINE_THRESHOLDS` et les pics
  anaboliques) — sans étiqueter l'animal comme « meilleur » par défaut.
- Le volet environnemental, bien qu'aligné avec l'intention bas-carbone, doit
  être **sourcé séparément** avant d'apparaître dans l'UI.

---

## Sources (21)

| # | Source | Type | Angle |
|---|--------|------|-------|
| 1 | [PMC7590266 — Herreman et al. 2020, DIAAS plant vs animal](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7590266/) | primaire | DIAAS vs PDCAAS |
| 2 | [FAO — Dietary protein quality evaluation (DIAAS, PDF)](https://www.fao.org/ag/humannutrition/35978-02317b979a686a57aa4593304ffc17f06.pdf) | primaire | DIAAS vs PDCAAS |
| 3 | [PMC8541063 — DIAAS de mélanges légumineuses/céréales](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8541063/) | primaire | DIAAS vs PDCAAS / complémentarité |
| 4 | [Cambridge BJN — DIAAS dairy & plant proteins](https://www.cambridge.org/core/journals/british-journal-of-nutrition/article/values-for-digestible-indispensable-amino-acid-scores-diaas-for-some-dairy-and-plant-proteins-may-better-describe-protein-quality-than-values-calculated-using-the-concept-for-protein-digestibilitycorrected-amino-acid-scores-pdcaas/E7AE34F8A5BCEA5A9FBFBC72E72B93DF) | primaire | DIAAS vs PDCAAS |
| 5 | [PMC5748783 — « Protein Adequacy Is Primarily a Matter of Quantity, Not Quality » (INCA2)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5748783/) | primaire | complémentarité / dose |
| 6 | [Frontiers Nutrition 2021 — complémentarité végétale](https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2021.809685/full) | primaire | complémentarité / dose |
| 7 | [PMC6893534](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6893534/) | secondaire | complémentarité / dose |
| 8 | [PMC10343739 — ounce-equivalent EAA (financé Pork Board)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10343739/) | primaire | complémentarité / dose |
| 9 | [Oxford IJFST — complémentarité céréales/légumineuses (PDF)](https://academic.oup.com/ijfst/article-pdf/51/3/543/59499644/ijfs13035.pdf) | secondaire | complémentarité / dose |
| 10 | [PMC6723444 — Anabolic properties plant vs animal (revue)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6723444/) | primaire | leucine / seuil anabolique |
| 11 | [PMC11153912](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11153912/) | primaire | leucine / seuil anabolique |
| 12 | [ScienceDirect S0022316622088496](https://www.sciencedirect.com/science/article/pii/S0022316622088496) | primaire | leucine / seuil anabolique |
| 13 | [PMC11281145](https://pmc.ncbi.nlm.nih.gov/articles/PMC11281145/) | primaire | leucine / seuil anabolique |
| 14 | [PMC11579064](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11579064/) | primaire | leucine / seuil anabolique |
| 15 | [PMC6245118](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6245118/) | primaire | leucine / seuil anabolique |
| 16 | [OWID — GHG per 100 g protein (Poore & Nemecek)](https://ourworldindata.org/grapher/ghg-per-protein-poore) | secondaire | coût environnemental *(non vérifié)* |
| 17 | [OWID — Environmental impacts of food](https://ourworldindata.org/environmental-impacts-of-food) | secondaire | coût environnemental *(non vérifié)* |
| 18 | [PMC11675218 — Redefining Protein Quality (santé + environnement)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11675218/) | secondaire | coût environnemental *(non vérifié)* |
| 19 | [OWID — Less meat or sustainable meat](https://ourworldindata.org/less-meat-or-sustainable-meat) | secondaire | coût environnemental *(non vérifié)* |
| 20 | [ScienceDirect S0002916524004581](https://www.sciencedirect.com/science/article/pii/S0002916524004581) | primaire | adulte sain non carencé |

*(Le tableau liste les URL distinctes retenues ; certaines couvrent plusieurs
angles.)*
