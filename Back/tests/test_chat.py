import asyncio
from types import SimpleNamespace
import pytest
from openai.types.chat import ChatCompletion
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

def completion(content=None, tool_calls=None):
    return ChatCompletion.model_validate({"id": "c", "object": "chat.completion", "created": 0, "model": "m", "choices": [
        {"index": 0, "finish_reason": "stop", "message": {"role": "assistant", "content": content, "tool_calls": tool_calls}}]})

search_call = [{"id": "t1", "type": "function", "function": {"name": "search_campus_info", "arguments": '{"query": "secret query"}'}}]

@pytest.fixture
def llm(monkeypatch):
    # Scripted fake OpenRouter client: pops one completion per call, records the kwargs it was sent
    calls, script = [], []
    async def create(**kw): calls.append(kw); return script.pop(0)
    client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))
    monkeypatch.setattr(chat, "get_client", lambda: client)
    return calls, script

def run_reply(text="hi"):
    return asyncio.run(chat.generate_reply(chat.ChatRequest(messages=[chat.Message(**msg(text))]), "trace"))

# Chats must only reach providers that neither train on nor retain them
def test_requests_only_no_training_zero_retention_providers(llm):
    calls, script = llm
    script.append(completion("answer"))
    assert run_reply() == "answer"
    assert calls[0]["extra_body"]["provider"] == {"data_collection": "deny", "zdr": True}

# User text lives in PostHog under the privacy policy, not in Railway's plaintext logs
def test_logs_never_contain_user_text(llm, capsys):
    _, script = llm
    script += [completion(tool_calls=search_call), completion("secret reply")]
    assert run_reply("secret question") == "secret reply"
    assert "secret" not in capsys.readouterr().out

def test_endpoint_logs_never_contain_user_text(replies, capsys):
    TestClient(app).post("/chat", json={"messages": [msg("secret question")]})
    assert "secret" not in capsys.readouterr().out

def test_prompt_has_crisis_resources_and_real_map_location():
    for text in ("988", "412-268-2922", "412-268-2323", "Home screen"):
        assert text in chat.BASE_SYSTEM_PROMPT
    assert "Map tab" not in chat.BASE_SYSTEM_PROMPT
