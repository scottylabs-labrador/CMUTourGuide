"""LLM observability via PostHog AI observability.

Generations are auto-captured by the `posthog.ai.openai.AsyncOpenAI` wrapper
(https://posthog.com/docs/ai-observability/installation/openai). Tool executions are
not, so they are captured here as `$ai_span` events per
https://posthog.com/docs/ai-observability/installation/manual-capture.
"""
import os
import time
import uuid
from typing import Any, Optional

from posthog import Posthog

POSTHOG_TOKEN = os.getenv("POSTHOG_PROJECT_TOKEN")
POSTHOG_HOST = os.getenv("POSTHOG_HOST", "https://us.i.posthog.com")

# disabled=True makes every capture a no-op, so local runs without a token stay silent
posthog = Posthog(project_api_key=POSTHOG_TOKEN or "placeholder", host=POSTHOG_HOST, disabled=not POSTHOG_TOKEN,
                  debug=os.getenv("POSTHOG_DEBUG") == "1")  # POSTHOG_DEBUG=1 logs every batch sent

ANONYMOUS_ID = "anonymous-backend"


def new_id() -> str:
	return str(uuid.uuid4())


def capture_span(
	*, distinct_id: Optional[str], trace_id: str, name: str, input: Any, output: Any,
	started: float, parent_id: Optional[str] = None, session_id: Optional[str] = None, error: Optional[str] = None,
) -> None:
	"""One $ai_span per tool execution; shows as a child of the trace in PostHog's trace tree."""
	posthog.capture(
		"$ai_span",
		distinct_id=distinct_id or ANONYMOUS_ID,
		properties={
			"$ai_trace_id": trace_id,
			"$ai_span_id": new_id(),
			"$ai_parent_id": parent_id,
			"$ai_span_name": name,
			"$ai_input_state": input,
			"$ai_output_state": output,
			"$ai_latency": round(time.time() - started, 3),
			"$ai_session_id": session_id,
			"$ai_is_error": bool(error),
			"$ai_error": error,
		},
	)


def capture_trace(
	*, distinct_id: Optional[str], trace_id: str, name: str, input: Any, output: Any,
	started: float, session_id: Optional[str] = None, properties: Optional[dict[str, Any]] = None,
) -> None:
	"""One $ai_trace per /chat request: the root the generations and spans hang off."""
	posthog.capture(
		"$ai_trace",
		distinct_id=distinct_id or ANONYMOUS_ID,
		properties={
			"$ai_trace_id": trace_id,
			"$ai_span_name": name,
			"$ai_input_state": input,
			"$ai_output_state": output,
			"$ai_latency": round(time.time() - started, 3),
			"$ai_session_id": session_id,
			**(properties or {}),
		},
	)
