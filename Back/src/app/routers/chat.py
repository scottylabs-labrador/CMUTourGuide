import os
from typing import Any, Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import buildings_kb, chat_tools


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "openai/gpt-4o"
OPENROUTER_TIMEOUT_SECONDS = 30.0
OPENROUTER_MAX_TOKENS = 250
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
		f"[chat] /chat called | building_id={req.building_id!r} | "
		f"messages={len(req.messages)} | last_user={last_user_msg[:120]!r}"
	)
	reply = await generate_reply(req.messages, req.building_id)
	print(f"[chat] /chat returning reply ({len(reply)} chars): {reply[:160]!r}")
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
	resolved = building_id and buildings_kb.get_building(building_id) is not None
	print(
		f"[chat] system prompt for building_id={building_id!r} "
		f"(resolved={bool(resolved)}, length={len(system_prompt)} chars):\n"
		f"----- BEGIN SYSTEM PROMPT -----\n"
		f"{system_prompt}\n"
		f"----- END SYSTEM PROMPT -----"
	)

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
			}
			print(f"[chat] OpenRouter call #{iteration} (history len={len(chat_history)})")
			try:
				response = await client.post(OPENROUTER_URL, headers=headers, json=payload)
				response.raise_for_status()
				data = response.json()
			except httpx.HTTPError as e:
				print(f"[chat] OpenRouter request failed: {e}")
				return "Sorry, I couldn't reach my knowledge service right now. Please try again."

			choices = data.get("choices") or []
			if not choices:
				print(f"[chat] OpenRouter returned no choices: {data}")
				return "Sorry, I couldn't generate a response. Please try again."

			assistant_msg = choices[0].get("message") or {}
			tool_calls = assistant_msg.get("tool_calls") or []

			if not tool_calls:
				print(f"[chat] no tool calls on iteration #{iteration}, returning final reply")
				return assistant_msg.get("content") or "Sorry, I couldn't generate a response. Please try again."

			print(f"[chat] iteration #{iteration} produced {len(tool_calls)} tool call(s)")
			# Append the assistant's tool-call message verbatim, then resolve each call.
			chat_history.append(assistant_msg)
			for tc in tool_calls:
				fn = tc.get("function") or {}
				name = fn.get("name", "")
				args = chat_tools.parse_arguments(fn.get("arguments"))
				result = chat_tools.dispatch(name, args)
				print(
					f"[chat] >>> TOOL CALL: {name}({args}) -> "
					f"{len(result)} chars: {result[:200]!r}"
				)
				chat_history.append({
					"role": "tool",
					"tool_call_id": tc.get("id", ""),
					"content": result,
				})

	print(f"[chat] hit MAX_TOOL_ITERATIONS={MAX_TOOL_ITERATIONS}, giving up")
	return "I'm having trouble pulling that information together. Could you rephrase your question?"
