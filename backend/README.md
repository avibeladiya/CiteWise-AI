# CiteWise API (Render)

Python 3.12 FastAPI service. Extract → chunk → BM25 retrieve → grounded generate.

## Run locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export XAI_API_KEY=...   # optional; extractive fallback works without it
uvicorn main:app --reload --port 8000
```

## Render

This folder is the Render root (`render.yaml` at the repo root). Set:

- `XAI_API_KEY` — xAI key for Grok generation
- `CORS_ORIGINS` — your Vercel origin, e.g. `https://citewise.vercel.app`

Without an LLM key the API still returns cited extractive answers from retrieved passages.

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness |
| POST | `/upload` | Multipart PDF/TXT |
| GET | `/documents` | List |
| GET | `/documents/{id}` | Poll |
| DELETE | `/documents/{id}` | Remove |
| POST | `/documents/{id}/query` | `{ "question": "..." }` |
