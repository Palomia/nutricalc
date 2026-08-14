# Étude des sources de données (T21) — base d'aliments enrichie + impact « limites planétaires »

**Statut :** document de travail, base factuelle pour le futur cahier des charges (CDC) du projet datascience annexe. Ne remplace pas le CDC (rédigé après cadrage). Aucune modification de code.

**Date de rédaction :** 13 août 2026. Sources web consultées les 13-14 août 2026 (URL + version citées).

**Convention :** les affirmations sourcées portent une référence ; les extrapolations sont explicitement marquées **[Hypothèse]** ou **[À vérifier]**.

---

## 0. Rappel du besoin et décisions déjà prises

- La base DS décrira des **ingrédients bruts** (pas des plats).
- Elle **remplacera** `data/foods.fr.json` (base fusionnée unique), avec **USDA comme source majeure**, notamment pour les **profils d'acides aminés essentiels (AAE)** dont le moteur anabolique a besoin (leucine, AA limitant).
- Deux volets : (a) **composition fine** (AAE, micronutriments, oligo-éléments, sous-types de lipides) ; (b) **impact « limites planétaires »** (surtout CO₂ et eau ; autres indicateurs bienvenus ; dépendance possible saison / zone géographique).
- Base actuelle : USDA SR Legacy traduite → `foods.fr.json`, 7 793 aliments dont 4 760 avec profil d'AAE complet (cf. `data/README.md`).

Le point dur identifié d'emblée : **aucune source unique ne couvre à la fois les AAE fins et l'impact environnemental**. Le projet est donc nécessairement une **fusion multi-sources** avec un enjeu de **correspondance (matching)** entre référentiels.

---

## 1. Agribalyse (ADEME) — volet impact environnemental

### Contenu et version
- **Version de référence : AGRIBALYSE 3.2, publiée en novembre 2024** (la plus récente). Historique : 3.0 (juin 2020), 3.0.1, 3.1 (oct. 2022), 3.1.1 (juin 2023), 3.2 (nov. 2024). Rythme annoncé : une version tous les 18-24 mois ; prochaine mise à jour majeure attendue en 2026.
- **Couverture : « plus de 200 productions agricoles » + « plus de 2 500 aliments prêts à être consommés ».** Couvre à la fois **bruts** (ex. pomme, blé sortie ferme) et **transformés / plats préparés** (ex. compote, muffin).
- Piège de nommage : le jeu data.gouv historiquement intitulé « 3.1.1 synthèse » pointe désormais vers les données 3.2 — se fier au numéro de version dans les métadonnées, pas au titre de la page.

### Indicateurs environnementaux (le cœur du volet impact)
- **Unité fonctionnelle : par 1 kg de produit** (pas par 100 g).
- **16 indicateurs PEF (méthode EF de la Commission européenne) + 1 Score unique EF agrégé** par produit :

| # | Indicateur (FR) | Unité |
|---|---|---|
| 1 | Changement climatique (empreinte carbone) | **kg CO₂ eq** |
| 2 | Appauvrissement couche d'ozone | kg CFC-11 eq |
| 3 | Rayonnements ionisants | kBq U-235 eq |
| 4 | Formation photochimique d'ozone | kg NMVOC eq |
| 5 | Particules fines | disease incidence |
| 6 | Toxicité humaine — non cancérogène | CTUh |
| 7 | Toxicité humaine — cancérogène | CTUh |
| 8 | Acidification | mol H⁺ eq |
| 9 | Eutrophisation eaux douces | kg P eq |
| 10 | Eutrophisation marine | kg N eq |
| 11 | Eutrophisation terrestre | mol N eq |
| 12 | Écotoxicité eaux douces | CTUe |
| 13 | Utilisation des sols | Pt (sans dimension) |
| 14 | **Épuisement ressource eau** | **m³ depriv.** (m³ world eq, indice de privation) |
| 15 | Épuisement ressources énergétiques (fossiles) | MJ |
| 16 | Épuisement ressources minérales/métaux | kg Sb eq |

- **Score unique EF** : agrégation pondérée des 16, en **mPt (milli-points)** — 1 Pt ≈ impact environnemental annuel d'un citoyen européen. (Selon les fichiers, µPt/mPt : vérifier l'en-tête de colonne.)
- Les deux indicateurs prioritaires du besoin nutricalc (CO₂ et eau) sont **directement disponibles** : indicateur #1 (kg CO₂ eq) et #14 (m³ depriv.).

### Composition nutritionnelle
- Agribalyse **ne recalcule pas la nutrition** : pour les aliments consommés, il **partage la nomenclature de la table CIQUAL** (Anses). La compo vient de CIQUAL, pas d'Agribalyse.

### Acides aminés — **NON (confirmé)**
- **Agribalyse ne fournit pas les profils d'acides aminés**, car sa nutrition repose sur CIQUAL, et **CIQUAL ne publie pas les teneurs en AA individuels**. L'avis Anses sur les orientations CIQUAL liste la détermination des teneurs en AA protéinogènes comme un **travail futur** (pas encore disponible).
- **Conséquence :** Agribalyse/CIQUAL ne peuvent pas alimenter le moteur anabolique. Les AAE devront venir d'ailleurs (USDA en tête). C'est la justification structurelle du choix « USDA source majeure ».

### Licence et formats
- **Licence Ouverte / Etalab 2.0** : réutilisation libre (y compris commerciale), gratuite, avec mention de la paternité (source + millésime).
- **Nuance :** les inventaires ACV **détaillés** (exploitables dans un logiciel ACV) reposent sur **ecoinvent** et **exigent une licence ecoinvent**. Seuls les **résultats agrégés « prêts à consommer »** sont pleinement ouverts. → Pour nutricalc (on veut les résultats par produit, pas de refaire l'ACV), la version ouverte suffit.
- **Formats :** CSV (synthèse + détail par étape + détail par ingrédient) sur data.ademe.fr / data.gouv.fr ; XLSX version complète (Dataverse, DOI 10.57745/XTENSJ) ; **API « Impacts environnementaux — AGRIBALYSE® »** (Etalab) ; fiches par aliment sur agribalyse.ademe.fr.

### Limites
- **Produits MOYENS consommés en France** (mix de consommation moyen : origines, modes de production, transports pondérés) — pas de marque/exploitation spécifique.
- **Pas de saisonnalité ni de granularité géographique fine par défaut** (voir §4).
- **Robustesse inégale selon les indicateurs** (écotoxicité, toxicité humaine, usage des sols réputés plus incertains — indicateurs PEF fragiles).
- **Dépendance ecoinvent** pour l'usage avancé.
- **Erreurs résiduelles v3.2** en cours de correction (œufs, label BBC, quinoa, certains codes) — à surveiller si on fige une version.

**Sources :** doc.agribalyse.fr (introduction ; méthodologie ACV ; accès aux données ; évolution de la base) ; data.gouv.fr (Agribalyse synthèse) ; data.ademe.fr ; agribalyse.ademe.fr ; ciqual.anses.fr ; avis Anses NUT2019SA0030.

---

## 2. Poore & Nemecek (2018) + Our World in Data (OWID) — recoupement impact

### Contenu
- Poore, J. & Nemecek, T. (2018), *Reducing food's environmental impacts through producers and consumers*, **Science 360(6392), 987-992** (1er juin 2018 ; DOI 10.1126/science.aaq0216). **Erratum publié le 22 février 2019** (à intégrer pour tout usage rigoureux).
- Méta-analyse de **~570 études LCA**, **~38 700 fermes** dans **119 pays**. **40 produits/catégories** représentant ~90 % de l'apport mondial protéines+calories. Année de référence médiane ~2010.
- **Périmètre : « cradle-to-retail »** (champ → point de vente). **Exclut** la phase consommateur (cuisson, réfrigération, gaspillage domestique). Périmètre donc **différent d'Agribalyse** (attention aux comparaisons directes).

### Indicateurs et unités
| Indicateur | Unité |
|---|---|
| Émissions GES | kg CO₂ eq (GWP100) |
| Usage des terres | m² (·an) |
| Eutrophisation | g PO₄ eq |
| Acidification terrestre | g SO₂ eq |
| Prélèvement d'eau douce pondéré par la rareté | litres (scarcity-weighted) |

- **Unités fonctionnelles OWID :** par **kg d'aliment**, par **100 g de protéines**, par **1 000 kcal** — l'angle « par 100 g de protéines » est un atout unique pour un outil nutritionnel.

### Granularité
- **Générique / moyennes mondiales par catégorie** — **pas** de valeurs par pays/région (confirmé par la FAQ OWID).
- **Point fort : la variabilité documentée** — par produit, **médiane + 10e/90e percentiles** (+ moyenne). L'impact peut varier **jusqu'à ~50×** entre producteurs d'un même produit. Attention : OWID mélange médiane (valeur par défaut) et moyenne (décomposition par étape) selon les graphiques.

### Licence et formats
- **Données OWID : Creative Commons BY** (réutilisation libre avec attribution) — mais **créditer aussi la source primaire** (Science). Accès : graphers avec **téléchargement CSV** et **API**. Le dataset complet est en **supplément** de l'article Science.

### Utilité comme recoupement
- **Avantages :** angle « par 100 g de protéines » ; distribution (médiane/percentiles) pour situer une valeur Agribalyse dans une fourchette plausible ; CC-BY + CSV/API.
- **Limites :** générique/non franco-français ; seulement ~40 catégories (vs ~2 500 Agribalyse) ; périmètre cradle-to-retail ; données ~2010 + erratum.
- **Conclusion :** **cross-check de plausibilité et source pour l'axe « par 100 g de protéines »**, pas une base primaire. Recommandation : Agribalyse primaire, OWID en contrôle d'ordre de grandeur.

**Sources :** science.org (DOI + suppléments) ; PubMed 29853680 ; ourworldindata.org (Environmental Impacts of Food, màj nov. 2022 ; FAQs ; graphers ghg-per-kg-poore, ghg-per-protein-poore) ; greencalculus (fiche Poore & Nemecek).

---

## 3. Composition et AAE — au-delà d'USDA SR Legacy

### USDA FoodData Central (fdc.nal.usda.gov)
5 types de données :

| Type | Volume (ordre de grandeur) | AAE | Lipides fins | Mise à jour |
|---|---|---|---|---|
| **SR Legacy** | ~7 793 aliments | Oui — **couverture la plus large en nombre d'aliments** | Oui (AGS/AGMI/AGPI, AG individuels) | **Figée (release finale avril 2018, n'évolue plus)** |
| **Foundation Foods** | petit (~470 estimé ; **[À vérifier]** = 8 262 reference foods − 7 793 SR Legacy) | Oui — **meilleure qualité** (analytique récent + métadonnées : nb échantillons, méthode, cultivar) | Oui, très fin | 2×/an (dernière 12/2025) |
| **FNDDS / Survey** | ~5 500 codes (2021-2023) | Oui (2 108 profils AA sur 3 302 codes ingrédients), 65 constituants | Oui | Tous les 2 ans (dernière 10/2024) |
| **Branded Foods** | ~2 M | **Non** (étiquette) | Non | Mensuelle |
| **Experimental** | faible | variable | variable | selon publications |

- **Meilleur pour les AAE : SR Legacy (couverture) + Foundation Foods (qualité).** FNDDS hérite ses AA de SR/Foundation. Branded inexploitable pour les AAE.
- **Licence : domaine public** (œuvre du gouvernement US) — réutilisation commerciale libre, **atout décisif** face aux sources sous attribution.
- **Point de vigilance :** SR Legacy est **figée depuis 2018**. Pour rester à jour, prévoir un mapping vers Foundation Foods (et compléments ci-dessous).

### CIQUAL (ANSES) — ciqual.anses.fr
- **Ciqual 2025** (nov./déc. 2025) : **3 484 aliments**, **74 constituants** (vs 3 185 / 67 en 2020).
- **Acides gras : point fort confirmé** — AG individuels, AGS/AGMI/AGPI, oméga-3/oméga-6 dont **ALA, EPA, DHA**.
- **AA individuels : NON (confirmé)** — protéines totales oui, mais pas le profil des 9 AAE.
- **Licence : Ouverte / Etalab.** → **Complément idéal pour le détail lipidique** et les micronutriments sur aliments FR/UE, **pas pour les AAE**.

### Autres bases avec AAE
- **BLS 4.0 (Allemagne, Max Rubner-Institut)** : **gratuit et sans licence depuis le 16 déc. 2025** (auparavant payant). ~**7 140 aliments**, **138 nutriments** incluant explicitement **AA et AG**. → **complément majeur** pour combler les AAE/micronutriments manquants d'USDA. (blsdb.de)
- **FAO/INFOODS** : pas de base AA généraliste publique unique, mais bases spécialisées **uPulses 1.0** (légumineuses : AA + AG), **uFiSh 1.0** (poissons/fruits de mer : AA + AG), AnFooD 2.0. Licence CC-BY selon produit. → **complément ciblé** sur les points faibles récurrents (légumineuses, produits de la mer).
- **Frida (Danemark, DTU) v5.3** (nov. 2024) : AA + détail lipidique riche. Gratuit, **attribution obligatoire**. → recoupement.
- **McCance & Widdowson / CoFID (UK 2021)** : bon sur AG, mais **AA/oméga-3-6 hors du dataset principal** ; OGL gratuit. → peu adapté aux AAE.
- **Fineli (Finlande)** : profils AA partiels.

### Réponse à la question clé
**Oui — USDA FoodData Central reste la meilleure source majeure pour une base d'ingrédients bruts avec profil AAE complet** (SR Legacy pour la couverture + Foundation Foods pour la qualité), en **domaine public**. Compléments recommandés, par ordre d'intérêt : **(1) BLS 4.0** (AAE + micronutriments manquants), **(2) INFOODS uPulses/uFiSh** (légumineuses, produits de la mer), **(3) CIQUAL 2025** (lipides fins + alignement FR), **(4) Frida** (recoupement).

**Sources :** fdc.nal.usda.gov (about-us, data-documentation, log, download-datasets) ; jn.nutrition.org & cdn.nutrition.org (FNDDS 2021-2023, AA) ; ciqual.anses.fr (table 2025) ; data.gouv.fr (CIQUAL 2020) ; fao.org/infoods ; blsdb.de + heise.de/agrolab (BLS 4.0 gratuit 12/2025) ; frida.fooddata.dk ; gov.uk (CoFID 2021) ; fineli.fi.

---

## 4. Variabilité saison / zone géographique — que peut-on réellement faire ?

**Constat principal (sourcé) :** les bases ACV « prêtes à l'emploi » raisonnent en **moyennes de consommation** et **n'offrent pas de granularité saison/origine par défaut**.

- **Agribalyse** utilise des **mix de consommation français** : pour la tomate transformée, moyenne pondérée 18 % France / 46 % Italie / 36 % Espagne. La plupart des ~2 500 produits n'ont **qu'un seul jeu d'indicateurs**, sans variante marque/bio/saison.
- **Exceptions documentées :** quelques produits « phares » (tomate, fraise, haricots verts Kenya vs France) ont des **variantes saisonnières / transport aérien**. Ordre de grandeur : une **tomate hors saison ≈ 4× les émissions d'une tomate de saison** (serre chauffée) — donc l'effet saison/origine est **réel et important** quand il est modélisé, mais **non généralisé** dans la base.
- **OWID / Poore & Nemecek :** pas de granularité pays/région non plus, mais fournit une **distribution (médiane, 10e/90e percentiles)** — utile pour *encadrer* la variabilité sans la géolocaliser.
- **Littérature LCA dédiée** (ex. revues systématiques sur la tomate : plein champ ~80 kg CO₂/t vs serre chauffée ~1 709 kg CO₂/t) : la donnée saison/origine **existe mais de façon éparse**, étude par étude, sans référentiel homogène couvrant tous les aliments.

**Implication (faisabilité) :**
- **Faisable à court terme :** exploiter les **variantes saison/origine déjà présentes dans Agribalyse** pour une poignée d'aliments emblématiques (tomate, fraise, haricot vert…) — coût faible, effet pédagogique fort.
- **[Hypothèse] Coûteux / risqué :** une **modélisation saison×origine généralisée** sur toute la base supposerait de refaire des LCA ou d'agréger de la littérature hétérogène — **chantier disproportionné** pour un projet annexe. Recommandation : traiter la saisonnalité comme un **enrichissement optionnel, ciblé sur quelques aliments**, pas comme une dimension systématique.

**Sources :** doc.agribalyse.fr (périmètre des données) ; ecoco2.com ; agri-decouverte / agrobio-bretagne (ordre de grandeur saison) ; ScienceDirect/CSS UMich (revue systématique LCA tomate).

---

## 5. Correspondance entre sources (le point dur)

**Enjeu :** matcher **USDA (ingrédient + AAE)** ↔ **CIQUAL/Agribalyse (compo FR + impact)** ↔ compléments (BLS, INFOODS…). Aucune source n'a tout ; il faut un **référentiel pivot** et une stratégie de jointure.

### Ce qui existe
- **LanguaL™** : thésaurus international de description d'aliments (facettes) **utilisé par USDA, EuroFIR et CIQUAL**. **SR Legacy embarque des codes LanguaL** (fichier « LanguaL Factors ») + **noms scientifiques** + facteurs azote-protéines. → **LanguaL est le meilleur pont candidat** entre USDA et le monde CIQUAL/EuroFIR.
- **FoodEx2 (EFSA)** : système de classification/description harmonisé de l'UE (alternative/complément à LanguaL). Adopté progressivement (≈ 6 tables de composition + 25 jeux de conso de 18 pays codés ou en cours). → pertinent côté européen, moins côté USDA.
- **Code CIQUAL** : **clé de jointure directe entre CIQUAL et Agribalyse** (Agribalyse « aliments consommés » suit la nomenclature CIQUAL). Donc **CIQUAL ↔ Agribalyse est quasi gratuit** ; le coût est sur **USDA ↔ CIQUAL**.

### Ce qui n'existe pas
- **Aucun crosswalk officiel prêt à l'emploi USDA ↔ CIQUAL/Agribalyse.** L'interopérabilité (ontologies LanguaL/FoodEx2/FoodOn) est un **chantier émergent**, pas une table livrée.
- L'indexation LanguaL est **incomplète** et de **granularité variable** entre bases ; le matching par catégories harmonisées **perd de l'information** (regroupements larges).

### Stratégie recommandée **[Hypothèse de conception]**
1. **Pivot = USDA (ingrédient + AAE, domaine public)** comme colonne vertébrale (conforme aux décisions prises).
2. **Chaînage impact :** USDA → (mapping) → **code CIQUAL** → **Agribalyse** (jointure CIQUAL↔Agribalyse quasi gratuite). Le seul mapping à construire est **USDA → CIQUAL**.
3. **Construire ce mapping en cascade**, du plus fiable au plus coûteux :
   - (a) **codes LanguaL communs** (présents côté SR Legacy et CIQUAL) — automatique quand disponible ;
   - (b) **nom scientifique / correspondance sémantique** (aliments bruts : « pomme », « lentille »…) ;
   - (c) **mapping manuel validé** pour le **top-N des aliments réellement utilisés** dans nutricalc (approche 80/20 : quelques centaines d'ingrédients couvrent l'essentiel des usages) ;
   - (d) laisser **non mappé** (impact absent, dégradé proprement) le reste.
4. **Recoupement de plausibilité** via OWID (par kg et par 100 g de protéines) pour détecter les mappings aberrants.
5. **Traçabilité obligatoire** : chaque valeur porte sa source, sa version/millésime, son unité, et le **niveau de confiance du mapping** (auto LanguaL / sémantique / manuel).

### Taux de couverture attendu **[Hypothèse, à valider par POC]**
- **CIQUAL ↔ Agribalyse : ~100 %** (même nomenclature).
- **USDA ↔ CIQUAL : couverture élevée sur les aliments bruts courants** (fruits, légumes, viandes, céréales, légumineuses), **faible sur les items spécifiques/composés** (les ~2 229 « Autres » d'USDA-FR). Un mapping manuel du top-N est probablement le vrai livrable.
- **Pièges :** unités (par kg Agribalyse vs par 100 g USDA), périmètres (cru vs cuit, avec/sans os, taux de matière sèche), homonymes et « faux amis », versions figées (SR Legacy 2018) vs récentes (CIQUAL 2025, Agribalyse 3.2).

**Sources :** langual.org ; eurofir.org ; doc.agribalyse.fr (nomenclature CIQUAL) ; fdc.nal.usda.gov (LanguaL Factors, noms scientifiques) ; EFSA FoodEx2 ; nutrition.org (interoperability / crosswalks food systems).

---

## 6. Implications pour le CDC

### Faisable (confiance élevée, sourcé)
- **Volet impact via Agribalyse 3.2** : CO₂ (kg CO₂ eq) et eau (m³ depriv.) directement disponibles, **par kg**, en **Licence Ouverte Etalab 2.0**, CSV/XLSX/API. Récupérer aussi le **Score unique EF** et les autres indicateurs « limites planétaires ».
- **Volet AAE via USDA** (domaine public), conforme aux décisions prises. SR Legacy pour la couverture + Foundation Foods pour la qualité.
- **Détail lipidique (oméga-3/6, EPA/DHA/ALA) et micronutriments** : CIQUAL 2025 (Etalab) et/ou BLS 4.0 (gratuit depuis 12/2025).
- **Recoupement de plausibilité** via OWID (CC-BY), notamment l'axe « par 100 g de protéines ».
- **Chaînage impact** USDA → CIQUAL → Agribalyse, la jointure CIQUAL↔Agribalyse étant quasi gratuite.

### Risqué / coûteux (à cadrer)
- **Mapping USDA ↔ CIQUAL** : pas de crosswalk officiel ; effort réel = construction en cascade (LanguaL auto + sémantique + **manuel sur le top-N**). C'est le principal poste de travail du projet DS.
- **Saison / zone géographique généralisée** : non disponible dans les bases ; refaire des LCA est disproportionné. → limiter aux **variantes déjà fournies par Agribalyse** (tomate, fraise, haricot vert…).
- **Fraîcheur des données** : SR Legacy figée en 2018 ; prévoir une stratégie de mise à jour (Foundation Foods, BLS).
- **Hétérogénéité d'unités et de périmètres** entre sources : normalisation indispensable (tout ramener à 100 g de partie comestible côté nutrition ; conserver kg côté impact avec conversion explicite).
- **Licences mélangées** : domaine public (USDA), Etalab (CIQUAL, Agribalyse résultats agrégés), CC-BY (OWID, INFOODS), attribution (Frida), ecoinvent (inventaires détaillés Agribalyse — à **éviter**). → tenir un **registre de licences par champ** et rester sur les résultats agrégés d'Agribalyse.

### Questions ouvertes à trancher (pour le grilling / le CDC)
1. **Périmètre d'aliments** : combien d'ingrédients bruts cible-t-on réellement ? (le mapping manuel du top-N dépend de ce nombre.)
2. **Indicateurs d'impact retenus** : seulement CO₂ + eau, ou le Score unique EF + un sous-ensemble ? Comment les présenter à l'utilisateur (par portion ? par 100 g ? par 100 g de protéines ?) ?
3. **Gestion des « non mappés »** : impact absent affiché comme tel, ou estimé par catégorie (proxy) ? À quel niveau de confiance ?
4. **Fréquence de mise à jour** de la base fusionnée (SR Legacy figée ↔ CIQUAL/Agribalyse évoluent).
5. **Saisonnalité** : enrichissement ciblé sur quelques aliments emblématiques, ou hors périmètre v1 ?
6. **Complément BLS 4.0** : l'intègre-t-on dès la v1 (riche mais nouvelle) ou en itération 2 ?
7. **Format de sortie** attendu par nutricalc (schéma JSON, unités, champs de traçabilité/confiance) — à spécifier précisément dans le CDC.

---

## Annexe — récapitulatif des sources retenues

| Source | Version | Rôle | Indicateurs / champs clés | Unités | Licence | Format |
|---|---|---|---|---|---|---|
| **USDA FoodData Central** (SR Legacy + Foundation) | SR Legacy 2018 (figée) ; Foundation 12/2025 | **Base majeure — AAE + macros + lipides** | 9 AAE, macros, AG individuels, micronutriments | /100 g | **Domaine public** | CSV, API |
| **Agribalyse (ADEME)** | **3.2 (nov. 2024)** | **Base impact environnemental** | 16 indicateurs PEF + Score EF (dont CO₂, eau) | **/kg** ; CO₂ en kg CO₂ eq ; eau en m³ depriv. | **Etalab 2.0** (résultats agrégés) | CSV, XLSX, API |
| **CIQUAL (Anses)** | **2025** | Compo FR : lipides fins + micronutriments ; **clé de jointure vers Agribalyse** | 74 constituants, AG (ALA/EPA/DHA), vitamines, minéraux ; **pas d'AA** | /100 g | **Etalab** | CSV/XLSX |
| **OWID / Poore & Nemecek** | 2018 (+ erratum 2019) | **Recoupement de plausibilité** | GES, terres, eau, eutrophisation, acidification | par kg / 100 g protéines / 1000 kcal | **CC-BY** | CSV, API |
| **BLS 4.0** (Max Rubner-Institut) | 4.0 (gratuit dès 16/12/2025) | Complément AAE + micronutriments | 138 nutriments dont AA et AG | /100 g | Gratuit, sans licence | base dédiée |
| **FAO/INFOODS** (uPulses, uFiSh) | 2016-2017 | Complément ciblé AAE (légumineuses, produits de la mer) | AA + AG | /100 g | CC-BY (selon produit) | tableurs |

*Fin du document — base factuelle pour le CDC T21.*
