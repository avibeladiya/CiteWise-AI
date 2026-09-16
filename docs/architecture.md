# CiteWise AI — Architecture

## System Overview

CiteWise AI is a fully serverless RAG (Retrieval-Augmented Generation) system built on AWS. It follows a three-phase architecture: **Ingestion**, **Storage**, and **Query**.

## Phase 1: Document Ingestion

```
Browser → POST /upload → upload-handler Lambda
             ↓
        DynamoDB (status: uploading)
             ↓
        Returns presigned S3 PUT URL

Browser → PUT file → S3 Bucket
             ↓
        S3 ObjectCreated event
             ↓
        document-processor Lambda
             ├── Extract text (pypdf / plain)
             ├── Chunk (~600 tok, 80-tok overlap)
             ├── Embed each chunk (Titan V2, 1024-dim)
             └── Write chunks → DynamoDB (status: ready)
```

## Phase 2: Storage

### DynamoDB: `citewise-documents`
Tracks document lifecycle and metadata.

```
PK: document_id (UUID)
Attributes: document_name, s3_key, status, page_count, chunk_count,
            file_size, created_at, error_message
```

### DynamoDB: `citewise-chunks`
Stores text chunks with their embeddings for retrieval.

```
PK: chunk_id  ({document_id}#{chunk_index})
GSI: document_id-index (for per-document queries)
Attributes: document_id, document_name, page_number, chunk_index,
            text, embedding (1024-dim Decimal list),
            char_start, char_end
```

## Phase 3: Query (RAG Pipeline)

```
Browser → POST /ask → query-handler Lambda
    ↓
Embed question (Titan V2, 1024-dim)
    ↓
DynamoDB GSI query → load all chunks for document
    ↓
Cosine similarity (pure Python)
    ↓
Top-5 chunks (threshold ≥ 0.25)
    ↓
Build RAG prompt:
  System: strict JSON output, citation enforcement
  User:   question + numbered source chunks
    ↓
Claude 3 Haiku (temperature=0)
    ↓
Parse JSON { answer, citations[] }
    ↓
Return { answer, citations[], chunks_used, latency_ms }
```

## Chunking Strategy

- **Window size:** ~600 tokens (≈ 460 words)
- **Overlap:** ~80 tokens (≈ 62 words)
- **Method:** Word-level sliding window (no external tokenizer needed)
- **Page tracking:** Each chunk records its "dominant page" (the page contributing the most words)
- **Rationale:** Overlap ensures context boundaries don't cut off important sentences; word-level splitting avoids tokenizer dependencies in Lambda

## Embedding Strategy

- **Model:** `amazon.titan-embed-text-v2:0`
- **Dimensions:** 1024 (normalised L2)
- **Storage:** Decimal list in DynamoDB (avoids float precision issues)
- **Retrieval:** In-memory cosine similarity (no external vector DB needed for ≤500 chunks)
- **Upgrade path:** OpenSearch Serverless or Aurora pgvector for >10,000 chunks

## Citation Enforcement

The system prompt instructs Claude to:

1. Answer ONLY from provided source chunks (no outside knowledge)
2. Place `[1]`, `[2]` markers after EVERY factual claim
3. Return a strict JSON object: `{ "answer": "...", "citations": [...] }`
4. Include verbatim quotes (≤200 chars) from the source for each citation
5. If no relevant information is found, say so explicitly

A robust fallback parser handles cases where Claude returns slightly malformed JSON by applying regex extraction and populating missing fields from the retrieved chunk metadata.

## Security Model

- S3 bucket is **fully private** — no public access
- Documents are accessed only via presigned PUT URLs (15-min expiry)
- API Gateway has CORS restricted (configurable per stage)
- IAM role uses **least privilege**: DynamoDB CRUD + S3 object access + specific Bedrock model ARNs only
- No secrets stored in environment variables (IAM role-based access)
- All data is scoped to the deployment account

## Scalability Notes

| Component | Current Scale | Upgrade Path |
|-----------|--------------|--------------|
| Vector search | In-memory, ≤500 chunks | OpenSearch Serverless |
| Embeddings storage | DynamoDB | DynamoDB + TTL, or pgvector |
| Document processing | Synchronous in Lambda | Step Functions for large docs |
| Auth | None (demo) | Cognito + API Gateway authorizer |
| Streaming | Buffered | Bedrock streaming + SSE |
