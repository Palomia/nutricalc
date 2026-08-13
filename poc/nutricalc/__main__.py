"""Démo en ligne de commande : `python -m nutricalc`.

Utilise un profil synthétique (aucune donnée personnelle réelle).
"""

from __future__ import annotations

from .profile import ActivityLevel, Profile, Sex
from .report import daily_report, format_report


def main() -> None:
    # Profil d'exemple purement synthétique.
    profile = Profile(
        sex=Sex.FEMALE,
        age_years=35,
        weight_kg=65.0,
        height_cm=168.0,
        activity=ActivityLevel.MODERATE,
    )
    print(format_report(daily_report(profile)))


if __name__ == "__main__":
    main()
