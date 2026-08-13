# Base d'aliments — USDA SR Legacy (avec acides aminés)

Base d'aliments plus complète que la table CIQUAL utilisée jusqu'ici dans
`src/calc/food.ts`, choisie parce qu'elle porte le **profil complet des acides
aminés par aliment** — ce que CIQUAL ne publie pas et dont le moteur décrit dans
`temp.txt` a besoin (couverture AAE, acide aminé limitant, leucine par repas).

## Source

- **Jeu** : USDA FoodData Central — *SR Legacy* (millésime avril 2018).
- **Page** : <https://fdc.nal.usda.gov/download-datasets>
- **Licence** : domaine public (œuvre du gouvernement des États-Unis).
- **Limite connue** : les noms d'aliments sont en anglais. Une correspondance
  vers des libellés français (p. ex. via CIQUAL) reste à faire.

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
