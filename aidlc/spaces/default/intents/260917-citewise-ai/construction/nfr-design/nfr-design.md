# NFR Design

| NFR | Design |
| --- | --- |
| Security | `XAI_API_KEY` server-only; CORS allowlist on Render |
| Performance | Local retrieval; generation capped; 20-page cap |
| Reliability | Extractive fallback; health endpoint |
| Accessibility | Button cursor, focus rings, 44px targets, reduced motion |
| Portability | Dual runtime TS + Python |
| Observability | latency_ms, toasts, error bubbles |
