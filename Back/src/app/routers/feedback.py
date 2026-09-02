import os
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from services.rate_limit import limiter

router = APIRouter(prefix="", tags=["feedback"])

CATEGORY_LABELS = {"bug": "Bug Report", "feedback": "General Feedback", "other": "Other"}
CATEGORY_COLORS = {"bug": 0xC41230, "feedback": 0x1F6FEB, "other": 0x6D6E71}

class FeedbackRequest(BaseModel):
	category: Literal["bug", "feedback", "other"]
	message: str = Field(min_length=1, max_length=2000)
	platform: str = Field(default="", max_length=40)

def build_discord_payload(req: FeedbackRequest, timestamp: str) -> dict:
	return {
		"username": "CMU Campus Explorer",
		"embeds": [{
			"title": CATEGORY_LABELS[req.category],
			"description": req.message.strip(),
			"color": CATEGORY_COLORS[req.category],
			"timestamp": timestamp,
			"footer": {"text": req.platform},
		}],
	}

@router.post("/feedback", status_code=204)
@limiter.limit("5/minute")
async def feedback(request: Request, req: FeedbackRequest):
	webhook = os.getenv("DISCORD_WEBHOOK_URL")
	if not webhook:
		raise HTTPException(status_code=503, detail="Feedback is not configured")
	from datetime import datetime, timezone
	payload = build_discord_payload(req, datetime.now(timezone.utc).isoformat())
	try:
		async with httpx.AsyncClient(timeout=10.0) as client:
			r = await client.post(webhook, json=payload)
			r.raise_for_status()
	except httpx.HTTPError as e:
		print(f"[feedback] webhook failed: {e!r}")
		raise HTTPException(status_code=502, detail="Could not deliver feedback")
