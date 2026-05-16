import os
from typing import Any, Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import buildings_kb, chat_tools


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "openai/gpt-5-mini"
OPENROUTER_TIMEOUT_SECONDS = 30.0
OPENROUTER_MAX_TOKENS = 2000
OPENROUTER_REASONING_EFFORT = "minimal"
MAX_TOOL_ITERATIONS = 3

BASE_SYSTEM_PROMPT = """You are a CMU Tour Guide AI assistant helping visitors navigate Carnegie Mellon University.

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


class ChatResponse(BaseModel):
	reply: str


router = APIRouter(prefix="", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
	last_user_msg = next((m.text for m in reversed(req.messages) if m.isUser), "(none)")
	print(
		f"[chat] -> building={req.building_id!r} msgs={len(req.messages)} "
		f"user={last_user_msg[:100]!r}"
	)
	reply = await generate_reply(req.messages, req.building_id)
	print(f"[chat] <- ({len(reply)}c) {reply[:120]!r}")
	return ChatResponse(reply=reply)


def build_system_prompt(building_id: Optional[str]) -> str:
	if not building_id:
		return BASE_SYSTEM_PROMPT

	record = buildings_kb.get_building(building_id)
	if record is None:
		return BASE_SYSTEM_PROMPT

	context_block = buildings_kb.format_building_context(record)
	return (
		f"{BASE_SYSTEM_PROMPT}\n\n"
		f"CURRENT BUILDING CONTEXT (the visitor is currently at this building):\n"
		f"{context_block}\n\n"
		f"Ground every answer about the current building in the facts above. "
		f"If the answer is not covered by these facts, say you don't know rather than guessing."
		f"Only call get_building_info when the user asks about a DIFFERENT building."
	)


def to_openai_messages(messages: list[Message]) -> list[dict[str, Any]]:
	out: list[dict[str, Any]] = []
	for m in messages:
		role = "user" if m.isUser else "assistant"
		out.append({"role": role, "content": m.text})
	return out


async def generate_reply(messages: list[Message], building_id: Optional[str]) -> str:
	api_key = os.getenv("OPENROUTER_API_KEY")
	if not api_key:
		raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not configured")

	system_prompt = build_system_prompt(building_id)
	chat_history: list[dict[str, Any]] = [
		{"role": "system", "content": system_prompt},
	]
	chat_history.extend(to_openai_messages(messages))

	headers = {
		"Authorization": f"Bearer {api_key}",
		"Content-Type": "application/json",
	}

	async with httpx.AsyncClient(timeout=OPENROUTER_TIMEOUT_SECONDS) as client:
		for iteration in range(1, MAX_TOOL_ITERATIONS + 1):
			payload = {
				"model": OPENROUTER_MODEL,
				"messages": chat_history,
				"tools": chat_tools.TOOLS,
				"max_tokens": OPENROUTER_MAX_TOKENS,
				"reasoning": {"effort": OPENROUTER_REASONING_EFFORT},
			}
			try:
				response = await client.post(OPENROUTER_URL, headers=headers, json=payload)
				response.raise_for_status()
				data = response.json()
			except httpx.HTTPStatusError as e:
				body = ""
				try:
					body = e.response.text
				except Exception:
					pass
				print(
					f"[chat] OpenRouter HTTP {e.response.status_code} on iter #{iteration}: "
					f"{body[:1000]}"
				)
				return "Sorry, I couldn't reach my knowledge service right now. Please try again."
			except httpx.HTTPError as e:
				print(f"[chat] OpenRouter transport error on iter #{iteration}: {e!r}")
				return "Sorry, I couldn't reach my knowledge service right now. Please try again."

			# OpenRouter sometimes surfaces upstream errors inside a 200 body.
			if isinstance(data, dict) and data.get("error"):
				print(f"[chat] OpenRouter returned error payload on iter #{iteration}: {data.get('error')}")
				return "Sorry, I couldn't generate a response. Please try again."

			choices = data.get("choices") or []
			if not choices:
				print(f"[chat] OpenRouter returned no choices on iter #{iteration}: {data}")
				return "Sorry, I couldn't generate a response. Please try again."

			choice = choices[0]
			assistant_msg = choice.get("message") or {}
			tool_calls = assistant_msg.get("tool_calls") or []
			finish_reason = choice.get("finish_reason")
			content = assistant_msg.get("content")

			if not tool_calls:
				if not content:
					usage = data.get("usage") or {}
					print(
						f"[chat] EMPTY CONTENT iter#{iteration} "
						f"finish_reason={finish_reason!r} usage={usage} "
						f"msg={assistant_msg}"
					)
					if finish_reason == "length":
						return (
							"Sorry, my answer ran past its length limit before I "
							"could finish. Please try asking again, maybe more specifically."
						)
					return "Sorry, I couldn't generate a response. Please try again."
				return content

			chat_history.append(assistant_msg)
			for tc in tool_calls:
				fn = tc.get("function") or {}
				name = fn.get("name", "")
				args = chat_tools.parse_arguments(fn.get("arguments"))
				result = chat_tools.dispatch(name, args)
				print(f"[chat] tool {name}({args}) -> {len(result)}c")
				chat_history.append({
					"role": "tool",
					"tool_call_id": tc.get("id", ""),
					"content": result,
				})

	print(f"[chat] hit MAX_TOOL_ITERATIONS={MAX_TOOL_ITERATIONS}, giving up")
	return "I'm having trouble pulling that information together. Could you rephrase your question?"
