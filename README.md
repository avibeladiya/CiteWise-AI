<div align="center">

# 📚 CiteWise AI

### Intelligent Document Q&A with Exact Citations

**Upload any document. Ask anything. Get grounded answers — every claim backed by a page number and verbatim quote.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![AWS SAM](https://img.shields.io/badge/AWS_SAM-Serverless-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/serverless/sam/)
[![Amazon Bedrock](https://img.shields.io/badge/Amazon_Bedrock-Claude_3_Haiku-232F3E?logo=amazonaws&logoColor=white)](https://aws.amazon.com/bedrock/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## 🎬 Demo

> **Mock mode is built-in** — the app runs entirely in-browser with no AWS account required.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          CiteWise AI  •  Landing                         │
│                                                                          │
│           Ask anything about                                             │
│               your documents                                             │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │   📎  Drag & drop your document here                            │   │
│   │       or browse to choose a file                                │   │
│   │                                                                  │   │
│   │       PDF or TXT  •  Max 10 MB  •  Up to 20 pages              │   │
│   └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘

┌────────────────┬─────────────────────────────────┬─────────────────────┐
│  Documents     │  Chat                           │  Sources            │
│  ─────────────│                                 │  ─────────────────  │
│  ⬆ Upload     │  You: What are the key          │  [1]  Page 3        │
│               │        findings?                 │  "The three primary │
│  ✓ report.pdf │                                 │   findings of this  │
│    12 pages   │  AI: The report identifies      │   report are…"      │
│    5m ago     │      three main findings [1].   │                     │
│               │      Revenue grew 23% YoY [2]. │  [2]  Page 5        │
│               │                                 │  "Total revenue     │
│               │  ┄┄┄ Sources: 2  ┄┄┄           │   reached $4.2B,    │
│               │  ▸ [1] Page 3  ▸ [2] Page 5    │   representing 23%  │
│               │                                 │   year-over-year…"  │
│               │  ┌───────────────────────────┐  │                     │
│               │  │  Ask anything…        [→] │  │                     │
│               │  └───────────────────────────┘  │                     │
└────────────────┴─────────────────────────────────┴─────────────────────┘
```

> 📸 Replace this section with actual screenshots once deployed.

---

## 📖 Overview

**CiteWise AI** is a production-ready, fully serverless **Retrieval-Augmented Generation (RAG)** application that transforms static documents into an interactive knowledge base.

Unlike generic AI chatbots that can hallucinate or provide unverifiable answers, CiteWise AI operates under a strict rule: **every answer must be grounded in the uploaded document and every claim must include a citation** — the exact page number and a verbatim quote from the source.

This makes it ideal for **high-stakes domains** where accuracy and traceability are non-negotiable: legal, healthcare, finance, compliance, and research.

### How it works in three steps

1. **Upload** — Drop a PDF or TXT file. The system extracts text page-by-page, splits it into overlapping semantic chunks, and generates embeddings via Amazon Bedrock Titan Embeddings V2.
2. **Ask** — Type any natural-language question. The system embeds your question, retrieves the most relevant chunks using cosine similarity, and feeds them into Claude 3 Haiku with a strict citation-enforcing prompt.
3. **Get cited answers** — The response always includes inline `[1][2]` markers, a sources panel showing each citation's page number, and the exact verbatim quote used.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 📎 **Drag-and-Drop Upload** | Upload PDF or TXT files up to 10 MB with visual progress |
| 🔍 **Semantic Search** | Cosine similarity over 1024-dimensional Titan embeddings |
| 🤖 **Claude 3 Haiku** | Fast, accurate answers at temperature=0 for determinism |
| 📌 **Forced Citations** | System prompt enforces JSON output with `[N]` markers and verbatim quotes |
| 📄 **Page-Level Traceability** | Every citation shows the source page number + exact quote |
| 🗂️ **Document Library** | Manage multiple documents with status tracking |
| 💬 **Persistent Chat** | Conversation history per document, persisted in localStorage |
| 🌗 **Dark Mode** | Full dark/light mode with system-aware theming |
| 📥 **Download Answers** | Export any answer + citations as a text file |
| 🔌 **Mock Mode** | Full in-browser simulation — no AWS account needed for development |
| 📱 **Responsive Design** | Mobile-friendly layout with collapsible sidebar and citations panel |
| ♿ **Accessible** | ARIA labels, keyboard navigation, screen-reader friendly |

---

## 🌍 Real-Life Applications

CiteWise AI is built for any domain where **you need answers you can trust and verify**. Here are the primary use cases:

---

### ⚖️ Legal & Compliance

Law firms, in-house legal teams, and compliance officers deal with mountains of contracts, regulations, and case files daily. CiteWise AI allows them to:

- Ask "What are the termination clauses in this contract?" and get the exact paragraph
- Query regulatory documents like GDPR or SOX for specific obligations with article references
- Review case files and find precedents with precise page citations
- Onboard junior associates faster by letting them query legal knowledge bases

> *"Does this NDA allow the vendor to sub-license our data?"* → Instant answer with the exact clause quoted.

---

### 🏥 Healthcare & Medical Research

Medical professionals and researchers need accurate information fast — lives can depend on it.

- Doctors and nurses query clinical guidelines and treatment protocols (e.g., WHO, CDC documents)
- Researchers find relevant sections across dozens of medical papers without reading each one
- Hospital administrators verify compliance with HIPAA or JCIA standards from uploaded policy docs
- Medical students get cited answers from textbooks for exam preparation

> *"What is the recommended dosage for metformin in elderly patients with renal impairment?"* → Answer with the exact guideline page.

---

### 🏢 Corporate Knowledge Base

Large organizations have policies, SOPs, HR manuals, and process documents that employees rarely read but always need.

- New employees get answers about leave policies, expense reimbursement, and IT procedures
- HR teams answer employee questions from the employee handbook with source references
- Operations teams query SOPs for step-by-step process guidance
- Managers verify escalation procedures from governance documents

> *"What is the approval process for a purchase order above $50,000?"* → Exact SOP section quoted.

---

### 🛎️ Customer Support

Support agents often search through product manuals and knowledge bases while customers wait.

- Agents ask questions about product specifications and get instant answers with manual references
- Reduces average handle time by eliminating manual document searches
- Ensures consistent, accurate information across all agents
- New agents ramp up faster without memorizing entire product catalogs

> *"Does Model XR-7 support 5 GHz Wi-Fi?"* → Direct answer with manual page citation.

---

### 🎓 Education & Academic Research

Students and researchers work with large volumes of papers, textbooks, and lecture notes.

- Students query uploaded course materials and get cited answers for assignments
- Researchers find supporting evidence in papers for literature reviews
- Professors create document-based Q&A sessions for course materials
- PhD candidates query their own reference library without reading every paper

> *"What methodology did Smith et al. use in their 2022 climate study?"* → Exact section quoted from the paper.

---

### 💰 Finance & Auditing

Financial analysts and auditors work with dense reports, prospectuses, and compliance documents.

- Auditors query financial statements for specific figures with exact note references
- Analysts extract revenue breakdowns and risk factors from annual reports
- Compliance teams verify adherence to accounting standards (IFRS, GAAP) from policy docs
- Investment teams perform due diligence on uploaded company filings

> *"What was the year-over-year change in R&D spend in Q3?"* → Answer with footnote reference.

---

### 🏛️ Government & Public Sector

Government officials, policy analysts, and civil servants manage vast repositories of policy documents, circulars, and legislation.

- Officials find relevant clauses in policy documents for decision-making
- Analysts query legislation for specific provisions with section numbers
- Public servants answer citizen queries by referencing official circulars
- Procurement teams verify compliance requirements from regulatory documents

> *"What are the conditions under which an emergency procurement can bypass tender rules?"* → Relevant regulation quoted verbatim.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework |
| Vite | 8 | Build tool and dev server |
| TypeScript | 6 | Type safety |
| Tailwind CSS | 3.4 | Utility-first styling |
| Zustand | 5 | Lightweight state management |
| Axios | 1.x | HTTP client |
| react-dropzone | 20 | Drag-and-drop file upload |
| react-markdown | 10 | Markdown rendering for answers |
| lucide-react | 1.x | Icon library |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.12 | Lambda runtime |
| pypdf | 4.x | PDF text extraction |
| boto3 | 1.34+ | AWS SDK |
| AWS SAM | 1.100+ | Infrastructure-as-code |

### AWS Services
| Service | Role |
|---------|------|
| **API Gateway HTTP API** | REST endpoints with CORS |
| **Lambda (×4)** | Serverless compute |
| **S3** | Document storage (7-day lifecycle) |
| **DynamoDB** | Metadata + embeddings (on-demand billing) |
| **Amazon Bedrock** | AI models (Titan Embeddings + Claude) |
| **IAM** | Least-privilege roles |
| **CloudWatch** | Logs (7-day retention) |

### AI Models
| Model | Provider | Use |
|-------|---------|-----|
| `amazon.titan-embed-text-v2:0` | AWS Bedrock | 1024-dim text embeddings |
| `anthropic.claude-3-haiku-20240307-v1:0` | AWS Bedrock | Answer generation with citations |

---

## 🏗️ Architecture

```
Browser (React + Vite)
   │
   │ ① POST /upload  { filename, size, type }
   ▼
API Gateway ──► upload-handler Lambda
                  │ Validates input
                  │ Writes record → DynamoDB (status: uploading)
                  │ Generates presigned S3 PUT URL (15 min)
                  └── returns { document_id, upload_url }
   │
   │ ② PUT file directly to S3 (presigned URL, bypasses Lambda)
   ▼
S3 Bucket
   │
   │ ③ ObjectCreated event (automatic trigger)
   ▼
document-processor Lambda  [512 MB / 5 min timeout]
   │ Extract text page-by-page (pypdf for PDF, plain read for TXT)
   │ Chunk into ~600-token windows with 80-token overlap
   │ Embed each chunk → Bedrock Titan Embeddings V2 (1024-dim)
   │ Batch-write chunks + embeddings → DynamoDB chunks table
   └── Update document status: ready
   │
   │ ④ Browser polls GET /documents/{id} until status = ready
   ▼
   │ ⑤ POST /documents/{id}/query  { question }
   ▼
query-handler Lambda  [256 MB / 60 sec timeout]
   │ Embed question → Bedrock Titan Embeddings V2
   │ Load all chunks for document (DynamoDB GSI query)
   │ Compute cosine similarity in-memory (pure Python)
   │ Select top-5 chunks above 0.25 threshold
   │ Build RAG prompt (context + citation instruction)
   │ Call Bedrock Claude 3 Haiku (temperature=0, JSON output)
   │ Parse { answer, citations[] } with fallback parser
   └── Return { answer, citations[], chunks_used, latency_ms }
   │
   ▼
Browser renders answer with inline [1][2] markers
+ collapsible citations panel (page + verbatim quote)
```

### DynamoDB Schema

**`citewise-documents`** — PK: `document_id`
```
document_id    | document_name | status          | page_count | chunk_count
               |               | uploading       |            |
               |               | processing   →  |            |
               |               | ready           |            |
               |               | failed          |            |
```

**`citewise-chunks`** — PK: `chunk_id`, GSI: `document_id-index`
```
chunk_id              | document_id | page_number | chunk_index | text | embedding (1024-dim)
{doc_id}#{chunk_idx}  |             |             |             |      |
```

---

## 🚀 How to Run Locally

### Option A — Mock Mode (No AWS Required)

The fastest way to run CiteWise AI. The frontend ships with a complete in-memory simulation that mimics the full upload→process→query flow, complete with realistic delays and sample cited answers.

```bash
# Prerequisites: Node.js 20+

git clone https://github.com/your-username/citewise-ai.git
cd citewise-ai/frontend

npm install
cp .env.example .env.local   # VITE_USE_MOCK=true by default

npm run dev
# Opens at http://localhost:5173
```

Upload any PDF or TXT file. The mock will simulate processing (~3 seconds) and return realistic AI answers with citations for questions about machine learning, transformers, climate, and finance.

---

### Option B — Full AWS Deployment

#### Prerequisites

| Requirement | Version / Notes |
|------------|----------------|
| Node.js | ≥ 20 |
| Python | 3.12 |
| AWS CLI | v2, configured with credentials |
| SAM CLI | ≥ 1.100 |
| Docker | Required for `sam build` |

#### Step 1 — Enable Bedrock Models

In the AWS Console → Bedrock → Model Access, enable:
- `Amazon: Titan Embeddings V2`
- `Anthropic: Claude 3 Haiku`

> ⚠️ Models must be enabled in the same region as your deployment (default: `us-east-1`)

#### Step 2 — Deploy Backend

```bash
cd backend

# First-time deploy (interactive)
sam build --parallel
sam deploy --guided

# Note the API URL in outputs:
# ApiUrl = https://abc123.execute-api.us-east-1.amazonaws.com/dev
```

#### Step 3 — Configure Frontend

```bash
cd ../frontend
npm install

# Create .env.local with your API URL
echo "VITE_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com/dev" > .env.local
echo "VITE_USE_MOCK=false" >> .env.local

npm run dev
```

#### Or use the deploy script

```bash
# From the repo root — builds + deploys backend + writes frontend/.env.local
chmod +x deploy.sh
./deploy.sh --stage dev --region us-east-1
```

#### Step 4 — Build for Production

```bash
cd frontend
npm run build
# Output in frontend/dist/ — deploy to S3 + CloudFront, Vercel, Netlify, etc.
```

---

## 📁 Project Structure

```
citewise-ai/
│
├── frontend/                          # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── index.ts               # Axios client + full in-browser mock
│   │   ├── components/
│   │   │   ├── chat/                  # ChatView, Message, ChatInput, TypingIndicator
│   │   │   ├── citations/             # CitationsPanel (collapsible right panel)
│   │   │   ├── documents/             # DocLibrary (sidebar with status/progress)
│   │   │   ├── ui/                    # Button, Badge, Dialog, Skeleton, Toast…
│   │   │   └── upload/                # UploadZone (drag-and-drop)
│   │   ├── hooks/
│   │   │   ├── useUpload.ts           # Upload flow + polling
│   │   │   ├── useAsk.ts              # RAG query hook
│   │   │   └── useTheme.ts            # Dark mode sync
│   │   ├── lib/
│   │   │   └── utils.ts               # cn(), formatBytes(), downloadText()…
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx        # Hero + upload + recent docs
│   │   │   └── WorkspacePage.tsx      # 3-panel layout
│   │   ├── store/
│   │   │   ├── useDocStore.ts         # Document state (Zustand, persisted)
│   │   │   ├── useChatStore.ts        # Chat threads (Zustand, persisted)
│   │   │   └── useUIStore.ts          # UI state (view, sidebar, toasts, dark)
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript interfaces
│   │   ├── App.tsx                    # Root component + view router
│   │   ├── main.tsx                   # React entry point
│   │   └── index.css                  # Tailwind directives + custom CSS
│   ├── public/
│   │   └── favicon.svg
│   ├── .env.example                   # Environment variable template
│   ├── tailwind.config.ts             # Design tokens (indigo accent, animations)
│   ├── vite.config.ts
│   ├── tsconfig.app.json
│   └── package.json
│
├── backend/                           # AWS Lambda functions (Python 3.12)
│   ├── functions/
│   │   ├── upload_handler/
│   │   │   └── handler.py             # POST /upload → presigned S3 URL
│   │   ├── document_processor/
│   │   │   └── handler.py             # S3 trigger → extract → chunk → embed
│   │   ├── document_manager/
│   │   │   └── handler.py             # GET|DELETE /documents
│   │   └── query_handler/
│   │       └── handler.py             # POST /ask → RAG → Claude → citations
│   ├── layers/
│   │   └── shared/
│   │       └── python/
│   │           └── utils.py           # Bedrock clients, chunking, cosine sim
│   ├── template.yaml                  # AWS SAM infrastructure template
│   ├── samconfig.toml                 # Deploy defaults
│   ├── Makefile                       # build / deploy / logs shortcuts
│   └── README.md                      # Backend-specific documentation
│
├── infrastructure/                    # CloudFormation / SAM templates
│   ├── template.yaml                  # Symlink or copy of backend/template.yaml
│   └── README.md                      # Infrastructure documentation
│
├── docs/                              # Architecture diagrams and documentation
│   ├── architecture.md                # System design explanation
│   ├── api-reference.md               # Full API endpoint documentation
│   ├── rag-design.md                  # RAG pipeline design decisions
│   └── diagrams/
│       └── architecture.png           # Architecture diagram (placeholder)
│
├── samples/                           # Sample documents for testing
│   ├── README.md                      # Description of sample files
│   ├── sample-ml-paper.txt            # Machine learning concepts (mock)
│   └── sample-financial-report.txt    # Financial report (mock)
│
├── .gitignore                         # Comprehensive ignore rules
├── README.md                          # This file
├── LICENSE                            # MIT License
└── deploy.sh                          # Full-stack deploy script
```

---

## 🔮 Future Improvements

### Short-Term (v1.1)

- [ ] **Streaming responses** — Stream Claude's output token-by-token for a faster perceived response
- [ ] **Multi-document queries** — Ask questions across multiple uploaded documents simultaneously
- [ ] **Better PDF handling** — Support scanned PDFs via Textract OCR
- [ ] **File preview** — Show a PDF viewer alongside the chat

### Medium-Term (v1.2)

- [ ] **Authentication** — Amazon Cognito for multi-user support with private document libraries
- [ ] **Vector database upgrade** — Replace DynamoDB scan + in-memory cosine similarity with OpenSearch Serverless or Aurora pgvector for 10× faster retrieval at scale
- [ ] **Reranking** — Add a second-pass cross-encoder reranker for higher retrieval precision
- [ ] **Citation highlighting** — Highlight the exact quote in a PDF viewer

### Long-Term (v2.0)

- [ ] **Multi-modal support** — Extract text from images and diagrams within PDFs
- [ ] **Document comparison** — Ask questions that compare two uploaded documents
- [ ] **Webhooks / API** — Expose CiteWise as an API so other systems can query it programmatically
- [ ] **Self-hosted option** — Docker Compose setup for on-premises deployments in regulated industries
- [ ] **Audit trail** — Log all queries and answers for compliance purposes

---

## 💸 Cost Estimate

Estimated AWS costs for a **typical demo workload** (100 document uploads × 20 pages + 500 queries):

| Service | Usage | Estimated Cost |
|---------|-------|----------------|
| Amazon Bedrock — Titan Embeddings V2 | ~50,000 tokens | ~$0.01 |
| Amazon Bedrock — Claude 3 Haiku | ~500 queries × ~2,000 tokens | ~$1.50 |
| DynamoDB (on-demand) | ~1M read/write units | ~$0.25 |
| Lambda | Well within free tier (1M req/mo) | $0.00 |
| S3 | < 1 GB storage + requests | < $0.05 |
| API Gateway | < 1M requests (free tier) | $0.00 |
| **Total** | | **~$2–3** |

> 💡 Claude 3 Haiku is one of the most cost-efficient frontier models available, making CiteWise AI extremely affordable even at moderate usage.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Built with [Kiro](https://kiro.dev) — AI-powered development environment**

This entire project was designed, architected, and implemented using Kiro's Spec and Vibe sessions:

- **Spec Mode** generated the full requirements document, system design, API contracts, and 20-task breakdown before a single line of code was written
- **Vibe Mode** implemented all Lambda functions, the shared utility layer, the SAM CloudFormation template, and all 30+ React components
- Key architectural decisions — pure-Python cosine similarity (no numpy layer needed), DynamoDB GSI pattern, presigned URL upload flow, and structured JSON prompting for reliable citations — emerged through collaborative reasoning with Kiro

> *CiteWise AI demonstrates how AI-assisted development with Kiro can take a project from idea to production-ready code in hours rather than weeks.*

---

<div align="center">

Made with ❤️ using **Kiro** + **Amazon Bedrock**

[⭐ Star this repo](https://github.com/your-username/citewise-ai) · [🐛 Report a bug](https://github.com/your-username/citewise-ai/issues) · [💡 Request a feature](https://github.com/your-username/citewise-ai/issues)

</div>
