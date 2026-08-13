from nutricalc import Profile, Sex, micronutrient_references


def _by_name(refs):
    return {r.name: r for r in refs}


def test_returns_full_reference_set():
    refs = micronutrient_references(Profile(Sex.MALE, 30, 80, 180))
    assert len(refs) == 18


def test_vitamin_c_reference_is_shared():
    refs = _by_name(micronutrient_references(Profile(Sex.FEMALE, 30, 65, 165)))
    assert refs["Vitamine C"].amount == 110.0
    assert refs["Vitamine C"].unit == "mg"


def test_iron_higher_for_women():
    men = _by_name(micronutrient_references(Profile(Sex.MALE, 30, 80, 180)))
    women = _by_name(micronutrient_references(Profile(Sex.FEMALE, 30, 65, 165)))
    assert women["Fer"].amount > men["Fer"].amount


def test_kinds_are_valid():
    refs = micronutrient_references(Profile(Sex.MALE, 30, 80, 180))
    assert {r.kind for r in refs} <= {"RNP", "AS"}
