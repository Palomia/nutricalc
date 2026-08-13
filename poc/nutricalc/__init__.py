"""nutricalc — proof of concept.

Calcul des apports journaliers recommandés pour un adulte :
énergie (BMR Mifflin-St Jeor + niveau d'activité), macronutriments et
micronutriments (références ANSES).

Aucune donnée personnelle n'est stockée : les entrées d'un profil servent
uniquement au calcul en mémoire, puis sont oubliées.
"""

from .profile import ActivityLevel, Profile, Sex
from .energy import bmr_mifflin_st_jeor, tdee
from .macros import MacroTarget, MacroTargets, macro_targets
from .micros import MicroReference, micronutrient_references
from .report import DailyReport, daily_report

__all__ = [
    "ActivityLevel",
    "Profile",
    "Sex",
    "bmr_mifflin_st_jeor",
    "tdee",
    "MacroTarget",
    "MacroTargets",
    "macro_targets",
    "MicroReference",
    "micronutrient_references",
    "DailyReport",
    "daily_report",
]
