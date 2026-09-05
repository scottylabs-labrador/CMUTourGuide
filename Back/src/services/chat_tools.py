import json
from typing import Any

from services.knowledge import KB

SEARCH_RESULTS = 5


def _get_building_info_tool() -> dict[str, Any]:
	valid_ids = ", ".join(KB.building_ids())
	return {
		"type": "function",
		"function": {
			"name": "get_building_info",
			"description": (
				"Get the full knowledge-base entry for a CMU building by its ID. Use this when the user asks "
				"about a specific building OTHER than the one in the current building context."
			),
			"parameters": {
				"type": "object",
				"properties": {
					"building_id": {
						"type": "string",
						"description": f"The building ID. Must be one of: {valid_ids}",
					}
				},
				"required": ["building_id"],
			},
		},
	}


def _search_tool() -> dict[str, Any]:
	return {
		"type": "function",
		"function": {
			"name": "search_campus_info",
			"description": (
				"Keyword search over the CMU knowledge base: every building, campus history, traditions "
				"(Scotty, the Fence, Spring Carnival, Buggy), dining, visiting and tours, parking and transit, "
				"Pittsburgh, and student blog posts about campus life and admissions. Use it for anything not "
				"answered by the current building context. Use specific nouns; if the results miss, search "
				"again with different words."
			),
			"parameters": {
				"type": "object",
				"properties": {
					"query": {"type": "string", "description": "A few keywords or a short question"},
				},
				"required": ["query"],
			},
		},
	}


TOOLS: list[dict[str, Any]] = [_get_building_info_tool(), _search_tool()]


def dispatch(name: str, arguments: dict[str, Any]) -> str:
	"""Execute a tool call by name and return a string result for the LLM."""
	if name == "get_building_info":
		building_id = arguments.get("building_id", "")
		record = KB.building(building_id)
		if record is None:
			return f"No building found with id '{building_id}'. Valid IDs are: {', '.join(KB.building_ids())}"
		return KB.format_doc(record)
	if name == "search_campus_info":
		return KB.format_results(KB.search(str(arguments.get("query", "")), SEARCH_RESULTS))
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
