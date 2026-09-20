# Operation Phase Guardrails

## Focus

- Vercel hosts the web app. Render hosts the optional API.
- Health: `GET /health` on the API. Web app must render on cold start.

## Observability

- Latency is shown on each answer (`latency_ms`).
- Failures toast with a human message; the thread records an error bubble.

## Incident

- If Grok is down, extractive fallback still answers from retrieved quotes.
- If a PDF has no text layer, surface “No text could be extracted”.
