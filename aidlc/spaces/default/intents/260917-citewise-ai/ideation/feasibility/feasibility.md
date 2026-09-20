# Feasibility

## Technical

| Risk | Mitigation |
| --- | --- |
| PDF text layer missing | Clear error; TXT samples always work |
| No LLM key in preview | Extractive cited fallback |
| Embeddings + DynamoDB cost | BM25 in-process; no vector DB |
| Vercel serverless vs Python | Dual runtime: TS RAG in the web app, Python on Render |

## Schedule

MVP is the walking skeleton plus editorial UI plus AIDLC artefacts. Feasible in one construction pass.

## Cost

Grok is called only when the user asks. Retrieval is local CPU. Render free tier is enough for the API demo.
