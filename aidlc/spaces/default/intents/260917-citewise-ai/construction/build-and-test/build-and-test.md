# Build and Test

## Web

- `npm run typecheck` — TypeScript, no emit
- `npm run build` — Vite + Nitro Vercel output
- Browser smoke on `/`, `/method`, `/workspace`
- Live demo: index Acme Q3 → ask operating margin → citation `[1]` opens page-1 quote
- Fallback: with no `XAI_API_KEY`, extractive answer still cites retrieved chunks

## API

- `uvicorn main:app` from `backend/`
- `GET /health` → `{ "status": "ok" }`
- `POST /upload` with sample TXT → document `ready`
- `POST /query` with a grounded question → JSON citations

## Deploy gates

| Target | Config | Command |
| --- | --- | --- |
| Vercel | `vercel.json`, Nitro preset | `npm run build` |
| Render | `render.yaml`, `backend/` | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

## Acceptance (MVP)

1. Upload PDF/TXT ≤ 10 MB, ≤ 20 pages.
2. Sample documents index without a network call.
3. Every assistant claim that states a figure carries `[n]`.
4. Evidence rail shows page + verbatim quote.
5. Light and dark themes remain readable.
6. Mobile (390px) has no horizontal overflow; library and sources are drawers.
