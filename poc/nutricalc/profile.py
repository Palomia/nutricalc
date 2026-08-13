"""Profil d'entrée du calcul.

Le POC ne couvre que les adultes non enceintes/allaitants ; les références
ANSES diffèrent pour les enfants, la grossesse et l'allaitement (voir
DESIGN.md, section « Limites »).
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class Sex(str, Enum):
    """Sexe biologique, requis par la formule de Mifflin-St Jeor."""

    MALE = "male"
    FEMALE = "female"


class ActivityLevel(float, Enum):
    """Facteur multiplicatif appliqué au métabolisme de base pour obtenir le
    besoin énergétique total (TDEE)."""

    SEDENTARY = 1.2  # peu ou pas d'exercice
    LIGHT = 1.375  # exercice léger 1-3 j/sem
    MODERATE = 1.55  # exercice modéré 3-5 j/sem
    ACTIVE = 1.725  # exercice intense 6-7 j/sem
    VERY_ACTIVE = 1.9  # travail physique ou double entraînement


@dataclass(frozen=True)
class Profile:
    sex: Sex
    age_years: int
    weight_kg: float
    height_cm: float
    activity: ActivityLevel = ActivityLevel.MODERATE

    def __post_init__(self) -> None:
        if not 18 <= self.age_years <= 120:
            raise ValueError("Le POC ne couvre que les adultes (18-120 ans).")
        if not 0 < self.weight_kg <= 400:
            raise ValueError("Poids hors limites plausibles (0-400 kg).")
        if not 0 < self.height_cm <= 260:
            raise ValueError("Taille hors limites plausibles (0-260 cm).")
