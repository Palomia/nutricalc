import pytest

from nutricalc import Profile, Sex, macro_targets
from nutricalc.macros import KCAL_PER_G, PROTEIN_G_PER_KG


def _profile():
    return Profile(Sex.MALE, age_years=30, weight_kg=80, height_cm=180)


def test_protein_scales_with_body_weight():
    targets = macro_targets(_profile(), energy_kcal=2500)
    assert targets.protein.grams == pytest.approx(PROTEIN_G_PER_KG * 80)


def test_energy_is_fully_partitioned():
    energy = 2500.0
    t = macro_targets(_profile(), energy)
    total = t.protein.kcal + t.lipid.kcal + t.carb.kcal
    assert total == pytest.approx(energy)


def test_percentages_sum_to_one():
    t = macro_targets(_profile(), 2500)
    assert t.protein.percent_aet + t.lipid.percent_aet + t.carb.percent_aet == pytest.approx(1.0)


def test_lipids_are_37_5_percent_of_energy():
    t = macro_targets(_profile(), 2000)
    assert t.lipid.percent_aet == pytest.approx(0.375)


def test_grams_match_kcal_conversion():
    t = macro_targets(_profile(), 2500)
    assert t.carb.kcal == pytest.approx(t.carb.grams * KCAL_PER_G["carb"])


def test_rejects_non_positive_energy():
    with pytest.raises(ValueError):
        macro_targets(_profile(), 0)
