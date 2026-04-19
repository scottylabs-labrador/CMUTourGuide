import json
from typing import Any

from services import buildings_kb


def _get_building_info_tool() -> dict[str, Any]:
	valid_ids = ", ".join(buildings_kb.list_building_ids())
	return {
		"type": "function",
		"function": {
			"name": "get_building_info",
			"description": (
				"Get factual info (summary and official tour guide script) about a CMU "
				"building by its ID. Use this ONLY when the user asks about a building "
				"OTHER than the one currently in the system prompt. The current "
				"building's full info is already provided to you and does not need to "
				"be fetched."
			),
			"parameters": {
				"type": "object",
				"properties": {
					"building_id": {
						"type": "string",
						"description": (
							"The building ID. Must be one of the valid CMU "
							f"building IDs: {valid_ids}"
						),
					}
				},
				"required": ["building_id"],
			},
		},
	}


TOOLS: list[dict[str, Any]] = [_get_building_info_tool()]


def dispatch(name: str, arguments: dict[str, Any]) -> str:
	"""Execute a tool call by name and return a string result for the LLM."""
	if name == "get_building_info":
		building_id = arguments.get("building_id", "")
		record = buildings_kb.get_building(building_id)
		if record is None:
			valid = ", ".join(buildings_kb.list_building_ids())
			return (
				f"No building found with id '{building_id}'. "
				f"Valid IDs are: {valid}"
			)
		return buildings_kb.format_building_context(record)
	return f"Unknown tool: {name}"


def parse_arguments(raw: str | dict[str, Any] | None) -> dict[str, Any]:
	"""OpenRouter returns tool call arguments as a JSON-encoded string."""
	if raw is None:
		return {}
	if isinstance(raw, dict):
		return raw
	try:
		return json.loads(raw)
	except (json.JSONDecodeError, TypeError):
		return {}
