"""Assemblage du rapport journalier complet."""

from __future__ import annotations

from dataclasses import dataclass

from .energy import bmr_mifflin_st_jeor, tdee
from .macros import MacroTargets, macro_targets
from .micros import MicroReference, micronutrient_references
from .profile import Profile


@dataclass(frozen=True)
class DailyReport:
    profile: Profile
    bmr_kcal: float
    energy_kcal: float
    macros: MacroTargets
    micros: list[MicroReference]


def daily_report(profile: Profile) -> DailyReport:
    """Calcule énergie, macronutriments et micronutriments pour un profil."""
    bmr = bmr_mifflin_st_jeor(profile)
    energy = tdee(profile)
    return DailyReport(
        profile=profile,
        bmr_kcal=bmr,
        energy_kcal=energy,
        macros=macro_targets(profile, energy),
        micros=micronutrient_references(profile),
    )


def format_report(report: DailyReport) -> str:
    """Rend le rapport en texte lisible (pour la démo en ligne de commande)."""
    p = report.profile
    lines = [
        f"Profil : {p.sex.value}, {p.age_years} ans, "
        f"{p.weight_kg:g} kg, {p.height_cm:g} cm, activité {p.activity.name}",
        "",
        f"Métabolisme de base : {report.bmr_kcal:.0f} kcal/j",
        f"Besoin énergétique  : {report.energy_kcal:.0f} kcal/j",
        "",
        "Macronutriments :",
    ]
    for label, m in (
        ("Protéines", report.macros.protein),
        ("Lipides", report.macros.lipid),
        ("Glucides", report.macros.carb),
    ):
        lines.append(
            f"  {label:<10} {m.grams:6.0f} g  "
            f"({m.kcal:5.0f} kcal, {m.percent_aet * 100:4.0f} % AET)"
        )
    lines += ["", "Micronutriments (référence ANSES) :"]
    for micro in report.micros:
        lines.append(f"  {micro.name:<14} {micro.amount:7g} {micro.unit:<5} [{micro.kind}]")
    return "\n".join(lines)
