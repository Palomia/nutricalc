#!/usr/bin/env python3
"""Construit une base d'aliments curée à partir du jeu USDA SR Legacy.

Source : USDA FoodData Central, jeu « SR Legacy » (avril 2018).
  https://fdc.nal.usda.gov/download-datasets
Domaine public (œuvre du gouvernement des États-Unis).

Pourquoi cette source plutôt que CIQUAL (ANSES) : CIQUAL ne publie pas le
détail des acides aminés par aliment, alors que SR Legacy fournit le profil
complet des 9 acides aminés essentiels (+ histidine, cystine, tyrosine) par
100 g, en plus des macros/fibres/sucres. C'est indispensable pour le moteur
décrit dans temp.txt (couverture AAE, acide aminé limitant, leucine par repas).

Seule limite : les noms d'aliments sont en anglais.

Le script :
  1. télécharge et décompresse SR Legacy dans data/.cache/ (ignoré par git)
     s'il n'est pas déjà présent ;
  2. lit les CSV relationnels (stdlib uniquement, aucune dépendance) ;
  3. écrit data/foods.sr_legacy.json : une entrée par aliment, valeurs pour
     100 g de partie comestible.

Usage :
  python3 data/build_food_db.py                 # télécharge si besoin
  python3 data/build_food_db.py --src <dossier>  # CSV déjà extraits ailleurs
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
import urllib.request
import zipfile
from pathlib import Path

# Le CSV food_nutrient.csv fait ~36 Mo : certaines lignes dépassent la limite
# par défaut du module csv.
csv.field_size_limit(10 * 1024 * 1024)

DATA_DIR = Path(__file__).resolve().parent
CACHE_DIR = DATA_DIR / ".cache"
OUTPUT = DATA_DIR / "foods.sr_legacy.json"

ZIP_URL = (
    "https://fdc.nal.usda.gov/fdc-datasets/"
    "FoodData_Central_sr_legacy_food_csv_2018-04.zip"
)
CSV_SUBDIR = "FoodData_Central_sr_legacy_food_csv_2018-04"

# nutrient_id USDA -> clé de sortie. Toutes les valeurs sont pour 100 g.
NUTRIENTS: dict[str, str] = {
    "1008": "kcal",          # Energy (kcal)
    "1003": "protein_g",     # Protein
    "1004": "fat_g",         # Total lipid (fat)
    "1005": "carb_g",        # Carbohydrate, by difference
    "1079": "fiber_g",       # Fiber, total dietary
    "1063": "sugars_g",      # Sugars, Total NLEA
    # Acides aminés essentiels (g / 100 g)
    "1221": "histidine_g",
    "1212": "isoleucine_g",
    "1213": "leucine_g",
    "1214": "lysine_g",
    "1215": "methionine_g",
    "1216": "cystine_g",
    "1217": "phenylalanine_g",
    "1218": "tyrosine_g",
    "1211": "threonine_g",
    "1210": "tryptophan_g",
    "1219": "valine_g",
}

AMINO_ACID_KEYS = {
    "histidine_g", "isoleucine_g", "leucine_g", "lysine_g", "methionine_g",
    "cystine_g", "phenylalanine_g", "tyrosine_g", "threonine_g",
    "tryptophan_g", "valine_g",
}


def ensure_data(src: Path | None) -> Path:
    """Retourne le dossier contenant les CSV SR Legacy, en téléchargeant si besoin."""
    if src is not None:
        if not (src / "food_nutrient.csv").exists():
            sys.exit(f"CSV SR Legacy introuvables dans {src}")
        return src

    csv_dir = CACHE_DIR / CSV_SUBDIR
    if (csv_dir / "food_nutrient.csv").exists():
        return csv_dir

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = CACHE_DIR / "sr_legacy.zip"
    if not zip_path.exists():
        print(f"Téléchargement de {ZIP_URL} …", file=sys.stderr)
        urllib.request.urlretrieve(ZIP_URL, zip_path)  # noqa: S310 (URL fixe, HTTPS)
    print("Décompression …", file=sys.stderr)
    with zipfile.ZipFile(zip_path) as zf:
        zf.extractall(CACHE_DIR)
    return csv_dir


def load_categories(csv_dir: Path) -> dict[str, str]:
    with (csv_dir / "food_category.csv").open(newline="", encoding="utf-8") as f:
        return {row["id"]: row["description"] for row in csv.DictReader(f)}


def load_foods(csv_dir: Path, categories: dict[str, str]) -> dict[str, dict]:
    foods: dict[str, dict] = {}
    with (csv_dir / "food.csv").open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            fdc_id = row["fdc_id"]
            foods[fdc_id] = {
                "fdc_id": int(fdc_id),
                "name": row["description"],
                "category": categories.get(row["food_category_id"], ""),
            }
    return foods


def attach_nutrients(csv_dir: Path, foods: dict[str, dict]) -> None:
    with (csv_dir / "food_nutrient.csv").open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            key = NUTRIENTS.get(row["nutrient_id"])
            if key is None:
                continue
            food = foods.get(row["fdc_id"])
            if food is None:
                continue
            amount = row["amount"].strip()
            if amount == "":
                continue
            food[key] = round(float(amount), 4)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--src", type=Path, default=None,
        help="Dossier de CSV SR Legacy déjà extraits (sinon téléchargement).",
    )
    args = parser.parse_args()

    csv_dir = ensure_data(args.src)
    print("Lecture des aliments et catégories …", file=sys.stderr)
    categories = load_categories(csv_dir)
    foods = load_foods(csv_dir, categories)
    print(f"{len(foods)} aliments. Lecture des nutriments (~36 Mo) …", file=sys.stderr)
    attach_nutrients(csv_dir, foods)

    records = sorted(foods.values(), key=lambda x: x["name"].lower())
    with_aa = sum(1 for r in records if AMINO_ACID_KEYS & r.keys())

    payload = {
        "source": "USDA FoodData Central — SR Legacy (2018-04)",
        "source_url": "https://fdc.nal.usda.gov/download-datasets",
        "license": "Public domain (U.S. government work)",
        "basis": "Valeurs pour 100 g de partie comestible.",
        "food_count": len(records),
        "food_count_with_amino_acids": with_aa,
        "foods": records,
    }
    OUTPUT.write_text(
        json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8",
    )
    size_mb = OUTPUT.stat().st_size / 1024 / 1024
    print(
        f"Écrit {OUTPUT.name} : {len(records)} aliments "
        f"({with_aa} avec profil d'acides aminés), {size_mb:.1f} Mo.",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
