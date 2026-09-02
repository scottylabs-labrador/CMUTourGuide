import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.routers import vision, feedback
from services.rate_limit import limiter

@pytest.fixture(autouse=True)
def fresh_limits():
    limiter.reset()

@pytest.fixture
def client(monkeypatch):
    async def fake_recognize(_): return vision.VisionResponse(building_name="Gates", confidence=0.9)
    monkeypatch.setattr(vision, "recognize_building", fake_recognize)
    return TestClient(app)

def test_vision_blocks_after_20_per_minute(client):
    codes = [client.post("/vision", json={"imageBase64": "x"}).status_code for _ in range(21)]
    assert codes[:20] == [200] * 20 and codes[20] == 429

def test_limits_are_per_client_ip(client):
    for _ in range(20): client.post("/vision", json={"imageBase64": "x"}, headers={"x-envoy-external-address": "1.1.1.1"})
    assert client.post("/vision", json={"imageBase64": "x"}, headers={"x-envoy-external-address": "1.1.1.1"}).status_code == 429
    assert client.post("/vision", json={"imageBase64": "x"}, headers={"x-envoy-external-address": "2.2.2.2"}).status_code == 200

def test_feedback_503_when_webhook_unset(monkeypatch):
    monkeypatch.delenv("DISCORD_WEBHOOK_URL", raising=False)
    r = TestClient(app).post("/feedback", json={"category": "bug", "message": "hi"})
    assert r.status_code == 503

def test_feedback_rejects_bad_category_and_empty_message():
    c = TestClient(app)
    assert c.post("/feedback", json={"category": "spam", "message": "hi"}).status_code == 422
    assert c.post("/feedback", json={"category": "bug", "message": ""}).status_code == 422

def test_discord_payload_shape():
    p = feedback.build_discord_payload(feedback.FeedbackRequest(category="bug", message=" hello ", platform="ios 18"), "T")
    assert p["embeds"][0] == {"title": "Bug Report", "description": "hello", "color": 0xC41230, "timestamp": "T", "footer": {"text": "ios 18"}}
