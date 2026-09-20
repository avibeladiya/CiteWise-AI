# Deploy

## Vercel

1. Import the GitHub repo.
2. Framework: Vite (Nitro emits Vercel output on `npm run build`).
3. Env: `XAI_API_KEY`. Optional `VITE_API_URL=https://<render-service>.onrender.com`.

## Render

1. New Blueprint from `render.yaml`, or Web Service with root `backend`.
2. Build: `pip install -r requirements.txt`
3. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Env: `XAI_API_KEY`, `CORS_ORIGINS=https://<your-app>.vercel.app`

## Local web

`npm install && npm run dev`
