"""Besoin énergétique journalier.

Métabolisme de base (BMR) par l'équation de Mifflin-St Jeor (1990), puis
besoin énergétique total (TDEE) = BMR × facteur d'activité.
"""

from __future__ import annotations

from .profile import Profile, Sex


def bmr_mifflin_st_jeor(profile: Profile) -> float:
    """Métabolisme de base en kcal/j (Mifflin-St Jeor)."""
    base = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age_years
    return base + (5 if profile.sex is Sex.MALE else -161)


def tdee(profile: Profile) -> float:
    """Besoin énergétique total en kcal/j (BMR × niveau d'activité)."""
    return bmr_mifflin_st_jeor(profile) * float(profile.activity.value)
