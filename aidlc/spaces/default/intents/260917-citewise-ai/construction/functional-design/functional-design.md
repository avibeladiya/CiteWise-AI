# Functional Design

## Upload

1. Validate type and size (PDF/TXT, 10 MB, 20 pages).
2. Show pipeline stages: extract → chunk → index → ready.
3. Store pages/chunks in Zustand (web) or process memory (Render API).

## Ask

1. BM25 over chunks for the selected document.
2. POST top chunks + question to `askCitewise` (or Render `/query`).
3. Parse JSON; on failure, extractive fallback from the same chunks.
4. Render `CitedText`; open the sources rail on the first citation.

## Live demo

The landing primary action indexes `Acme Q3 2026 Financial Report.txt` and enqueues the question “What was Q3 operating margin?”. Workspace drains that pending question once the document is `ready`.

## UI

- Landing: issue bar, specimen, drop zone, samples, grounded vs ungrounded, pipeline, AIDLC strip.
- Workspace: library | conversation | evidence. Empty library and empty chat both offer the specimens.
- Method: pipeline, retrieval parameters, citation contract, forbidden list, deploy, AIDLC.
