#!/usr/bin/env python3
"""Construit la base d'aliments app-ready FRANÇAISE à partir de SR Legacy.

Entrée  : data/foods.sr_legacy.json (généré par build_food_db.py, noms EN).
Sortie  : data/foods.fr.json — une entrée par aliment, prête pour l'app :
          noms traduits en français, macros normalisées, profil d'acides aminés
          essentiels précalculé (mg / g de protéine), catégorie FR et attributs
          de régime (végétarien / vegan / non transformé).

Ce script est un CALCUL « ONE-SHOT » (build) : la traduction EN→FR est coûteuse
et déterministe, on la fait une fois et on versionne le résultat.

--- Méthode de traduction ---------------------------------------------------
Bibliothèque : deep-translator (GoogleTranslator), moteur Google Translate.
  pip install deep-translator        # requis pour (re)traduire

Efficacité : les noms sont envoyés par lots joints par des sauts de ligne
(un aliment par ligne). Google conserve le découpage en lignes, donc un seul
appel traduit plusieurs dizaines de libellés. Les lots sont bornés en nombre
de caractères pour rester sous la limite de l'API gratuite.

Robustesse :
  * Cache disque data/.cache/fr_name_cache.json (EN -> FR). Un second run ne
    retraduit rien : reprise possible après interruption.
  * Repli en cascade : si un lot ne se redécoupe pas correctement, on retraduit
    ligne par ligne ; si une ligne échoue (réseau, quota…), on GARDE le nom EN
    et on pose le drapeau "name_fallback_en". Le build ne s'arrête jamais sur
    quelques échecs.
  * --offline : n'utilise que le cache (aucun appel réseau) ; les noms non
    encore traduits retombent sur l'EN avec le drapeau de repli.

--- Usage -------------------------------------------------------------------
  python3 data/build_food_db_fr.py                 # traduit (réseau) + génère
  python3 data/build_food_db_fr.py --offline       # cache seul, pas de réseau
  python3 data/build_food_db_fr.py --limit 200     # test rapide (200 aliments)
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent
CACHE_DIR = DATA_DIR / ".cache"
SRC = DATA_DIR / "foods.sr_legacy.json"
OUTPUT = DATA_DIR / "foods.fr.json"
NAME_CACHE = CACHE_DIR / "fr_name_cache.json"

# Bornes de lot pour l'API Google gratuite (limite ~5000 caractères / appel).
BATCH_MAX_CHARS = 3500
BATCH_MAX_LINES = 40
SLEEP_BETWEEN_BATCHES = 0.2  # s, courtoisie / anti-rate-limit
MAX_RETRIES = 3

# --- Correspondance catégorie USDA -> catégorie FR de l'app ------------------
# 5 catégories cibles de l'app + repli « Autres » pour les catégories composites
# (plats, boissons, sauces…) qui ne se rangent pas proprement dans les 5.
# Choix documentés dans data/README.md.
CATEGORY_MAP: dict[str, str] = {
    # Viandes, poissons, œufs (chair animale)
    "Beef Products": "Viandes, poissons, œufs",
    "Lamb, Veal, and Game Products": "Viandes, poissons, œufs",
    "Poultry Products": "Viandes, poissons, œufs",
    "Pork Products": "Viandes, poissons, œufs",
    "Sausages and Luncheon Meats": "Viandes, poissons, œufs",
    "Finfish and Shellfish Products": "Viandes, poissons, œufs",
    # Produits laitiers (œufs USDA rangés ici avec les laitages : catégorie mixte)
    "Dairy and Egg Products": "Produits laitiers",
    # Fruits & légumes
    "Fruits and Fruit Juices": "Fruits & légumes",
    "Vegetables and Vegetable Products": "Fruits & légumes",
    # Féculents & pains (céréales, légumineuses, produits de boulangerie)
    "Legumes and Legume Products": "Féculents & pains",
    "Cereal Grains and Pasta": "Féculents & pains",
    "Baked Products": "Féculents & pains",
    "Breakfast Cereals": "Féculents & pains",
    # Matières grasses & oléagineux
    "Fats and Oils": "Matières grasses & oléagineux",
    "Nut and Seed Products": "Matières grasses & oléagineux",
    # Repli « Autres » : catégories hétérogènes / plats composés
    "Beverages": "Autres",
    "Sweets": "Autres",
    "Baby Foods": "Autres",
    "Fast Foods": "Autres",
    "Soups, Sauces, and Gravies": "Autres",
    "Snacks": "Autres",
    "American Indian/Alaska Native Foods": "Autres",
    "Restaurant Foods": "Autres",
    "Meals, Entrees, and Side Dishes": "Autres",
    "Spices and Herbs": "Autres",
}
CATEGORY_FALLBACK = "Autres"

# --- Régime par catégorie USDA : (vegetarian, vegan, uncertain) --------------
# Heuristique volontairement simple et basée sur la catégorie (pas sur le nom,
# trop bruité : « peanut butter », « coconut milk », « eggplant »…). Pour les
# catégories hétérogènes on retient une valeur « au mieux » + drapeau
# diet_uncertain. Détail et limites dans data/README.md.
DIET_MAP: dict[str, tuple[bool, bool, bool]] = {
    # Chair animale : ni végétarien ni vegan (certain)
    "Beef Products": (False, False, False),
    "Lamb, Veal, and Game Products": (False, False, False),
    "Poultry Products": (False, False, False),
    "Pork Products": (False, False, False),
    "Sausages and Luncheon Meats": (False, False, False),
    "Finfish and Shellfish Products": (False, False, False),
    # Laitages + œufs : végétarien, non vegan (certain)
    "Dairy and Egg Products": (True, False, False),
    # Végétal : végétarien + vegan
    "Fruits and Fruit Juices": (True, True, False),
    "Legumes and Legume Products": (True, True, False),
    "Nut and Seed Products": (True, True, False),
    "Spices and Herbs": (True, True, False),
    # Végétal mais produits potentiellement additivés / œuf dans les pâtes…
    "Vegetables and Vegetable Products": (True, True, True),
    "Cereal Grains and Pasta": (True, True, True),
    "Breakfast Cereals": (True, True, True),
    "Beverages": (True, True, True),
    # Souvent œuf/lait/beurre, parfois saindoux : végétarien au mieux, incertain
    "Baked Products": (True, False, True),
    "Sweets": (True, False, True),
    "Snacks": (True, False, True),
    "Soups, Sauces, and Gravies": (True, False, True),
    "Baby Foods": (True, False, True),
    # Contient souvent lard / huile de poisson : non vegan par prudence, incertain
    "Fats and Oils": (True, False, True),
    # Plats souvent carnés : non végétarien au mieux, incertain
    "Fast Foods": (False, False, True),
    "American Indian/Alaska Native Foods": (False, False, True),
    "Restaurant Foods": (False, False, True),
    "Meals, Entrees, and Side Dishes": (False, False, True),
}
DIET_FALLBACK = (True, False, True)  # inconnu : au mieux végétarien, incertain

# Catégories d'aliments « bruts » où un libellé « raw » signale un aliment non
# transformé (NOVA groupe 1). Ailleurs, unprocessed reste False (best-effort).
WHOLE_FOOD_CATEGORIES = {
    "Beef Products", "Lamb, Veal, and Game Products", "Poultry Products",
    "Pork Products", "Finfish and Shellfish Products", "Dairy and Egg Products",
    "Fruits and Fruit Juices", "Vegetables and Vegetable Products",
    "Legumes and Legume Products", "Nut and Seed Products",
    "Cereal Grains and Pasta", "Spices and Herbs",
}

KCAL_PER_G = {"protein": 4.0, "fat": 9.0, "carb": 4.0}


# ---------------------------------------------------------------------------
# Traduction
# ---------------------------------------------------------------------------
def load_cache() -> dict[str, str]:
    if NAME_CACHE.exists():
        return json.loads(NAME_CACHE.read_text(encoding="utf-8"))
    return {}


def save_cache(cache: dict[str, str]) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    NAME_CACHE.write_text(
        json.dumps(cache, ensure_ascii=False, indent=0) + "\n", encoding="utf-8"
    )


def make_batches(names: list[str]) -> list[list[str]]:
    """Regroupe les noms en lots bornés (caractères + lignes)."""
    batches: list[list[str]] = []
    cur: list[str] = []
    cur_chars = 0
    for n in names:
        n_len = len(n) + 1  # +1 pour le saut de ligne
        if cur and (cur_chars + n_len > BATCH_MAX_CHARS or len(cur) >= BATCH_MAX_LINES):
            batches.append(cur)
            cur, cur_chars = [], 0
        cur.append(n)
        cur_chars += n_len
    if cur:
        batches.append(cur)
    return batches


def translate_one(translator, text: str) -> str | None:
    """Traduit une chaîne avec quelques tentatives ; None si échec définitif."""
    for attempt in range(MAX_RETRIES):
        try:
            out = translator.translate(text)
            if out and out.strip():
                return out.strip()
            return None
        except Exception as exc:  # noqa: BLE001 (on veut ne jamais planter)
            wait = 1.5 * (attempt + 1)
            print(
                f"  ! échec traduction ({type(exc).__name__}), "
                f"nouvelle tentative dans {wait:.0f}s",
                file=sys.stderr,
            )
            time.sleep(wait)
    return None


def translate_batch(translator, names: list[str]) -> dict[str, str]:
    """Traduit un lot ; retombe ligne par ligne si le redécoupage échoue.

    Retourne EN->FR uniquement pour les traductions RÉUSSIES (les échecs sont
    laissés de côté : le nom EN sera conservé et signalé par l'appelant).
    """
    # Défensif : aucun nom ne doit contenir de saut de ligne.
    safe = [n.replace("\n", " ").strip() for n in names]
    joined = "\n".join(safe)
    out = translate_one(translator, joined)
    if out is not None:
        parts = [p.strip() for p in out.split("\n")]
        if len(parts) == len(names):
            return {en: fr for en, fr in zip(names, parts) if fr}
    # Repli : ligne par ligne.
    result: dict[str, str] = {}
    for en, safe_en in zip(names, safe):
        fr = translate_one(translator, safe_en)
        if fr:
            result[en] = fr
    return result


def translate_names(names: list[str], offline: bool) -> tuple[dict[str, str], set[str]]:
    """Retourne (cache EN->FR à jour, ensemble des noms retombés sur l'EN)."""
    cache = load_cache()
    # Noms uniques encore à traduire (les libellés SR Legacy sont tous distincts,
    # mais on déduplique par prudence).
    missing = [n for n in dict.fromkeys(names) if n not in cache]
    fallback: set[str] = set()

    if not missing:
        print("Toutes les traductions sont déjà en cache.", file=sys.stderr)
        return cache, fallback

    if offline:
        print(
            f"[offline] {len(missing)} noms sans traduction : repli sur l'EN.",
            file=sys.stderr,
        )
        return cache, set(missing)

    try:
        from deep_translator import GoogleTranslator
    except ImportError:
        print(
            "deep-translator absent (pip install deep-translator). "
            "Repli sur l'EN pour tous les noms non cachés.",
            file=sys.stderr,
        )
        return cache, set(missing)

    translator = GoogleTranslator(source="en", target="fr")
    batches = make_batches(missing)
    print(
        f"Traduction de {len(missing)} noms en {len(batches)} lots …",
        file=sys.stderr,
    )
    done = 0
    for i, batch in enumerate(batches, 1):
        translated = translate_batch(translator, batch)
        cache.update(translated)
        for n in batch:
            if n not in translated:
                fallback.add(n)
        done += len(batch)
        if i % 10 == 0 or i == len(batches):
            print(f"  lot {i}/{len(batches)} ({done}/{len(missing)} noms)", file=sys.stderr)
            save_cache(cache)  # sauvegarde périodique => reprise
        time.sleep(SLEEP_BETWEEN_BATCHES)

    save_cache(cache)
    return cache, fallback


# ---------------------------------------------------------------------------
# Prétraitement app-ready
# ---------------------------------------------------------------------------
AA_REQUIRED = [
    "histidine_g", "isoleucine_g", "leucine_g", "lysine_g", "methionine_g",
    "cystine_g", "phenylalanine_g", "tyrosine_g", "threonine_g",
    "tryptophan_g", "valine_g",
]


def build_aa_profile(food: dict) -> dict[str, float] | None:
    """Profil d'AAE en mg / g de protéine, ou None si données insuffisantes.

    Regroupements de l'app : sulfur = Met + Cys, aromatic = Phe + Tyr.
    """
    protein = food.get("protein_g")
    if not protein or protein <= 0:
        return None
    if any(k not in food for k in AA_REQUIRED):
        return None

    def mg_per_g(*keys: str) -> float:
        total = sum(food[k] for k in keys)
        return round(total / protein * 1000, 1)

    return {
        "histidine": mg_per_g("histidine_g"),
        "isoleucine": mg_per_g("isoleucine_g"),
        "leucine": mg_per_g("leucine_g"),
        "lysine": mg_per_g("lysine_g"),
        "sulfur": mg_per_g("methionine_g", "cystine_g"),
        "aromatic": mg_per_g("phenylalanine_g", "tyrosine_g"),
        "threonine": mg_per_g("threonine_g"),
        "tryptophan": mg_per_g("tryptophan_g"),
        "valine": mg_per_g("valine_g"),
    }


def build_record(food: dict, fr_name: str | None) -> dict:
    flags: list[str] = []

    name_en = food["name"]
    if fr_name is None:
        name = name_en
        flags.append("name_fallback_en")
    else:
        name = fr_name

    protein = food.get("protein_g")
    fat = food.get("fat_g")
    carb = food.get("carb_g")
    if protein is None or fat is None or carb is None:
        flags.append("macro_missing")
    protein = protein or 0.0
    fat = fat or 0.0
    carb = carb or 0.0

    kcal = food.get("kcal")
    if kcal is None:
        kcal = (
            protein * KCAL_PER_G["protein"]
            + fat * KCAL_PER_G["fat"]
            + carb * KCAL_PER_G["carb"]
        )
        flags.append("kcal_recomputed")

    usda_cat = food.get("category", "")
    category = CATEGORY_MAP.get(usda_cat, CATEGORY_FALLBACK)
    vegetarian, vegan, diet_uncertain = DIET_MAP.get(usda_cat, DIET_FALLBACK)
    if diet_uncertain:
        flags.append("diet_uncertain")

    # unprocessed : best-effort. Vrai seulement pour un aliment brut (« raw »)
    # d'une catégorie d'aliments entiers. Souvent inconnu => False par défaut.
    name_tokens = name_en.lower().replace(",", " ").split()
    is_raw = "raw" in name_tokens
    unprocessed = bool(is_raw and usda_cat in WHOLE_FOOD_CATEGORIES)

    record: dict = {
        "id": f"usda-{food['fdc_id']}",
        "fdc_id": food["fdc_id"],
        "name": name,
        "name_en": name_en,
        "category": category,
        "category_usda": usda_cat,
        "kcalPer100g": round(kcal, 1),
        "proteinPer100g": round(protein, 2),
        "lipidPer100g": round(fat, 2),
        "carbPer100g": round(carb, 2),
        "vegetarian": vegetarian,
        "vegan": vegan,
        "unprocessed": unprocessed,
    }
    aa = build_aa_profile(food)
    if aa is not None:
        record["aaProfile"] = aa
    if flags:
        record["flags"] = flags
    return record


# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--src", type=Path, default=SRC,
                        help="JSON source SR Legacy (défaut : data/foods.sr_legacy.json).")
    parser.add_argument("--offline", action="store_true",
                        help="N'utilise que le cache de traduction (aucun réseau).")
    parser.add_argument("--limit", type=int, default=None,
                        help="Ne traite que les N premiers aliments (test).")
    args = parser.parse_args()

    if not args.src.exists():
        sys.exit(f"Source introuvable : {args.src} (lancer d'abord build_food_db.py).")

    payload = json.loads(args.src.read_text(encoding="utf-8"))
    foods = payload["foods"]
    if args.limit is not None:
        foods = foods[: args.limit]

    names = [f["name"] for f in foods]
    cache, fallback = translate_names(names, offline=args.offline)

    records = []
    for f in foods:
        fr = None if f["name"] in fallback else cache.get(f["name"])
        records.append(build_record(f, fr))

    fell_back = sum(1 for r in records if "flags" in r and "name_fallback_en" in r["flags"])
    translated = len(records) - fell_back
    with_aa = sum(1 for r in records if "aaProfile" in r)

    out = {
        "source": "USDA FoodData Central — SR Legacy (2018-04), noms traduits en FR",
        "source_url": "https://fdc.nal.usda.gov/download-datasets",
        "license": "Public domain (U.S. government work)",
        "basis": "Valeurs pour 100 g de partie comestible.",
        "translation": "deep-translator / GoogleTranslator (EN->FR), build one-shot",
        "food_count": len(records),
        "food_count_translated": translated,
        "food_count_name_fallback_en": fell_back,
        "food_count_with_amino_acids": with_aa,
        "categories_fr": [
            "Féculents & pains", "Viandes, poissons, œufs", "Produits laitiers",
            "Fruits & légumes", "Matières grasses & oléagineux", "Autres",
        ],
        "foods": records,
    }
    OUTPUT.write_text(
        json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    size_mb = OUTPUT.stat().st_size / 1024 / 1024
    print(
        f"Écrit {OUTPUT.name} : {len(records)} aliments "
        f"({translated} traduits, {fell_back} repli EN, {with_aa} avec profil AAE), "
        f"{size_mb:.1f} Mo.",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
