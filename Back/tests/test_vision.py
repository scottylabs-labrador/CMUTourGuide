from app.routers.vision import VisionResponse, apply_threshold, LOW_CONFIDENCE

ok = lambda c: VisionResponse(building_name="Gates", confidence=c, error=None)

def test_confident_result_passes_through():
    assert apply_threshold(ok(0.9), 0.5) == ok(0.9)

def test_below_threshold_is_flagged_but_keeps_name_and_confidence():
    r = apply_threshold(ok(0.3), 0.5)
    assert r.error == LOW_CONFIDENCE and r.building_name == "Gates" and r.confidence == 0.3

def test_exactly_threshold_passes():
    assert apply_threshold(ok(0.5), 0.5).error is None

def test_existing_errors_are_untouched():
    err = VisionResponse(building_name="Error", confidence=0.0, error="TIMEOUT")
    assert apply_threshold(err, 0.5) == err
