import os
import time
from typing import Any, Optional

import openai
from fastapi import APIRouter, HTTPException, Request
from posthog.ai.openai import AsyncOpenAI  # drop-in OpenAI client that captures $ai_generation events
from pydantic import BaseModel

from services import chat_tools, tracing
from services.knowledge import KB
from services.rate_limit import limiter


OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL = "openai/gpt-5-mini"
OPENROUTER_TIMEOUT_SECONDS = 30.0
OPENROUTER_MAX_TOKENS = 2000
OPENROUTER_REASONING_EFFORT = "low"
MAX_TOOL_ITERATIONS = 4

BASE_SYSTEM_PROMPT = """You are a CMU Tour Guide AI assistant helping visitors navigate Carnegie Mellon University.

KNOWLEDGE RULES (strict):
- Answer ONLY from the CURRENT BUILDING CONTEXT (if provided) and from tool results. Do not use outside knowledge about CMU, even when you are confident.
- If the question is not covered by the current building context, call search_campus_info BEFORE answering. If the first search misses, search once more with different keywords.
- Use get_building_info when the user asks about a specific other building.
- If the knowledge base still does not cover it, say so in one sentence and suggest where to ask (the Coulter Welcome Center or admission office). Never guess.
- Never invent walking directions or spatial relationships between buildings. For "how do I get to X", tell the visitor the app's Map tab draws the walking route, then answer what X is from the knowledge base.

RESPONSE RULES (strict):
- Reply in 2-4 sentences. Never exceed one short paragraph, even when comparing buildings or answering complex questions.
- Use markdown for emphasis (bold, italics) but do NOT use headings, bullet lists, or multiple paragraphs.
- Be informative and friendly, but cut filler. Lead with the answer, not preamble.
- If the query is irrelevant to CMU or inappropriate, politely decline in one sentence and suggest they ask about something else."""


class Message(BaseModel):
	id: str
	text: str
	isUser: bool
	timestamp: str


class ChatRequest(BaseModel):
	messages: list[Message]
	building_id: Optional[str] = None
	distinct_id: Optional[str] = None  # PostHog distinct id from the app, joins traces to app events
	session_id: Optional[str] = None  # chat session id, groups traces per conversation


class ChatResponse(BaseModel):
	reply: str


router = APIRouter(prefix="", tags=["chat"])

_client: Optional[AsyncOpenAI] = None


def get_client() -> AsyncOpenAI:
	global _client
	if _client is None:
		api_key = os.getenv("OPENROUTER_API_KEY")
		if not api_key:
			raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not configured")
		# OpenRouter is OpenAI-compatible; PostHog's wrapper forwards base_url/api_key to openai.AsyncOpenAI
		_client = AsyncOpenAI(posthog_client=tracing.posthog, base_url=OPENROUTER_BASE_URL, api_key=api_key,
		                      timeout=OPENROUTER_TIMEOUT_SECONDS)
	return _client


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("30/minute")
async def chat(request: Request, req: ChatRequest) -> ChatResponse:
	last_user_msg = next((m.text for m in reversed(req.messages) if m.isUser), "(none)")
	trace_id = tracing.new_id()
	started = time.time()
	print(f"[chat] -> trace={trace_id[:8]} building={req.building_id!r} msgs={len(req.messages)} user={last_user_msg[:100]!r}")
	reply = await generate_reply(req, trace_id)
	print(f"[chat] <- ({len(reply)}c) {reply[:120]!r}")
	tracing.capture_trace(
		distinct_id=req.distinct_id, trace_id=trace_id, name="chat", input=last_user_msg, output=reply,
		started=started, session_id=req.session_id, properties={"building_id": req.building_id},
	)
	return ChatResponse(reply=reply)


def build_system_prompt(building_id: Optional[str]) -> str:
	if not building_id:
		return BASE_SYSTEM_PROMPT

	record = KB.building(building_id)
	if record is None:
		return BASE_SYSTEM_PROMPT

	context_block = KB.format_doc(record)
	return (
		f"{BASE_SYSTEM_PROMPT}\n\n"
		f"CURRENT BUILDING CONTEXT (the visitor is currently at this building):\n"
		f"{context_block}\n\n"
		f"Ground answers about the current building in the facts above. "
		f"For anything NOT covered above (other buildings, dining nearby, directions, history, traditions), "
		f"call search_campus_info or get_building_info BEFORE answering. Only say you don't know after a search comes back empty."
	)


def to_openai_messages(messages: list[Message]) -> list[dict[str, Any]]:
	return [{"role": "user" if m.isUser else "assistant", "content": m.text} for m in messages]


async def generate_reply(req: ChatRequest, trace_id: str) -> str:
	client = get_client()
	chat_history: list[dict[str, Any]] = [{"role": "system", "content": build_system_prompt(req.building_id)}]
	chat_history.extend(to_openai_messages(req.messages))
	ph = {"$ai_session_id": req.session_id, "building_id": req.building_id}

	for iteration in range(1, MAX_TOOL_ITERATIONS + 1):
		try:
			response = await client.chat.completions.create(
				model=OPENROUTER_MODEL,
				messages=chat_history,
				tools=chat_tools.TOOLS,
				max_tokens=OPENROUTER_MAX_TOKENS,
				extra_body={"reasoning": {"effort": OPENROUTER_REASONING_EFFORT}},
				# PostHog wrapper kwargs: link this generation to the trace / user / session
				posthog_distinct_id=req.distinct_id or tracing.ANONYMOUS_ID,
				posthog_trace_id=trace_id,
				posthog_properties={**ph, "$ai_span_name": f"llm_call_{iteration}"},
			)
		except openai.APIStatusError as e:
			print(f"[chat] OpenRouter HTTP {e.status_code} on iter #{iteration}: {str(e)[:500]}")
			return "Sorry, I couldn't reach my knowledge service right now. Please try again."
		except openai.APIError as e:
			print(f"[chat] OpenRouter transport error on iter #{iteration}: {e!r}")
			return "Sorry, I couldn't reach my knowledge service right now. Please try again."

		# OpenRouter sometimes surfaces upstream errors inside a 200 body (no choices)
		if not response.choices:
			print(f"[chat] OpenRouter returned no choices on iter #{iteration}: {response.model_dump(exclude_none=True)}")
			return "Sorry, I couldn't generate a response. Please try again."

		choice = response.choices[0]
		msg = choice.message
		tool_calls = msg.tool_calls or []

		if not tool_calls:
			if not msg.content:
				print(f"[chat] EMPTY CONTENT iter#{iteration} finish={choice.finish_reason!r} usage={response.usage}")
				if choice.finish_reason == "length":
					return "Sorry, my answer ran past its length limit before I could finish. Please try asking again, maybe more specifically."
				return "Sorry, I couldn't generate a response. Please try again."
			return msg.content

		chat_history.append(msg.model_dump(exclude_none=True, include={"role", "content", "tool_calls"}))
		for tc in tool_calls:
			args = chat_tools.parse_arguments(tc.function.arguments)
			t0 = time.time()
			result = chat_tools.dispatch(tc.function.name, args)
			print(f"[chat] tool {tc.function.name}({args}) -> {len(result)}c")
			tracing.capture_span(
				distinct_id=req.distinct_id, trace_id=trace_id, name=tc.function.name, input=args,
				output=result, started=t0, session_id=req.session_id,
			)
			chat_history.append({"role": "tool", "tool_call_id": tc.id, "content": result})

	print(f"[chat] hit MAX_TOOL_ITERATIONS={MAX_TOOL_ITERATIONS}, giving up")
	return "I'm having trouble pulling that information together. Could you rephrase your question?"
