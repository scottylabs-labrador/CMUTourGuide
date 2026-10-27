import re

from fastapi import APIRouter, Request, Response

from services.knowledge import KB, Doc
from services.rate_limit import limiter

router = APIRouter(tags=["blog"])

_SUBTITLE = re.compile(r"^_([^\n]+)_\s*\n")  # italic first line under the H1


def to_post(doc: Doc) -> dict:
	m = _SUBTITLE.match(doc.body)
	return {
		"id": doc.id,
		"title": doc.title,
		"subtitle": m.group(1) if m else "",
		"author": str(doc.meta.get("author", "")),
		"date": str(doc.meta.get("date", "")),
		"category": str(doc.meta.get("category", "")),
		"image": str(doc.meta.get("image", "")),
		"content": doc.body[m.end():].strip() if m else doc.body,
	}


# Built once from the knowledge base; new posts ship with a redeploy
POSTS = sorted((to_post(KB.docs[i]) for i in KB.ids("blog")), key=lambda p: p["date"], reverse=True)


@router.get("/blog")
@limiter.limit("30/minute")
async def blog(request: Request, response: Response):
	response.headers["Cache-Control"] = "public, max-age=3600"
	return POSTS
