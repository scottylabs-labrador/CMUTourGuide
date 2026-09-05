"""Markdown knowledge base + BM25 search. Loaded once at import; see src/knowledge/README.md for the file format."""
import re
from dataclasses import dataclass, field
from pathlib import Path

import yaml
from rank_bm25 import BM25Okapi

KB_DIR = Path(__file__).resolve().parent.parent / "knowledge"
MAX_CHUNK_WORDS = 250
STOPWORDS = {"a", "an", "the", "and", "or", "of", "in", "on", "at", "to", "is", "are", "was", "were", "it", "its",
             "this", "that", "for", "with", "by", "as", "be", "do", "does", "what", "where", "when", "who", "how",
             "i", "me", "my", "you", "your", "can", "tell", "about", "there", "here", "have", "has"}
_TOKEN = re.compile(r"[a-z0-9]+")


@dataclass
class Doc:
	id: str
	title: str
	type: str
	body: str
	aliases: list[str] = field(default_factory=list)
	sources: list[str] = field(default_factory=list)


@dataclass
class Chunk:
	doc_id: str
	title: str
	section: str
	body: str
	search_text: str  # body + title + aliases, what BM25 indexes


def tokenize(text: str) -> list[str]:
	return [t for t in _TOKEN.findall(text.lower()) if t not in STOPWORDS]


def parse_doc(path: Path) -> Doc:
	raw = path.read_text(encoding="utf-8")
	m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.S)
	meta = yaml.safe_load(m.group(1)) or {} if m else {}
	body = (m.group(2) if m else raw).strip()
	body = re.sub(r"^# .*\n", "", body + "\n", count=1).strip()  # drop the H1, title comes from frontmatter
	return Doc(id=str(meta.get("id", path.stem)), title=str(meta.get("title", path.stem)), type=str(meta.get("type", "doc")),
	           body=body, aliases=[str(a) for a in (meta.get("aliases") or []) if a],
	           sources=[str(s) for s in (meta.get("sources") or []) if str(s).startswith("http")])


def chunk_doc(doc: Doc) -> list[Chunk]:
	# split on ## headings; docs without headings (blog posts) become one "Overview" section
	parts = re.split(r"^## (.+)$", doc.body, flags=re.M)
	sections = ([("Overview", parts[0])] if parts[0].strip() else []) + list(zip(parts[1::2], parts[2::2]))
	prefix = f"{doc.title} {' '.join(doc.aliases)} {doc.id}"
	out: list[Chunk] = []
	for name, text in sections:
		buf: list[str] = []
		n = 0
		# group paragraphs up to MAX_CHUNK_WORDS so long sections still chunk sensibly
		for p in (p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()):
			w = len(p.split())
			if buf and n + w > MAX_CHUNK_WORDS:
				out.append(Chunk(doc.id, doc.title, name.strip(), "\n\n".join(buf), f"{prefix} {name} {' '.join(buf)}"))
				buf, n = [], 0
			buf.append(p)
			n += w
		if buf:
			out.append(Chunk(doc.id, doc.title, name.strip(), "\n\n".join(buf), f"{prefix} {name} {' '.join(buf)}"))
	return out


BUILDING_TYPES = ("building", "landmark")


class Knowledge:
	def __init__(self, root: Path = KB_DIR):
		paths = [p for p in sorted(root.rglob("*.md")) if p.name != "README.md"]
		self.docs: dict[str, Doc] = {}
		for p in paths:
			d = parse_doc(p)
			self.docs[d.id] = d
		self.chunks: list[Chunk] = [c for d in self.docs.values() for c in chunk_doc(d)]
		self._bm25 = BM25Okapi([tokenize(c.search_text) for c in self.chunks])

	def get(self, doc_id: str) -> Doc | None:
		return self.docs.get(doc_id)

	def ids(self, *types: str) -> list[str]:
		return [d.id for d in self.docs.values() if not types or d.type in types]

	def building(self, doc_id: str) -> Doc | None:
		doc = self.docs.get(doc_id)
		return doc if doc and doc.type in BUILDING_TYPES else None

	def building_ids(self) -> list[str]:
		return self.ids(*BUILDING_TYPES)

	def search(self, query: str, k: int = 5) -> list[tuple[Chunk, float]]:
		scores = self._bm25.get_scores(tokenize(query))
		top = sorted(range(len(scores)), key=lambda i: -scores[i])[:k]
		return [(self.chunks[i], float(scores[i])) for i in top if scores[i] > 0]

	@staticmethod
	def format_doc(doc: Doc) -> str:
		"""Whole document as LLM context (used for the current building)."""
		src = f"\nSources: {', '.join(doc.sources)}" if doc.sources else ""
		return f"{doc.type.upper()}: {doc.title}\n\n{doc.body}{src}"

	@staticmethod
	def format_results(results: list[tuple[Chunk, float]]) -> str:
		if not results:
			return "No matching information in the knowledge base. Try different keywords."
		blocks = []
		for c, _ in results:
			src = next(iter(KB.docs[c.doc_id].sources), None)
			blocks.append(f"[{c.doc_id}] {c.title} — {c.section}\n{c.body}" + (f"\n(source: {src})" if src else ""))
		return "\n\n---\n\n".join(blocks)


KB = Knowledge()
