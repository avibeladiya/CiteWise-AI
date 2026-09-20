# Domain Model

```
Document 1──* Chunk
Query     *──1 Document
Answer    1──* Citation
Citation  *──1 Chunk
```

## Aggregates

- **Document** — `document_id`, name, status, page_count, chunk_count, file_size, created_at
- **Chunk** — chunk_index, page_number, text, char_start, char_end, score?
- **Citation** — citation_number, page_number, chunk_index, quote, score?
- **Answer** — text with `[n]`, citations[], chunks_used, latency_ms, grounded

## Invariants

- A ready Document has chunk_count > 0.
- Citation.chunk_index refers to a retrieved chunk.
- Answer text may only assert facts present in retrieved chunks.
