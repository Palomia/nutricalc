import pytest

from nutricalc import Profile, Sex


def test_valid_adult_profile():
    p = Profile(Sex.MALE, age_years=30, weight_kg=80, height_cm=180)
    assert p.weight_kg == 80


@pytest.mark.parametrize("age", [10, 17, 121])
def test_rejects_non_adult_or_implausible_age(age):
    with pytest.raises(ValueError):
        Profile(Sex.FEMALE, age_years=age, weight_kg=60, height_cm=165)


@pytest.mark.parametrize("weight", [0, -5, 500])
def test_rejects_implausible_weight(weight):
    with pytest.raises(ValueError):
        Profile(Sex.MALE, age_years=30, weight_kg=weight, height_cm=180)


@pytest.mark.parametrize("height", [0, -1, 300])
def test_rejects_implausible_height(height):
    with pytest.raises(ValueError):
        Profile(Sex.MALE, age_years=30, weight_kg=80, height_cm=height)
