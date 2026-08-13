import pytest

from nutricalc import Profile, Sex, macro_targets
from nutricalc.macros import KCAL_PER_G


def _profile(weight=80.0, sex=Sex.MALE):
    return Profile(sex, age_years=30, weight_kg=weight, height_cm=180)


# --- Acides aminés indispensables ---

def test_nine_essential_amino_acids():
    aa = macro_targets(_profile(), 2500).amino_acids
    assert len(aa) == 9


def test_amino_acid_scales_with_weight():
    aa = {a.name: a for a in macro_targets(_profile(weight=80), 2500).amino_acids}
    # Leucine : 39 mg/kg × 80 kg = 3120 mg/j
    assert aa["Leucine"].mg == pytest.approx(3120)
    assert aa["Tryptophane"].mg == pytest.approx(4 * 80)


def test_amino_acids_identical_across_sex():
    men = {a.name: a.mg for a in macro_targets(_profile(sex=Sex.MALE), 2500).amino_acids}
    women = {a.name: a.mg for a in macro_targets(_profile(sex=Sex.FEMALE), 2500).amino_acids}
    assert men == women


# --- Acides gras ---

def test_seven_fatty_acid_entries():
    fa = macro_targets(_profile(), 2500).fatty_acids
    assert len(fa) == 7


def test_saturated_is_a_ceiling_at_12_percent():
    fa = {f.name: f for f in macro_targets(_profile(), 2500).fatty_acids}
    ags = fa["Acides gras saturés"]
    assert ags.kind == "limite"
    assert ags.percent_aet == 12.0


def test_linoleic_grams_from_percent_and_energy():
    energy = 2500.0
    fa = {f.name: f for f in macro_targets(_profile(), energy).fatty_acids}
    lin = fa["Acide linoléique (ω-6)"]
    assert lin.grams == pytest.approx(4 / 100 * energy / KCAL_PER_G["lipid"])


def test_epa_dha_are_absolute_milligrams():
    fa = {f.name: f for f in macro_targets(_profile(), 2500).fatty_acids}
    assert fa["EPA"].milligrams == 250
    assert fa["DHA"].milligrams == 250
    assert fa["EPA"].percent_aet is None


def test_oleic_is_a_range():
    fa = {f.name: f for f in macro_targets(_profile(), 2500).fatty_acids}
    ole = fa["Acide oléique (AGMI, ω-9)"]
    assert ole.percent_aet == 15.0
    assert ole.percent_aet_max == 20.0


# --- Glucides ---

def test_carb_components_count_and_names():
    c = {x.name: x for x in macro_targets(_profile(), 2500).carb_components}
    assert len(c) == 2
    assert "Fibres" in c
    assert "Sucres libres / ajoutés" in c


def test_fibres_is_as_30g():
    c = {x.name: x for x in macro_targets(_profile(), 2500).carb_components}
    assert c["Fibres"].kind == "AS"
    assert c["Fibres"].grams == 30


def test_free_sugars_derived_from_percent():
    energy = 2500.0
    c = {x.name: x for x in macro_targets(_profile(), energy).carb_components}
    fs = c["Sucres libres / ajoutés"]
    assert fs.percent_aet == 10
    assert fs.grams == pytest.approx(10 / 100 * energy / KCAL_PER_G["carb"])
