# Code Generation

CiteWise is generated as two deployable units from the same RAG contract.

## Web (Vercel)

| Unit | Path | Responsibility |
| --- | --- | --- |
| U-01 Extract | `src/lib/rag/extract.ts` | PDF.js / TXT → pages |
| U-02 Chunk | `src/lib/rag/chunk.ts` | ~180 word windows, 30 word overlap, page ids |
| U-03 Retrieve | `src/lib/rag/retrieve.ts` | BM25 (k1=1.5, b=0.75, top 5) |
| U-04 Generate | `src/lib/citewise/ask.ts` | Grok JSON contract + extractive fallback |
| U-05 Workspace | `src/routes/workspace.tsx` | Library, chat, evidence rail |
| U-06 Landing | `src/routes/index.tsx` | Masthead, specimen, live Q3 demo |
| U-08 Method | `src/routes/method.tsx` | Pipeline, forbidden list, deploy |

Client indexing keeps the class demo self-contained. Generation is a TanStack Start server function so `XAI_API_KEY` never reaches the browser.

## API (Render)

| Unit | Path | Responsibility |
| --- | --- | --- |
| U-07 API | `backend/main.py` | `POST /upload`, `POST /query`, `GET /health` |
| Shared RAG | `backend/rag.py` | pypdf extract, BM25, Grok |

Optional. Set `VITE_API_URL` to the Render origin to swap the Python pipeline in.

## Citation contract

```json
{
  "answer": "… [1]",
  "citations": [
    { "citation_number": 1, "page_number": 1, "chunk_index": 0, "quote": "…" }
  ]
}
```

Invalid JSON, missing key, or empty answer falls back to extractive quotes from the same retrieved chunks. The product never invents a source it did not retrieve.
