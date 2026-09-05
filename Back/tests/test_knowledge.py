from services.knowledge import KB, chunk_doc, Doc, MAX_CHUNK_WORDS
from services import chat_tools


def top_doc_ids(query, k=3):
	return [c.doc_id for c, _ in KB.search(query, k)]


def test_loads_all_collections():
	assert len(KB.ids("building", "landmark")) == 25
	assert len(KB.ids("campus")) >= 8
	assert len(KB.ids("blog")) >= 40


def test_history_question_hits_campus_history():
	assert top_doc_ids("who founded carnegie mellon and in what year")[0] == "campus-history"


def test_alias_search_finds_building():
	assert top_doc_ids("Maggie Mo")[0] == "MM"


def test_dining_in_building():
	assert "WEH" in top_doc_ids("coffee in Wean Hall")


def test_no_match_returns_empty():
	assert KB.search("zzzz qqqq") == []


def test_chunks_respect_size_and_sections():
	doc = Doc(id="x", title="X", type="campus", body="## A\n\n" + "\n\n".join(["word " * 100] * 5) + "\n\n## B\n\nshort")
	chunks = chunk_doc(doc)
	assert [c.section for c in chunks].count("B") == 1
	assert all(len(c.body.split()) <= MAX_CHUNK_WORDS + 100 for c in chunks)  # one paragraph may overflow


def test_search_tool_dispatch_formats_results():
	out = chat_tools.dispatch("search_campus_info", {"query": "Buggy race Schenley Park"})
	assert "[campus-buggy]" in out and "source:" in out


def test_building_tool_still_works():
	out = chat_tools.dispatch("get_building_info", {"building_id": "GHC"})
	assert out.startswith("BUILDING: Gates and Hillman Centers")
	assert "No building found" in chat_tools.dispatch("get_building_info", {"building_id": "NOPE"})
