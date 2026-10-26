import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.routers import chat
from services.rate_limit import limiter

@pytest.fixture(autouse=True)
def fresh_limits():
    limiter.reset()

msg = lambda text="hi", i=0: {"id": str(i), "text": text, "isUser": i % 2 == 0, "timestamp": "2026-10-26T00:00:00Z"}

@pytest.fixture
def replies(monkeypatch):
    seen = []
    async def fake_generate(req, trace_id): seen.append(req); return "ok"
    monkeypatch.setattr(chat, "generate_reply", fake_generate)
    return seen

def test_normal_request_passes(replies):
    assert TestClient(app).post("/chat", json={"messages": [msg()]}).json() == {"reply": "ok"}

# Unbounded input would let any caller run up the OpenRouter bill
@pytest.mark.parametrize("messages", [
    [msg("x" * (chat.MAX_MESSAGE_CHARS + 1))],
    [msg(i=i) for i in range(chat.MAX_MESSAGES + 1)],
    [],
])
def test_rejects_oversized_input(replies, messages):
    assert TestClient(app).post("/chat", json={"messages": messages}).status_code == 422
    assert replies == []

def test_only_recent_history_reaches_the_model():
    messages = [chat.Message(**msg(f"m{i}", i)) for i in range(chat.MAX_MESSAGES)]
    sent = chat.to_openai_messages(messages)
    assert len(sent) == chat.MAX_HISTORY_MESSAGES and sent[-1]["content"] == f"m{chat.MAX_MESSAGES - 1}"
