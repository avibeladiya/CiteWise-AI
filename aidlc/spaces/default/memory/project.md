# Project-Level Rules

## Way of Working

CiteWise AI is a grounded document Q&A product. The differentiator is auditability: every claim is tied to a page and a verbatim quote.

## Walking Skeleton

1. Upload or sample load.
2. Extract pages (pdf.js in browser, pypdf on Render).
3. Chunk ~180 words with 30-word overlap.
4. BM25 retrieve top 5.
5. Generate JSON `{ answer, citations[] }` with inline `[n]`.
6. Click `[n]` to highlight the quote in the sources rail.

## Testing Posture

- Sample financial report: “What was Q3 operating margin?” must cite 18.4%.
- Sample ML paper: “How does gradient descent update weights?” must cite the gradient step.

## Deployment

- Vercel: `npm run build` (Nitro vercel preset).
- Render: root directory `backend`, `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- Optional `VITE_API_URL` points the web app at Render.

## Tech Stack

- Web: TanStack Start, React 19, Tailwind v4, Zustand, pdf.js, xAI Grok.
- API: Python 3.12, FastAPI, pypdf, BM25, xAI Grok.

## Decided

- DECIDED: BM25 lexical retrieval instead of embeddings for the MVP (Stage inception, 2026-09-17). No vector DB required; works offline; citations stay inspectable.
- DECIDED: Dual runtime — browser RAG for the Vercel app, Python RAG for Render (Stage inception, 2026-09-17).
- DECIDED: Extractive fallback when `XAI_API_KEY` is absent (Stage construction, 2026-09-17).
- DECIDED: Editorial visual language (Newsreader + Outfit, ink/paper) not generic AI purple (Stage construction, 2026-09-17).

## Forbidden

- NEVER use outside knowledge in generated answers.
- NEVER ship a chat UI without a sources panel.

## Mandated

- ALWAYS cap uploads at 10 MB / 20 pages.
- ALWAYS keep AIDLC artefacts under `aidlc/` and `.kiro/`.
