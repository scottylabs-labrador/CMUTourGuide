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

# Modal reports its own failures inside a 200 body; those must surface as errors, not LOW_CONFIDENCE
import asyncio, httpx, pytest
from app.routers import vision

def modal_returns(monkeypatch, body):
    async def fake_post(self, *a, **k): return httpx.Response(200, json=body, request=httpx.Request("POST", "http://modal"))
    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)

@pytest.mark.parametrize("body", [
    {"error": "PROCESSING_ERROR", "description": "bad image"},
    {"building": "Error", "confidence": 0.0, "error": "DECODE_ERROR"},
])
def test_modal_errors_pass_through(monkeypatch, body):
    modal_returns(monkeypatch, body)
    r = apply_threshold(asyncio.run(vision.recognize_building("x")), 0.5)
    assert r.error == body["error"] and r.building_name == "Error"

def test_modal_errors_are_not_uploaded(monkeypatch):
    from fastapi.testclient import TestClient
    from app.main import app
    modal_returns(monkeypatch, {"error": "PROCESSING_ERROR"})
    uploads = []
    monkeypatch.setattr(vision, "upload_interaction", lambda *a: uploads.append(a))
    assert TestClient(app).post("/vision", json={"imageBase64": "x"}).json()["error"] == "PROCESSING_ERROR"
    assert uploads == []
