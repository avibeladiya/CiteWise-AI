# CiteWise AI — API Reference

Base URL: `https://{api-id}.execute-api.{region}.amazonaws.com/{stage}`

All requests and responses use `Content-Type: application/json`.

---

## POST `/upload`

Initiate a document upload. Returns a presigned S3 URL for the client to PUT the file directly.

### Request Body

```json
{
  "filename":     "quarterly-report.pdf",
  "content_type": "application/pdf",
  "file_size":    2097152
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `filename` | string | ✅ | Must end in `.pdf` or `.txt` |
| `content_type` | string | ✅ | `application/pdf` or `text/plain` |
| `file_size` | number | ✅ | Bytes, max 10,485,760 (10 MB) |

### Response `201 Created`

```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "upload_url":  "https://s3.amazonaws.com/citewise-documents-...?X-Amz-Signature=...",
  "s3_key":      "documents/550e8400-e29b-41d4-a716-446655440000/quarterly-report.pdf"
}
```

### After receiving this response

```
PUT {upload_url}
Content-Type: application/pdf
Body: <raw file bytes>
```

---

## GET `/documents`

List all uploaded documents, newest-first.

### Response `200 OK`

```json
{
  "documents": [
    {
      "document_id":   "550e8400-...",
      "document_name": "quarterly-report.pdf",
      "status":        "ready",
      "page_count":    12,
      "chunk_count":   28,
      "file_size":     2097152,
      "created_at":    "2026-01-15T10:30:00+00:00"
    }
  ]
}
```

### Document statuses

| Status | Description |
|--------|-------------|
| `uploading` | S3 PUT in progress |
| `processing` | Text extraction + embedding in progress |
| `ready` | Available for queries |
| `failed` | Processing failed (check `error_message`) |

---

## GET `/documents/{id}`

Get a single document record. Use this to poll for status changes.

### Response `200 OK`

```json
{
  "document_id":   "550e8400-...",
  "document_name": "quarterly-report.pdf",
  "status":        "ready",
  "page_count":    12,
  "chunk_count":   28,
  "file_size":     2097152,
  "created_at":    "2026-01-15T10:30:00+00:00"
}
```

### Response `404 Not Found`

```json
{ "error": "Document '550e8400-...' not found" }
```

---

## DELETE `/documents/{id}`

Delete a document and all its associated text chunks.

### Response `200 OK`

```json
{
  "deleted":        "550e8400-...",
  "chunks_deleted": 28
}
```

---

## POST `/documents/{id}/query`

Ask a natural-language question about a document.

### Request Body

```json
{
  "question": "What was the year-over-year revenue growth?"
}
```

### Response `200 OK`

```json
{
  "answer": "Revenue grew 23% year-over-year to $4.2 billion [1], driven by strong cloud services performance which expanded 41% [2].",
  "citations": [
    {
      "citation_number": 1,
      "page_number":     5,
      "chunk_index":     11,
      "quote":           "Total revenue for the quarter was $4.2 billion, representing 23% year-over-year growth."
    },
    {
      "citation_number": 2,
      "page_number":     5,
      "chunk_index":     12,
      "quote":           "Cloud services contributed $1.8 billion, up 41% from the prior year period."
    }
  ],
  "chunks_used": 4,
  "latency_ms":  1840
}
```

| Field | Type | Description |
|-------|------|-------------|
| `answer` | string | AI-generated answer with inline `[N]` citation markers |
| `citations` | array | Ordered list of citations matching the `[N]` markers |
| `citations[].citation_number` | number | Matches `[N]` in the answer text |
| `citations[].page_number` | number | 1-indexed page in the source document |
| `citations[].chunk_index` | number | Internal chunk identifier |
| `citations[].quote` | string | Verbatim excerpt from the source (≤200 chars) |
| `chunks_used` | number | Number of chunks retrieved above threshold |
| `latency_ms` | number | Total processing time in milliseconds |

### Error responses

```json
{ "error": "Document is not ready (status='processing'). Please wait." }
{ "error": "question is required" }
{ "error": "Document '...' not found" }
```

---

## POST `/ask`

Alternative endpoint — same as `/documents/{id}/query` but `document_id` is in the body.

### Request Body

```json
{
  "document_id": "550e8400-...",
  "question":    "What was the year-over-year revenue growth?"
}
```

Response is identical to `POST /documents/{id}/query`.

---

## Error Format

All errors follow the same structure:

```json
{ "error": "Human-readable error message" }
```

| HTTP Status | Meaning |
|-------------|---------|
| `400` | Bad request (validation error) |
| `404` | Document not found |
| `500` | Internal server error |
