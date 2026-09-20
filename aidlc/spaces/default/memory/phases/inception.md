# Inception Phase Guardrails

## Focus

- Domain: Document, Chunk, Citation, Answer, Query.
- Contract: upload → ready document; query → answer + citations[].
- Units: extract, chunk, retrieve, generate, workspace UI.

## Evidence Standards

- Requirements use EARS. Each story has a testable acceptance criterion.

## Scope Discipline

- One retrieval algorithm (BM25). One generation contract (JSON with [n] markers).
- Two deploy targets: Vercel web, Render API.
