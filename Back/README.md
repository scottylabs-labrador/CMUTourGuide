# CMU Tour Guide Backend (FastAPI)

## Overview

FastAPI backend with two endpoints:

- GET `/health` – health check
- POST `/chat` – returns a hardcoded reply: `"Hello World"`

## Setup

1. Create and activate a virtual environment (optional but recommended)

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies

```bash
pip install -r requirements.txt
```

3. Run the server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

4. Open API docs

```
http://localhost:8000/docs
```

## Environment

Copy `.env.example` to `.env` and adjust as needed.

## Project Structure

```
Back/
├── requirements.txt
├── .env.example
├── README.md
├── scripts/
│   ├── merge_pdf_facts.py        # appends curated PDF research into buildings.json
│   └── data/
│       └── pdf_facts_raw.txt     # verbatim PDF extract (source of truth for the merge)
└── src/
    ├── data/
    │   └── buildings.json        # building knowledge base (see "Data" below)
    └── app/
        ├── main.py
        ├── config.py
        ├── routers/
        │   ├── health.py
        │   └── chat.py
        ├── schemas/
        │   └── chat.py
        ├── services/
        │   ├── ai.py
        │   ├── vision.py
        │   ├── buildings_kb.py   # loads buildings.json, formats context blocks
        │   └── chat_tools.py     # OpenRouter tool schema + dispatch
        └── middleware/
            └── cors.py
```

## Data

`src/data/buildings.json` is the chatbot's building knowledge base. It is a
**derived** file built in two steps:

1. Slim the client's `Front/TourGuide/data/buildings.json` down to `title` +
   `summary` (with `tour_guide` merged into `summary`). One-shot script:

   ```bash
   python3 - <<'PY'
   import json, pathlib
   src = pathlib.Path("../Front/TourGuide/data/buildings.json")
   dst = pathlib.Path("src/data/buildings.json")
   data = json.loads(src.read_text())
   slim = {}
   for bid, rec in data.items():
       summary = list(rec.get("summary") or [])
       tour_guide = rec.get("tour_guide")
       if isinstance(tour_guide, list):
           summary.extend(tour_guide)
       elif isinstance(tour_guide, str) and tour_guide.strip():
           summary.append(tour_guide)
       slim[bid] = {"title": rec["title"], "summary": summary}
   dst.write_text(json.dumps(slim, indent=2, ensure_ascii=False) + "\n")
   PY
   ```

2. Append cross-verified tour-guide research from the PDF extract:

   ```bash
   python3 scripts/merge_pdf_facts.py
   ```

   The merge script is **idempotent** — it detects a sentinel paragraph
   (`"Additional tour-guide research..."`) and rewrites everything after it,
   so it's safe to re-run after step 1.

## Testing locally

```bash
# health
curl http://localhost:8000/health

# chat
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hi"}'
```

## Mobile integration (Expo dev)

- Use your machine's LAN IP instead of localhost in the Expo app, e.g. `http://192.168.1.10:8000/chat`.
- Ensure the device and your machine are on the same network.
