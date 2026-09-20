# Construction Phase Guardrails

## Focus

- Implement the walking skeleton first, then polish the desk UI.
- Generation is user-initiated and capped (`max_tokens` 700, temperature 0).

## Evidence Standards

- A sourced answer must include at least one citation with page + quote, or an explicit “not in document” statement.

## Code Style

- Keep RAG primitives pure (no UI imports) so Python and TypeScript stay aligned.
