# Architecture

CiteWise runs as two cooperating runtimes that share one RAG contract.

```
┌─────────────────────────────────────────┐
│  Vercel — TanStack Start                │
│  Browser: extract, chunk, BM25          │
│  Server fn: Grok JSON citations         │
└─────────────────────────────────────────┘
                 optional VITE_API_URL
┌─────────────────────────────────────────┐
│  Render — FastAPI                       │
│  pypdf → chunk → BM25 → Grok / extractive│
└─────────────────────────────────────────┘
```

## Why BM25, not embeddings

The MVP must deploy without DynamoDB, Bedrock, or a vector store. BM25 is deterministic, inspectable, and good enough for short professional documents. Scores appear on evidence cards.

## Citation contract

The model may only answer from numbered sources. Output is JSON:

```json
{
  "answer": "Operating margin improved to 18.4% [1].",
  "citations": [
    { "citation_number": 1, "page_number": 1, "chunk_index": 0, "quote": "…" }
  ]
}
```

Invalid JSON falls back to extractive quotes from the same chunks — still cited.

## Persistence

- Web: Zustand + localStorage (documents stay on the device).
- API: in-memory (Render disks are ephemeral). Fine for demos; not a multi-tenant store.
