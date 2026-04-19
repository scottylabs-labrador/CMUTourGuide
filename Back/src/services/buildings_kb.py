import json
from pathlib import Path
from typing import Optional

# buildings.json is vendored from Front/TourGuide/data/buildings.json.
# Keep both copies in sync until we unify on a single source of truth.
_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "buildings.json"

with _DATA_PATH.open("r", encoding="utf-8") as f:
	_BUILDINGS: dict[str, dict] = json.load(f)


def get_building(building_id: str) -> Optional[dict]:
	return _BUILDINGS.get(building_id)


def list_building_ids() -> list[str]:
	return list(_BUILDINGS.keys())


def format_building_context(record: dict) -> str:
	"""Render a building record as a context block for the LLM.

	Used both for pre-injecting the current building into the system prompt
	and as the return value of the get_building_info tool, so the LLM sees
	the same shape regardless of how it acquired the data.
	"""
	title = record.get("title", "Unknown building")
	summary = record.get("summary") or []

	if isinstance(summary, list):
		summary_text = "\n".join(summary)
	else:
		summary_text = str(summary)

	parts = [f"BUILDING: {title}"]
	if summary_text.strip():
		parts.append(f"\nSUMMARY (canonical source of truth):\n{summary_text}")
	return "\n".join(parts)
