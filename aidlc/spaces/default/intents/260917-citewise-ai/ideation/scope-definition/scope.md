# Scope Definition — MVP

## In

- PDF and TXT upload (browser + Python)
- Page-aware overlapping chunks
- BM25 retrieval (top 5)
- Grounded generation (Grok) with JSON citation contract
- Extractive fallback
- Landing, workspace (library / chat / sources), method page
- Sample documents
- `render.yaml` + Vercel-ready web build
- Full AIDLC folder tree (`.kiro/`, `aidlc/`)

## Out

- User accounts, OCR, embeddings, multi-tenant storage, mobile native apps

## Constraints

- Upload cap 10 MB, 20 pages
- Temperature 0, `max_tokens` 700
- Documents live in memory (API) or localStorage (web)
