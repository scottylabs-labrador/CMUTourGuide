# CMU Tour Guide Backend (FastAPI)

## Overview

FastAPI backend for the CMU Explorer app:

- GET `/health` – health check
- POST `/chat` – tour-guide chat. Agentic tool loop (`routers/chat.py`) over the markdown knowledge base, model via OpenRouter, traced to PostHog
- POST `/vision` – building recognition, proxies to the Modal CLIP endpoint and applies a confidence threshold
- POST `/feedback` – relays in-app feedback to Discord

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cd src && uvicorn app.main:app --reload --port 8000
```

Docs at `http://localhost:8000/docs`. Tests: `pytest tests` from `Back/`.

## Environment

| Variable | Purpose |
|---|---|
| `OPENROUTER_API_KEY` | chat model access (required) |
| `VISION_MIN_CONFIDENCE` | reject scans below this (default 0.6) |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME` | scanned-photo inbox |
| `DISCORD_WEBHOOK_URL` | feedback relay |
| `POSTHOG_PROJECT_TOKEN`, `POSTHOG_HOST` | LLM tracing; tracing is disabled when unset |
| `POSTHOG_DEBUG=1` | log every PostHog batch (local debugging) |

## Project structure

```
Back/
├── requirements.txt / requirements-dev.txt
├── railway.json                  # deploy: uvicorn from src/
├── tests/
└── src/
    ├── knowledge/                # markdown knowledge base (see its README)
    ├── app/
    │   ├── main.py               # app, CORS, rate limiter, routers
    │   └── routers/              # chat.py, vision.py, feedback.py, health.py
    └── services/
        ├── knowledge.py          # loads + chunks markdown, BM25 search
        ├── chat_tools.py         # tool schemas + dispatch (search_campus_info, get_building_info)
        ├── tracing.py            # PostHog $ai_trace / $ai_span helpers
        ├── rate_limit.py
        └── s3Services.py
```

## Data

`src/knowledge/` holds the chatbot's knowledge base as markdown (buildings, campus topics, blog posts). See `src/knowledge/README.md` for the file format. It is indexed with BM25 at startup (`services/knowledge.py`) and exposed to the model as the `search_campus_info` and `get_building_info` tools.

## Testing locally

```bash
curl http://localhost:8000/health

curl -X POST http://localhost:8000/chat -H "Content-Type: application/json" \
  -d '{"messages":[{"id":"1","text":"Who founded CMU?","isUser":true,"timestamp":"2026-01-01T00:00:00Z"}],"building_id":null}'
```

## Mobile integration (Expo dev)

- Use your machine's LAN IP instead of localhost in the Expo app, e.g. `http://192.168.1.10:8000/chat`.
- Ensure the device and your machine are on the same network.
