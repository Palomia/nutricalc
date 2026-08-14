# Base d'aliments — USDA SR Legacy (avec acides aminés)

Base d'aliments plus complète que la table CIQUAL utilisée jusqu'ici dans
`src/calc/food.ts`, choisie parce qu'elle porte le **profil complet des acides
aminés par aliment** — ce que CIQUAL ne publie pas et dont le moteur décrit dans
`temp.txt` a besoin (couverture AAE, acide aminé limitant, leucine par repas).

## Source

- **Jeu** : USDA FoodData Central — *SR Legacy* (millésime avril 2018).
- **Page** : <https://fdc.nal.usda.gov/download-datasets>
- **Licence** : domaine public (œuvre du gouvernement des États-Unis).
- **Limite connue** : les noms d'aliments sont en anglais. La version
  traduite et app-ready est `foods.fr.json` (cf. plus bas).

Pourquoi SR Legacy plutôt que *Foundation Foods* : SR Legacy couvre 7 793
aliments (contre ~340 pour Foundation Foods), avec profil d'acides aminés sur
la majorité des sources protéiques.

## Fichier généré : `foods.sr_legacy.json`

Une entrée par aliment, **valeurs pour 100 g de partie comestible**. Un champ
nutritionnel est **absent** quand l'USDA ne fournit aucune valeur (absence ≠ 0).

| Champ | Unité | Description |
|---|---|---|
| `fdc_id` | — | Identifiant FoodData Central |
| `name` | — | Libellé (anglais) |
| `category` | — | Catégorie USDA |
| `kcal` | kcal | Énergie |
| `protein_g` | g | Protéines |
| `fat_g` | g | Lipides totaux |
| `carb_g` | g | Glucides (par différence) |
| `fiber_g` | g | Fibres totales |
| `sugars_g` | g | Sucres totaux (NLEA) |
| `histidine_g` … `valine_g` | g | 9 acides aminés essentiels + histidine, cystine, tyrosine |

Acides aminés inclus : histidine, isoleucine, leucine, lysine, méthionine,
cystine, phénylalanine, tyrosine, thréonine, tryptophane, valine. La méthionine
et la cystine (AA soufrés), ainsi que la phénylalanine et la tyrosine
(aromatiques), sont conservées séparément — libre au moteur de les additionner
selon les besoins (cf. `temp.txt` §5).

Chiffres du dernier build : **7 793 aliments, dont 5 101 avec profil
d'acides aminés**, ~3 Mo.

## Régénérer

```sh
python3 data/build_food_db.py          # télécharge SR Legacy si absent, puis génère
python3 data/build_food_db.py --src <dossier_csv>   # à partir de CSV déjà extraits
```

Le dump brut (~54 Mo décompressé) est mis en cache dans `data/.cache/`, exclu du
dépôt via `.gitignore`. Seul `foods.sr_legacy.json` est versionné.

---

## Fichier app-ready : `foods.fr.json`

Version **traduite en français et prétraitée pour l'app** de la base ci-dessus.
Produite par `build_food_db_fr.py` à partir de `foods.sr_legacy.json`. C'est un
**calcul « one-shot »** (la traduction EN→FR est coûteuse et déterministe) : on
génère et on **versionne** le résultat.

### Schéma (une entrée par aliment, valeurs pour 100 g)

| Champ | Type | Description |
|---|---|---|
| `id` | str | Identifiant stable `usda-<fdc_id>` |
| `fdc_id` | int | Identifiant FoodData Central (traçabilité) |
| `name` | str | Libellé **français** (ou EN en repli, voir drapeaux) |
| `name_en` | str | Libellé anglais d'origine (traçabilité) |
| `category` | str | Catégorie FR de l'app (5 catégories + « Autres ») |
| `category_usda` | str | Catégorie USDA d'origine (traçabilité) |
| `kcalPer100g` | number | Énergie (recalcul 4/9/4 en repli, voir drapeaux) |
| `proteinPer100g` | number | Protéines (g) |
| `lipidPer100g` | number | Lipides (g) |
| `carbPer100g` | number | Glucides (g) |
| `aaProfile` | object? | **Optionnel** : profil d'AAE en **mg / g de protéine**, 9 clés `histidine, isoleucine, leucine, lysine, sulfur, aromatic, threonine, tryptophan, valine` (`sulfur = Met+Cys`, `aromatic = Phe+Tyr`). Absent si les 11 acides aminés ne sont pas tous fournis ou si protéines nulles. |
| `vegetarian` | bool | Régime : sans chair animale (œufs/laitages permis) |
| `vegan` | bool | Régime : aucun produit animal |
| `unprocessed` | bool | Non transformé (best-effort, cf. limites) |
| `flags` | string[]? | **Optionnel** : signalements (voir ci-dessous) |

Les champs `aaProfile` et `flags` ne sont émis que lorsqu'ils s'appliquent.

**Drapeaux (`flags`)** : `name_fallback_en` (traduction échouée, nom EN
conservé), `kcal_recomputed` (énergie recalculée 4/9/4 car absente),
`macro_missing` (au moins une macro absente, mise à 0), `diet_uncertain`
(régime déduit d'une catégorie hétérogène, valeur « au mieux »).

### Méthode de traduction

Bibliothèque **`deep-translator`** (`GoogleTranslator`, moteur Google Translate).
Les libellés sont envoyés **par lots** (un aliment par ligne, jointure par saut
de ligne) : Google conserve le découpage, donc un appel traduit plusieurs
dizaines de libellés. Cache disque `data/.cache/fr_name_cache.json` (EN→FR) pour
ne rien retraduire au run suivant et permettre la reprise. En cas d'échec d'un
lot, repli ligne par ligne ; en cas d'échec d'une ligne, le **nom EN est
conservé** et signalé par `name_fallback_en` (le build ne s'arrête jamais).

### Correspondance des catégories (USDA → FR)

| Catégorie USDA | Catégorie FR |
|---|---|
| Beef / Pork / Poultry / Lamb, Veal & Game / Sausages & Luncheon Meats / Finfish & Shellfish | Viandes, poissons, œufs |
| Dairy and Egg Products | Produits laitiers *(les œufs USDA sont rangés ici)* |
| Fruits and Fruit Juices / Vegetables and Vegetable Products | Fruits & légumes |
| Legumes / Cereal Grains and Pasta / Baked Products / Breakfast Cereals | Féculents & pains |
| Fats and Oils / Nut and Seed Products | Matières grasses & oléagineux |
| Beverages / Sweets / Baby Foods / Fast Foods / Soups, Sauces & Gravies / Snacks / American Indian / Restaurant Foods / Meals, Entrees & Side Dishes / Spices and Herbs | Autres |

« Autres » est un repli hors des 5 catégories de l'app (plats composés,
boissons, sauces…). Les 5 catégories de l'app sont conservées telles quelles.

### Régime alimentaire (heuristique)

Déduit **de la catégorie USDA** (pas du nom, trop bruité : « peanut butter »,
« coconut milk », « eggplant »…). Catégories de chair animale ⇒ non végétarien /
non vegan ; laitages & œufs ⇒ végétarien non vegan ; catégories végétales ⇒
végétarien + vegan. Les catégories hétérogènes reçoivent une valeur « au mieux »
et le drapeau `diet_uncertain`.

### Limites

- **Qualité de la traduction** : Google Translate sur des libellés techniques /
  abrégés (« Beef, chuck, arm pot roast, boneless, separable lean only… »)
  produit un français correct mais parfois maladroit ou littéral ; à revoir pour
  les libellés les plus utilisés. Le nom EN est conservé (`name_en`).
- **Régime** : heuristique par catégorie, donc grossière pour les catégories
  composites (`diet_uncertain`). Ne détecte pas les ingrédients d'origine
  animale masqués (gélatine, présure, saindoux…).
- **`unprocessed`** : souvent inconnu. Best-effort = `true` uniquement pour un
  aliment brut (libellé « raw ») d'une catégorie d'aliments entiers ; `false`
  partout ailleurs (approximation prudente, pas une classification NOVA réelle).

### Régénérer

```sh
pip install deep-translator
python3 data/build_food_db_fr.py            # traduit (réseau) puis génère
python3 data/build_food_db_fr.py --offline  # cache seul, sans réseau
python3 data/build_food_db_fr.py --limit 50 # test rapide (50 aliments)
```

Le cache de traduction `data/.cache/fr_name_cache.json` est exclu du dépôt
(`.gitignore`). Seul `foods.fr.json` est versionné.

Chiffres du dernier build : **7 793 aliments, 7 793 noms traduits (0 repli
EN), 4 760 avec profil d'AAE complet**, ~4,5 Mo. (Le profil AAE exige les 11
acides aminés : d'où 4 760 ici contre 5 101 aliments ayant *au moins un* acide
aminé dans `foods.sr_legacy.json`.) Répartition par catégorie FR : Viandes,
poissons, œufs 2 568 ; Autres 2 229 ; Féculents & pains 1 183 ; Fruits &
légumes 1 169 ; Matières grasses & oléagineux 353 ; Produits laitiers 291.
Aliments avec régime incertain (`diet_uncertain`) : 4 089.
