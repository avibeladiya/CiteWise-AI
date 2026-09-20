# Intent Statement

## Sources
- [desc] Initial description: "Rebuild CiteWise AI frontend, keep Python RAG, use Flappy-Kiro AIDLC folder structure, deploy on Render and Vercel, win the AI-DLC class."
- [scope] Workflow-selected scope: `mvp`.
- [memory:M1] `aidlc/spaces/default/memory/project.md#Walking Skeleton`: "A visitor can drop a PDF or TXT, see it index, ask a question, and inspect a page-level quote."

## Problem

Knowledge workers paste a PDF into a chatbot and receive fluent answers they cannot audit. In finance, research, and legal review that is unacceptable: a missing page number is a risk, not a cosmetic gap.

## User

A student, analyst, or reviewer who already has the document and needs a **grounded** answer — page, quote, claim aligned.

## Outcome

CiteWise indexes the file, retrieves the passages that match the question, and writes an answer whose every factual claim is marked `[n]` and backed by a verbatim quote.

## Success metrics

| Metric | Target |
| --- | --- |
| Time to first sourced answer on a sample | < 30 seconds |
| Citation precision | Every `[n]` maps to a retrieved chunk |
| Fallback | Extractive cited answer works with no LLM key |
| Deploy | Vercel web + Render API from this repo |

## Non-goals (this MVP)

Accounts, OCR of scanned images, embeddings/vector DB, multi-document join queries.
