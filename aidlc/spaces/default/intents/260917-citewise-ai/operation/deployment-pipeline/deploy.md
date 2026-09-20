# Deployment Pipeline

## Vercel (web)

- Build: `npm run build`
- Nitro preset `vercel` (see `vite.config.ts`)
- Env: `XAI_API_KEY` (server), optional `VITE_API_URL`

## Render (API)

- Blueprint: `render.yaml`
- Root: `backend`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Env: `XAI_API_KEY`, `CORS_ORIGINS`

## Health

- Web: HTTP 200 on `/`
- API: `GET /health` → `{ "status": "ok" }`
