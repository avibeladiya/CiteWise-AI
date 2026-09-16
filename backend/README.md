# CiteWise AI — Backend

Serverless RAG pipeline on AWS: **S3 → Lambda → DynamoDB → Bedrock**.

```
Browser
  │  PUT (presigned URL)
  ▼
S3 Bucket ──ObjectCreated──► document-processor Lambda
                                  │ pypdf extraction
                                  │ chunking (600 tok / 80 tok overlap)
                                  │ Titan Embeddings V2  (1024-dim)
                                  │ DynamoDB batch write
                                  ▼
                              citewise-chunks table

Browser
  │  POST /ask
  ▼
API Gateway ──► query-handler Lambda
                    │ Titan embed(question)
                    │ DynamoDB GSI scan + cosine similarity
                    │ top-5 chunks → RAG prompt
                    │ Claude 3 Haiku (temp=0, JSON output)
                    ▼
               { answer, citations[] }
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| AWS CLI | v2 |
| SAM CLI | ≥ 1.100 |
| Python | 3.12 |
| Docker | any (used by `sam build`) |

Enable Bedrock model access in your AWS account:
- `amazon.titan-embed-text-v2:0`
- `anthropic.claude-3-haiku-20240307-v1:0`

---

## Quick Start

```bash
# 1. Configure AWS credentials
aws configure   # or use SSO / environment variables

# 2. Build + deploy (interactive first time)
cd backend
make deploy-guided

# 3. Note the API URL in the Outputs section, e.g.:
#    ApiUrl = https://abc123.execute-api.us-east-1.amazonaws.com/dev

# 4. Set the URL in the frontend
echo "VITE_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com/dev" > ../frontend/.env.local
echo "VITE_USE_MOCK=false" >> ../frontend/.env.local
```

---

## API Reference

### POST `/upload`
Initiate a document upload.

**Request:**
```json
{ "filename": "report.pdf", "content_type": "application/pdf", "file_size": 2097152 }
```

**Response `201`:**
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "upload_url":  "https://s3.amazonaws.com/citewise-documents-...?X-Amz-...",
  "s3_key":      "documents/550e8400.../report.pdf"
}
```

After receiving this response, the frontend PUTs the file bytes directly to `upload_url`.

---

### GET `/documents`
List all documents.

**Response `200`:**
```json
{
  "documents": [
    {
      "document_id": "550e8400-...",
      "document_name": "report.pdf",
      "status": "ready",
      "page_count": 12,
      "chunk_count": 28,
      "file_size": 2097152,
      "created_at": "2024-01-15T10:30:00+00:00"
    }
  ]
}
```

Document statuses: `uploading` → `processing` → `ready` | `failed`

---

### GET `/documents/{id}`
Get a single document record (poll this to check processing status).

---

### DELETE `/documents/{id}`
Delete a document and all its associated chunks.

---

### POST `/documents/{id}/query`  or  POST `/ask`
Ask a question against a document.

**Request:**
```json
{ "question": "What are the key findings?" }
```
*(For `/ask`, also include `"document_id": "550e8400-..."`)*

**Response `200`:**
```json
{
  "answer": "The report identifies three main findings [1]. First, revenue grew 23% YoY [2]. Second, customer retention improved significantly [1].",
  "citations": [
    {
      "citation_number": 1,
      "page_number": 3,
      "chunk_index": 7,
      "quote": "The three primary findings of this report are outlined in the executive summary and detailed in sections 2, 3, and 4."
    },
    {
      "citation_number": 2,
      "page_number": 5,
      "chunk_index": 11,
      "quote": "Total revenue for the fiscal year reached $4.2 billion, representing 23% year-over-year growth."
    }
  ],
  "chunks_used": 4,
  "latency_ms": 1850
}
```

---

## Project Structure

```
backend/
├── template.yaml                          # AWS SAM infrastructure template
├── samconfig.toml                         # SAM deployment defaults
├── Makefile                               # build / deploy / logs shortcuts
├── layers/
│   └── shared/
│       ├── requirements.txt               # boto3
│       └── python/
│           └── utils.py                   # AWS clients, chunking, embed, cosine sim
└── functions/
    ├── upload_handler/
    │   ├── handler.py                     # POST /upload
    │   └── requirements.txt
    ├── document_processor/
    │   ├── handler.py                     # S3 trigger → extract → chunk → embed
    │   └── requirements.txt               # pypdf
    ├── document_manager/
    │   ├── handler.py                     # GET/DELETE /documents
    │   └── requirements.txt
    └── query_handler/
        ├── handler.py                     # POST /ask → RAG → Claude → citations
        └── requirements.txt
```

---

## RAG Design Details

### Chunking
- Target ~600 tokens per chunk with ~80-token overlap
- Pure Python word-level splitting — no external tokenizer needed
- Each chunk records its dominant page number for citation

### Embeddings
- Model: `amazon.titan-embed-text-v2:0`
- Dimensions: 1024 (normalised)
- Retry: 3× exponential back-off on throttling

### Retrieval
- Cosine similarity computed in-memory (pure Python, no numpy)
- Threshold: 0.25 (configurable via `SIM_THRESHOLD` parameter)
- Top-K: 5 (configurable via `TOP_K` parameter)

### Generation
- Model: `anthropic.claude-3-haiku-20240307-v1:0`
- Temperature: 0.0 (deterministic)
- System prompt enforces strict JSON output with inline citation markers
- Parser falls back gracefully if Claude returns malformed JSON

---

## Cost Estimate (demo scale)

| Service | Unit | Cost |
|---------|------|------|
| Titan Embeddings | $0.0002 / 1k tokens | ~$0.01 per 20-page doc |
| Claude 3 Haiku | $0.0025 input + $0.0125 output / 1k tokens | ~$0.003 per query |
| DynamoDB | On-demand, ~$0.25/M RCU | Negligible at demo scale |
| Lambda | 1M req free tier | Negligible |
| S3 | $0.023/GB/month | Negligible |
| **Total** | 100 uploads + 500 queries | **~$3–5** |

---

## Teardown

```bash
make destroy STAGE=dev
```

This deletes the CloudFormation stack. Note: the S3 bucket must be emptied first:
```bash
aws s3 rm s3://citewise-documents-<account-id>-dev --recursive
make destroy STAGE=dev
```
