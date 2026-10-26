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
import asyncio, base64, httpx, pytest
from fastapi.testclient import TestClient
from app.main import app
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

JPEG = base64.b64encode(b"\xff\xd8\xff\xe0" + b"\0" * 16).decode()

def test_modal_errors_are_not_uploaded(monkeypatch):
    modal_returns(monkeypatch, {"error": "PROCESSING_ERROR"})
    uploads = []
    monkeypatch.setattr(vision, "upload_interaction", lambda *a: uploads.append(a))
    assert TestClient(app).post("/vision", json={"imageBase64": JPEG}).json()["error"] == "PROCESSING_ERROR"
    assert uploads == []

# Modal endpoint requires proxy auth; backend must send the token pair
def test_modal_call_sends_proxy_auth_headers(monkeypatch):
    monkeypatch.setenv("VISION_PROXY_KEY", "wk-id")
    monkeypatch.setenv("VISION_PROXY_SECRET", "ws-secret")
    sent = {}
    async def fake_post(self, url, **k):
        sent.update(k["headers"])
        return httpx.Response(200, json={"building": "Gates", "confidence": 0.9}, request=httpx.Request("POST", url))
    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)
    asyncio.run(vision.recognize_building(JPEG))
    assert sent["Modal-Key"] == "wk-id" and sent["Modal-Secret"] == "ws-secret"

# Only real JPEGs of bounded size reach Modal and S3
@pytest.mark.parametrize("image", [
    "x",  # not base64
    base64.b64encode(b"MZ\x90\x00 not an image").decode(),  # arbitrary bytes
    base64.b64encode(b"\x89PNG\r\n\x1a\n").decode(),  # wrong format
    "A" * (vision.MAX_IMAGE_BASE64_CHARS + 1),  # oversized
])
def test_rejects_non_jpeg_or_oversized(monkeypatch, image):
    calls = []
    async def fake_recognize(img): calls.append(img)
    monkeypatch.setattr(vision, "recognize_building", fake_recognize)
    assert TestClient(app).post("/vision", json={"imageBase64": image}).status_code == 422
    assert calls == []

def test_accepts_data_url_jpeg():
    assert vision.VisionRequest(imageBase64=f"data:image/jpeg;base64,{JPEG}").imageBase64 == JPEG
