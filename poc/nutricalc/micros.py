"""Micronutriments : vitamines et minéraux.

Valeurs INDICATIVES tirées des références nutritionnelles ANSES pour l'adulte
(actualisation 2016-2021) :

  - RNP = Référence Nutritionnelle pour la Population (couvre 97,5 % du groupe).
  - AS  = Apport Satisfaisant (utilisé quand la RNP ne peut être établie).

Certaines valeurs dépendent de facteurs non modélisés ici (pertes menstruelles,
teneur en phytates du régime pour le zinc, âge). Elles sont arrondies et
doivent être revalidées contre le tableau officiel ANSES avant tout usage
réel — voir DESIGN.md, section « Sources et fiabilité ».
"""

from __future__ import annotations

from dataclasses import dataclass

from .profile import Profile, Sex


@dataclass(frozen=True)
class MicroReference:
    name: str
    unit: str
    amount: float
    kind: str  # "RNP" ou "AS"
    note: str = ""


# Table (valeur homme, valeur femme) pour un adulte 18-64 ans.
# fmt: off
_TABLE: list[tuple[str, str, float, float, str, str]] = [
    # nom,                  unité,   homme,  femme,  type,  note
    ("Vitamine C",          "mg",    110.0,  110.0,  "RNP", ""),
    ("Vitamine D",          "µg",     15.0,   15.0,  "RNP", "en l'absence d'exposition solaire suffisante"),
    ("Vitamine A",          "µg ER",  750.0,  650.0, "RNP", ""),
    ("Vitamine E",          "mg",     10.5,    9.9,  "AS",  ""),
    ("Vitamine B1",         "mg",      1.3,    1.1,  "RNP", "thiamine, proportionnelle à l'apport énergétique"),
    ("Vitamine B2",         "mg",      1.6,    1.5,  "RNP", "riboflavine"),
    ("Vitamine B3",         "mg EN",  14.0,   11.0,  "RNP", "niacine"),
    ("Vitamine B6",         "mg",      1.7,    1.6,  "RNP", ""),
    ("Vitamine B9",         "µg",    330.0,  330.0,  "RNP", "folates"),
    ("Vitamine B12",        "µg",      4.0,    4.0,  "AS",  ""),
    ("Calcium",             "mg",    950.0,  950.0,  "RNP", ""),
    ("Fer",                 "mg",     11.0,   16.0,  "RNP", "femme : pertes menstruelles élevées ; sinon 11 mg"),
    ("Magnésium",           "mg",    380.0,  300.0,  "AS",  ""),
    ("Zinc",                "mg",     11.0,    8.0,  "RNP", "varie avec la teneur en phytates du régime"),
    ("Iode",                "µg",    150.0,  150.0,  "RNP", ""),
    ("Sélénium",            "µg",     70.0,   70.0,  "RNP", ""),
    ("Potassium",           "mg",   3500.0, 3500.0,  "AS",  ""),
    ("Phosphore",           "mg",    700.0,  700.0,  "RNP", ""),
]
# fmt: on


def micronutrient_references(profile: Profile) -> list[MicroReference]:
    """Références en vitamines et minéraux adaptées au sexe du profil."""
    is_male = profile.sex is Sex.MALE
    return [
        MicroReference(
            name=name,
            unit=unit,
            amount=men if is_male else women,
            kind=kind,
            note=note,
        )
        for (name, unit, men, women, kind, note) in _TABLE
    ]
