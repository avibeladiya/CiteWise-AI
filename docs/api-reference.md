# API reference (Render)

Base origin from `VITE_API_URL`.

| Method | Path | Body | Result |
| --- | --- | --- | --- |
| GET | `/health` | | `{ status, service, version }` |
| POST | `/upload` | multipart `file` | document metadata, 201 |
| GET | `/documents` | | `{ documents: [] }` |
| GET | `/documents/{id}` | | document |
| DELETE | `/documents/{id}` | | `{ deleted }` |
| POST | `/documents/{id}/query` | `{ "question" }` | `{ answer, citations, chunks_used, latency_ms, grounded }` |
| POST | `/ask` | `{ "question", "document_id" }` | same |

Errors: 400 validation / processing, 404 unknown document.

Citation object: `citation_number`, `page_number`, `chunk_index`, `quote`, optional `score`.
