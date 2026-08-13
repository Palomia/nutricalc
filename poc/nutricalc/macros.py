"""Macronutriments.

Références ANSES pour l'adulte :
  - Protéines : RNP 0,83 g/kg de poids corporel et par jour.
  - Lipides   : 35-40 % de l'apport énergétique total (AET) — on vise 37,5 %.
  - Glucides  : 40-55 % de l'AET — ici le complément de l'énergie restante.
"""

from __future__ import annotations

from dataclasses import dataclass

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
class MacroTargets:
    protein: MacroTarget
    lipid: MacroTarget
    carb: MacroTarget


def macro_targets(profile: Profile, energy_kcal: float) -> MacroTargets:
    """Répartit l'apport énergétique en protéines, lipides et glucides."""
    if energy_kcal <= 0:
        raise ValueError("L'apport énergétique doit être strictement positif.")

    protein_g = PROTEIN_G_PER_KG * profile.weight_kg
    protein_kcal = protein_g * KCAL_PER_G["protein"]

    lipid_kcal = LIPID_FRACTION_AET * energy_kcal
    lipid_g = lipid_kcal / KCAL_PER_G["lipid"]

    # Les glucides absorbent le reste de l'énergie ; borné à 0 pour les cas
    # extrêmes où protéines + lipides dépasseraient l'AET.
    carb_kcal = max(energy_kcal - protein_kcal - lipid_kcal, 0.0)
    carb_g = carb_kcal / KCAL_PER_G["carb"]

    return MacroTargets(
        protein=MacroTarget(protein_g, protein_kcal, protein_kcal / energy_kcal),
        lipid=MacroTarget(lipid_g, lipid_kcal, lipid_kcal / energy_kcal),
        carb=MacroTarget(carb_g, carb_kcal, carb_kcal / energy_kcal),
    )
