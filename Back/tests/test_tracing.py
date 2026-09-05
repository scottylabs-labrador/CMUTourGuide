import time

from services import tracing
from app.routers.chat import ChatRequest, Message, to_openai_messages


def test_capture_is_noop_without_token():
	# No POSTHOG_PROJECT_TOKEN in tests -> disabled client, calls must not raise
	assert tracing.posthog.disabled is True
	tracing.capture_span(distinct_id=None, trace_id="t", name="search", input={"q": "x"}, output="y", started=time.time())
	tracing.capture_trace(distinct_id=None, trace_id="t", name="chat", input="q", output="a", started=time.time())


def test_chat_request_ids_are_optional():
	req = ChatRequest(messages=[Message(id="1", text="hi", isUser=True, timestamp="t")])
	assert req.distinct_id is None and req.session_id is None
	assert to_openai_messages(req.messages) == [{"role": "user", "content": "hi"}]
