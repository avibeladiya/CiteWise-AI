# CiteWise AI

Grounded document Q&A. Upload a PDF or TXT, ask a question, and every claim comes back with a page number and a verbatim quote.

This is an **AI-DLC** submission: intent, requirements, architecture, and construction artefacts live under `aidlc/` and `.kiro/`. The product itself is a working RAG system with a Vercel web app and a Render Python API.

## What it does

1. **Extract** — PDF/TXT, page by page, in the browser (and again in Python on Render).
2. **Chunk** — overlapping passages (~180 words, 30-word overlap).
3. **Retrieve** — BM25 ranks the passages that match the question.
4. **Generate** — Grok writes an answer that may only use those passages, forced into citation JSON.
5. **Audit** — click `[1]` to jump to the quote in the sources rail.

If no LLM key is present, CiteWise still answers from the retrieved quotes (extractive fallback). The product never invents a source it did not retrieve.

## Architecture

```
┌──────────────────────────┐     ┌─────────────────────────────┐
│  Web app (Vercel)        │     │  API (Render, optional)     │
│  TanStack Start + React  │     │  FastAPI · Python 3.12      │
│  Client extract + BM25   │     │  pypdf · BM25 · Grok        │
│  Server fn → xAI Grok    │     │  POST /upload  /query       │
└──────────────────────────┘     └─────────────────────────────┘
```

The live web app is self-contained: indexing happens locally, generation is a server function. Point `VITE_API_URL` at the Render service if you want the Python pipeline instead.

## Folder map

```
citewise-ai/
├── src/                    # TanStack Start UI + RAG client
├── backend/                # FastAPI service (Render)
├── samples/                # Demo documents
├── public/samples/         # Same files, served to the UI
├── docs/                   # Architecture, API, RAG, deploy
├── aidlc/                  # AI-DLC memory, phases, intent record
├── .kiro/                  # Harness, specs, steering (Flappy-Kiro layout)
├── render.yaml             # Render Blueprint
├── vercel.json             # Vercel install/build
└── README.md
```

## Run the web app

```bash
npm install
npm run dev
```

Open the preview, drop a file or click **Index this sample**, then ask:

- “What was Q3 operating margin?”
- “How does gradient descent update weights?”
- “What is RAG and why does it reduce hallucination?”

Read the pipeline on the **Method** page.

## Deploy

### Vercel (web)

Connect the repo. Build command `npm run build`. The Vite config already emits a Vercel output via Nitro. Optional env:

- `XAI_API_KEY` — Grok generation (server-only)
- `VITE_API_URL` — Render origin if you want the Python API

### Render (Python API)

Use the Blueprint in `render.yaml`, or:

- Root directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Env: `XAI_API_KEY`, `CORS_ORIGINS=https://your-app.vercel.app`

## AI-DLC

Built through Intent → Inception → Construction → Operation, using the same Kiro harness layout as [Flappy-Kiro-AIDLC](https://github.com/avibeladiya/Flappy-Kiro-AIDLC). Start at:

- [Intent](aidlc/spaces/default/intents/260917-citewise-ai/ideation/intent-capture/intent-statement.md)
- [Requirements](aidlc/spaces/default/intents/260917-citewise-ai/inception/requirements-analysis/requirements.md)
- [Architecture](docs/architecture.md)
- [Steering](.kiro/steering/product.md)
- [State](aidlc/spaces/default/intents/260917-citewise-ai/aidlc-state.md)

## License

MIT
