# Requirements

## Functional (EARS)

- **REQ-01** When the user provides a PDF or TXT ≤ 10 MB and ≤ 20 pages, the system shall extract page text and produce overlapping chunks.
- **REQ-02** When extraction yields no text, the system shall mark the document failed and show the reason.
- **REQ-03** When the user asks a question against a ready document, the system shall retrieve the top matching chunks with BM25.
- **REQ-04** When chunks are retrieved, the system shall generate an answer that uses only those chunks and includes inline `[n]` markers.
- **REQ-05** When the LLM is unavailable, the system shall return an extractive answer still tagged with citations.
- **REQ-06** When the user clicks a citation marker, the system shall highlight the corresponding quote and page number.
- **REQ-07** The system shall offer at least two sample documents that can be indexed without a local file.
- **REQ-08** The Python API shall expose `/upload` and `/documents/{id}/query` for Render.

## Non-functional

- **NFR-01** Preview and production UI render on 390px and desktop without horizontal overflow.
- **NFR-02** No API keys in client bundles.
- **NFR-03** Ask is user-initiated; no generation on page load.
- **NFR-04** Typecheck and production build pass.
