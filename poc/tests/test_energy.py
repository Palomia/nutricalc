from nutricalc import ActivityLevel, Profile, Sex, bmr_mifflin_st_jeor, tdee


def test_bmr_male_reference_value():
    # 10*80 + 6.25*180 - 5*30 + 5 = 1780
    p = Profile(Sex.MALE, age_years=30, weight_kg=80, height_cm=180)
    assert bmr_mifflin_st_jeor(p) == 1780.0


def test_bmr_female_reference_value():
    # 10*65 + 6.25*165 - 5*30 - 161 = 1370.25
    p = Profile(Sex.FEMALE, age_years=30, weight_kg=65, height_cm=165)
    assert bmr_mifflin_st_jeor(p) == 1370.25


def test_bmr_male_above_female_all_else_equal():
    common = dict(age_years=40, weight_kg=70, height_cm=170)
    assert bmr_mifflin_st_jeor(Profile(Sex.MALE, **common)) > bmr_mifflin_st_jeor(
        Profile(Sex.FEMALE, **common)
    )


def test_tdee_applies_activity_factor():
    p = Profile(Sex.MALE, age_years=30, weight_kg=80, height_cm=180,
                activity=ActivityLevel.MODERATE)
    assert tdee(p) == 1780.0 * 1.55


def test_tdee_monotonic_in_activity():
    base = dict(sex=Sex.FEMALE, age_years=45, weight_kg=60, height_cm=160)
    values = [tdee(Profile(activity=a, **base)) for a in ActivityLevel]
    assert values == sorted(values)
