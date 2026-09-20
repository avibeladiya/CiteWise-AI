<div align="center">
  <h1>🏆 CiteWise AI</h1>
  <p><strong>The Grounded Document Q&A that NEVER hallucinates.</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel)](https://vercel.com/)
  [![Render](https://img.shields.io/badge/API_on-Render-46E3B7?logo=render)](https://render.com/)
  
  <p>Upload a PDF or TXT, ask a question, and every claim comes back with a page number and a verbatim quote.</p>
</div>

---

> **Note:** This is an official **AI-DLC** submission. All intent, requirements, architecture, and construction artifacts live under `aidlc/` and `.kiro/`. The product itself is a production-ready RAG system featuring a Vercel web app and a Render Python API.

## ✨ Why CiteWise AI?

In a world where LLMs confidently invent facts, CiteWise AI is built on absolute provenance. If it cannot find the answer in your document, it won't invent one. **Every single claim** is backed by an exact, clickable citation from your source document. 

### 🌟 Real-Life Impact & Use Cases

CiteWise AI shines in scenarios where accuracy and provenance are non-negotiable:

- 📈 **Financial Analysts (Earnings Reports):** Digging through a 100-page 10-K report to find specific metrics or risk factors? Upload the PDF and ask *"What are the primary risk factors regarding the supply chain?"* CiteWise extracts the exact paragraphs, citing specific page numbers (e.g., Page 34) so you can verify immediately.
- ⚖️ **Legal Professionals (Contract Review):** Reviewing lengthy terms of service or MSAs? Upload the contract and ask *"Under what conditions can this contract be terminated?"* CiteWise points directly to the termination clauses, ensuring no critical condition is overlooked and providing the exact quote.
- 🎓 **Students & Researchers (Literature Review):** Synthesizing information across dense academic papers? Ask *"What methodology did the authors use to measure hallucination?"* CiteWise provides a summary grounded *only* in the uploaded paper, preventing AI hallucination from creeping into your research notes.

## 🚀 How It Works (The 5-Step Pipeline)

1. 📄 **Extract:** Documents (PDF/TXT) are parsed page by page directly in the browser (or in Python on Render).
2. ✂️ **Chunk:** Text is split into overlapping passages (~180 words, 30-word overlap) for perfect context.
3. 🔍 **Retrieve:** A fast, local BM25 algorithm ranks the passages that best match your question.
4. 🧠 **Generate:** Grok writes an answer that is *strictly restricted* to using those retrieved passages, enforced via citation JSON.
5. ✅ **Audit:** Click any `[1]` citation in the answer to instantly jump to the exact quote in the source rail.

> **Extractive Fallback:** No LLM key? No problem. CiteWise gracefully falls back to extractive mode, answering directly from the retrieved quotes without generating new text.

## 🏗️ Architecture

A robust, decoupled architecture separating the fast interactive frontend from the heavy-lifting backend.

```text
┌──────────────────────────┐     ┌─────────────────────────────┐
│  Web app (Vercel)        │     │  API (Render, optional)     │
│  TanStack Start + React  │     │  FastAPI · Python 3.12      │
│  Client extract + BM25   │     │  pypdf · BM25 · Grok        │
│  Server fn → xAI Grok    │     │  POST /upload  /query       │
└──────────────────────────┘     └─────────────────────────────┘
```

The live web app is completely self-contained. Indexing happens locally in the browser, and generation is handled by a secure server function. 
*Want to scale?* Just point `VITE_API_URL` to the Render service to seamlessly switch to the Python pipeline.

## 🗺️ Project Structure

```text
citewise-ai/
├── src/                    # ⚛️ TanStack Start UI + RAG client
├── backend/                # 🐍 FastAPI service (Render)
├── samples/                # 📑 Demo documents
├── public/samples/         # 🌐 Same files, served to the UI
├── docs/                   # 📚 Architecture, API, RAG, deploy
├── aidlc/                  # 🧠 AI-DLC memory, phases, intent record
├── .kiro/                  # ⚙️ Harness, specs, steering
├── render.yaml             # ☁️ Render Blueprint
├── vercel.json             # ▲ Vercel install/build config
└── README.md
```

## 💻 Quick Start

Get CiteWise AI running locally in under a minute:

```bash
npm install
npm run dev
```

1. Open the preview.
2. Drop a file or click **Index this sample**.
3. Try asking:
   - *"What was Q3 operating margin?"*
   - *"How does gradient descent update weights?"*
   - *"What is RAG and why does it reduce hallucination?"*

## ☁️ Deployment

### ▲ Vercel (Web Frontend)
Connect your repo and deploy. The build command is `npm run build`. The Vite config already emits a Vercel output via Nitro.
**Optional Environment Variables:**
- `XAI_API_KEY`: Enables Grok generation (server-only).
- `VITE_API_URL`: Set to your Render origin if using the standalone Python API.

### ☁️ Render (Python API)
Use the included Blueprint in `render.yaml`, or deploy manually:
- **Root directory:** `backend`
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Env vars:** `XAI_API_KEY`, `CORS_ORIGINS=https://your-app.vercel.app`

## 🏆 AI-DLC Provenance

This project was meticulously built through the structured Intent → Inception → Construction → Operation lifecycle, utilizing the Kiro harness layout (inspired by [Flappy-Kiro-AIDLC](https://github.com/avibeladiya/Flappy-Kiro-AIDLC)). 

**Trace the journey:**
- 🎯 [Intent](aidlc/spaces/default/intents/260917-citewise-ai/ideation/intent-capture/intent-statement.md)
- 📋 [Requirements](aidlc/spaces/default/intents/260917-citewise-ai/inception/requirements-analysis/requirements.md)
- 📐 [Architecture](docs/architecture.md)
- 🧭 [Steering](.kiro/steering/product.md)
- 📊 [State](aidlc/spaces/default/intents/260917-citewise-ai/aidlc-state.md)

---

<div align="center">
  Built with ❤️ for the AI-DLC Competition.<br>
  Released under the <a href="LICENSE">MIT License</a>.
</div>
