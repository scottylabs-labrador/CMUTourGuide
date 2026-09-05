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

`src/knowledge/` holds the chatbot's knowledge base as markdown (buildings, campus topics, blog posts). See `src/knowledge/README.md` for the file format. It is indexed with BM25 at startup (`services/knowledge.py`) and exposed to the model as the `search_campus_info` and `get_building_info` tools.

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
