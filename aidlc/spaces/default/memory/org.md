# Organisation Rules

> Organisation-wide policy for the CiteWise AI-DLC workspace.

## Way of Working

- Ship a working product before expanding scope.
- Artefacts stay traceable: every requirement maps to a user story, unit, and test.
- Prefer evidence over assertion. Claims about the system must be demonstrable in the running app.

## Walking Skeleton

- A visitor can drop a PDF or TXT, see it index, ask a question, and inspect a page-level quote.

## Testing Posture

- Typecheck and production build must pass.
- Browser smoke covers landing and workspace on desktop and mobile.
- Grounding is verified by asking a sample document a known question and checking the citation quote exists in the source.

## Deployment

- Web app deploys to Vercel (Nitro `vercel` preset).
- Optional Python RAG API deploys to Render via `render.yaml`.
- No secrets in the repo. `XAI_API_KEY` is server-only.

## Forbidden

- NEVER invent a citation that was not retrieved.
- NEVER send the raw document to the model — only retrieved chunks.
- NEVER store API keys in client bundles.

## Mandated

- ALWAYS return page number + verbatim quote with every sourced answer.
- ALWAYS degrade to extractive cited answers if the LLM is unavailable.
