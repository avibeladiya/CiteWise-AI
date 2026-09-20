# Team-Level Rules

## Way of Working

- AI-DLC MVP scope. Intent → Inception → Construction → Operation in one pass.
- One product owner (Avi Beladiya). Review gates are self-review with written artefacts.

## Walking Skeleton

- Client-side extract/chunk/BM25 plus a server function for Grok generation.
- Python FastAPI mirror for Render so the original RAG pipeline still deploys independently.

## Testing Posture

- `npm run typecheck` and `npm run build`.
- Interactive path: index sample → ask → open evidence.

## Deployment

- Vercel for the TanStack Start app.
- Render Blueprint for `backend/`.

## Code Style

- Named exports.
- Tokens in `src/styles.css` `@theme`; no ad-hoc hex in new JSX.
- Server functions in `src/lib/**/*.server.ts`.

## Forbidden

- NEVER call xAI from the browser.
- NEVER persist personal documents on a shared server without consent (preview uses localStorage).

## Mandated

- ALWAYS keep citation markers clickable.
- ALWAYS show empty, loading, and error states in the workspace.
