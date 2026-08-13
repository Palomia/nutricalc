"""Macronutriments et leurs découpages.

Références ANSES pour l'adulte :
  - Protéines : RNP 0,83 g/kg/j, découpées en acides aminés indispensables.
  - Lipides   : 35-40 % de l'AET, découpés en familles d'acides gras.
  - Glucides  : 40-55 % de l'AET (complément), découpés en fibres et sucres.

Découpages :
  - Acides aminés indispensables : besoins moyens FAO/OMS/UNU 2007 (mg/kg/j,
    adulte, identiques hommes/femmes). Ce sont des besoins moyens, pas des RNP.
  - Acides gras : références AFSSA/ANSES (avis 2006-SA-0359, 2010), en % de
    l'AET ou en valeur absolue (EPA, DHA).
  - Glucides : fibres (AS ANSES 2016), sucres hors lactose/galactose (limite
    ANSES 2016), sucres libres/ajoutés (objectif OMS 2015).

AS = apport satisfaisant ; « limite » = valeur maximale de santé publique
(pas une limite toxicologique) ; « OMS » = objectif de santé publique OMS.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from .profile import Profile

PROTEIN_G_PER_KG = 0.83
LIPID_FRACTION_AET = 0.375  # milieu de la fourchette ANSES 35-40 %

KCAL_PER_G = {"protein": 4.0, "lipid": 9.0, "carb": 4.0}


@dataclass(frozen=True)
class MacroTarget:
    grams: float
    kcal: float
    percent_aet: float  # part de l'apport énergétique total, entre 0 et 1


@dataclass(frozen=True)
class AminoAcid:
    name: str
    mg_per_kg: float  # besoin moyen FAO/OMS (mg/kg de poids corporel/j)
    mg: float  # besoin journalier = mg_per_kg × poids


@dataclass(frozen=True)
class FattyAcidTarget:
    name: str
    family: str  # "Saturés" | "Mono-insaturés" | "Poly-insaturés ω-6" | "Poly-insaturés ω-3"
    kind: str  # "AS" | "limite"
    percent_aet: Optional[float]  # borne (limite) ou point/borne basse (AS), en %
    percent_aet_max: Optional[float]  # borne haute si intervalle, en %
    grams: Optional[float]  # équivalent en g/j (dérivé de percent_aet et de l'énergie)
    grams_max: Optional[float]
    milligrams: Optional[float]  # valeurs absolues (EPA, DHA)
    note: str = ""


@dataclass(frozen=True)
class CarbComponent:
    name: str
    kind: str  # "AS" | "limite" | "OMS"
    grams: Optional[float]  # cible/limite en g/j (fixe, ou dérivée du % d'AET)
    percent_aet: Optional[float]  # part de l'AET en %, si applicable
    note: str = ""


@dataclass(frozen=True)
class MacroTargets:
    protein: MacroTarget
    lipid: MacroTarget
    carb: MacroTarget
    amino_acids: list[AminoAcid]  # découpage des protéines
    fatty_acids: list[FattyAcidTarget]  # découpage des lipides
    carb_components: list[CarbComponent]  # découpage des glucides


# Besoins moyens en acides aminés indispensables, adulte (>18 ans).
# FAO/WHO/UNU 2007 — FAO Food and Nutrition Paper 92, table 3. mg/kg/j.
_AMINO_ACIDS_MG_PER_KG: list[tuple[str, float]] = [
    ("Histidine", 10.0),
    ("Isoleucine", 20.0),
    ("Leucine", 39.0),
    ("Lysine", 30.0),
    ("Acides aminés soufrés (Met + Cys)", 15.0),
    ("Acides aminés aromatiques (Phe + Tyr)", 25.0),
    ("Thréonine", 15.0),
    ("Tryptophane", 4.0),
    ("Valine", 26.0),
]

# Références acides gras, adulte (AFSSA/ANSES 2006-SA-0359).
# (nom, famille, type, % AET, % AET max, mg/j absolu, note)
_FATTY_ACIDS: list[tuple[str, str, str, Optional[float], Optional[float], Optional[float], str]] = [
    ("Acides gras saturés", "Saturés", "limite", 12.0, None, None, "valeur maximale"),
    ("dont laurique + myristique + palmitique", "Saturés", "limite", 8.0, None, None, "athérogènes en excès"),
    ("Acide oléique (AGMI, ω-9)", "Mono-insaturés", "AS", 15.0, 20.0, None, ""),
    ("Acide linoléique (ω-6)", "Poly-insaturés ω-6", "AS", 4.0, None, None, ""),
    ("Acide α-linolénique (ALA, ω-3)", "Poly-insaturés ω-3", "AS", 1.0, None, None, ""),
    ("EPA", "Poly-insaturés ω-3", "AS", None, None, 250.0, "EPA + DHA : 500 mg/j"),
    ("DHA", "Poly-insaturés ω-3", "AS", None, None, 250.0, "EPA + DHA : 500 mg/j"),
]

# Découpage des glucides, adulte.
# (nom, type, g/j fixe, % AET, note)
_CARB_COMPONENTS: list[tuple[str, str, Optional[float], Optional[float], str]] = [
    ("Fibres", "AS", 30.0, None, "ANSES 2016"),
    ("Sucres (hors lactose et galactose)", "limite", 100.0, None, "valeur maximale (ANSES)"),
    ("Sucres libres / ajoutés", "OMS", None, 10.0, "< 5 % AET idéalement (OMS)"),
]


def amino_acid_targets(profile: Profile) -> list[AminoAcid]:
    """Besoins en acides aminés indispensables (mg/j) selon le poids."""
    return [
        AminoAcid(name=name, mg_per_kg=mg_per_kg, mg=mg_per_kg * profile.weight_kg)
        for (name, mg_per_kg) in _AMINO_ACIDS_MG_PER_KG
    ]


def fatty_acid_targets(energy_kcal: float) -> list[FattyAcidTarget]:
    """Références en acides gras ; les valeurs en % AET sont converties en g/j."""
    out: list[FattyAcidTarget] = []
    for name, family, kind, pct, pct_max, mg, note in _FATTY_ACIDS:
        grams = pct / 100 * energy_kcal / KCAL_PER_G["lipid"] if pct is not None else None
        grams_max = (
            pct_max / 100 * energy_kcal / KCAL_PER_G["lipid"] if pct_max is not None else None
        )
        out.append(
            FattyAcidTarget(
                name=name,
                family=family,
                kind=kind,
                percent_aet=pct,
                percent_aet_max=pct_max,
                grams=grams,
                grams_max=grams_max,
                milligrams=mg,
                note=note,
            )
        )
    return out


def carb_components(energy_kcal: float) -> list[CarbComponent]:
    """Découpage des glucides ; les valeurs en % AET sont converties en g/j."""
    out: list[CarbComponent] = []
    for name, kind, grams_fixed, pct, note in _CARB_COMPONENTS:
        grams = grams_fixed
        if grams is None and pct is not None:
            grams = pct / 100 * energy_kcal / KCAL_PER_G["carb"]
        out.append(CarbComponent(name=name, kind=kind, grams=grams, percent_aet=pct, note=note))
    return out


def macro_targets(profile: Profile, energy_kcal: float) -> MacroTargets:
    """Répartit l'apport énergétique en protéines, lipides et glucides, avec
    le découpage des protéines (acides aminés), des lipides (acides gras) et
    des glucides (fibres, sucres)."""
    if energy_kcal <= 0:
        raise ValueError("L'apport énergétique doit être strictement positif.")

    protein_g = PROTEIN_G_PER_KG * profile.weight_kg
    protein_kcal = protein_g * KCAL_PER_G["protein"]

    lipid_kcal = LIPID_FRACTION_AET * energy_kcal
    lipid_g = lipid_kcal / KCAL_PER_G["lipid"]

    # Les glucides absorbent le reste de l'énergie ; borné à 0 aux cas extrêmes.
    carb_kcal = max(energy_kcal - protein_kcal - lipid_kcal, 0.0)
    carb_g = carb_kcal / KCAL_PER_G["carb"]

    return MacroTargets(
        protein=MacroTarget(protein_g, protein_kcal, protein_kcal / energy_kcal),
        lipid=MacroTarget(lipid_g, lipid_kcal, lipid_kcal / energy_kcal),
        carb=MacroTarget(carb_g, carb_kcal, carb_kcal / energy_kcal),
        amino_acids=amino_acid_targets(profile),
        fatty_acids=fatty_acid_targets(energy_kcal),
        carb_components=carb_components(energy_kcal),
    )
