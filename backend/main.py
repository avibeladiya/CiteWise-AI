"""
CiteWise AI — FastAPI server for Render deployment
===================================================
Exposes the same RAG pipeline as the Lambda functions,
but as a long-running HTTP server compatible with Render.

Routes:
  GET  /                           health check
  GET  /health                     health check
  POST /upload                     upload PDF/TXT → S3 + process
  GET  /documents                  list all documents
  GET  /documents/{id}             get document metadata / poll status
  DELETE /documents/{id}           delete document + chunks
  POST /documents/{id}/query       RAG query with citations
  POST /ask                        same as above, document_id in body
"""
from __future__ import annotations

import io
import json
import logging
import math
import os
import re
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

import boto3
import pypdf
from boto3.dynamodb.conditions import Key
from botocore.config import Config
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ── Bootstrap ──────────────────────────────────────────────────────────────────
load_dotenv()   # loads .env / .env.local in development; no-op in production

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")
logger = logging.getLogger("citewise")

# ── Config from environment ────────────────────────────────────────────────────
AWS_REGION       = os.environ.get("AWS_REGION",       "us-east-1")
BEDROCK_REGION   = os.environ.get("BEDROCK_REGION",   "us-east-1")
S3_BUCKET        = os.environ.get("S3_BUCKET",        "")
DOCUMENTS_TABLE  = os.environ.get("DOCUMENTS_TABLE",  "citewise-documents-dev")
CHUNKS_TABLE     = os.environ.get("CHUNKS_TABLE",     "citewise-chunks-dev")
TOP_K            = int(os.environ.get("TOP_K",        "5"))
SIM_THRESHOLD    = float(os.environ.get("SIM_THRESHOLD", "0.25"))
MAX_PAGES        = int(os.environ.get("MAX_PAGES",    "20"))
CORS_ORIGINS     = os.environ.get("CORS_ORIGINS", "*").split(",")

CLAUDE_MODEL     = "anthropic.claude-3-haiku-20240307-v1:0"
TITAN_MODEL      = "amazon.titan-embed-text-v2:0"
EMBED_DIM        = 1024
MAX_BYTES        = 10 * 1024 * 1024   # 10 MB
ALLOWED_EXTS     = {".pdf", ".txt"}

# ── AWS client singletons ──────────────────────────────────────────────────────
_s3       = None
_dynamodb = None
_bedrock  = None


def s3():
    global _s3
    if _s3 is None:
        _s3 = boto3.client("s3", region_name=AWS_REGION)
    return _s3


def dynamodb():
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
    return _dynamodb


def bedrock():
    global _bedrock
    if _bedrock is None:
        _bedrock = boto3.client(
            "bedrock-runtime",
            region_name=BEDROCK_REGION,
            config=Config(
                retries={"max_attempts": 3, "mode": "adaptive"},
                connect_timeout=10,
                read_timeout=60,
            ),
        )
    return _bedrock


# ── FastAPI app ────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("CiteWise AI starting up  |  region=%s  bucket=%s  docs_table=%s",
                AWS_REGION, S3_BUCKET, DOCUMENTS_TABLE)
    yield
    logger.info("CiteWise AI shutting down")


app = FastAPI(
    title="CiteWise AI",
    description="RAG Knowledge Assistant with Exact Citations",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ────────────────────────────────────────────────────────────
class AskRequest(BaseModel):
    question:    str
    document_id: str | None = None


# ── Utilities ──────────────────────────────────────────────────────────────────
def new_id()  -> str: return str(uuid.uuid4())
def now_iso() -> str: return datetime.now(timezone.utc).isoformat()


def _clean(item: dict) -> dict:
    """Convert DynamoDB Decimal values to int/float for JSON serialisation."""
    out = {}
    for k, v in item.items():
        if k == "embedding":
            continue              # never return embedding vectors to the client
        if isinstance(v, Decimal):
            out[k] = int(v) if v == int(v) else float(v)
        else:
            out[k] = v
    return out


def _extract_pdf(file_bytes: bytes) -> list[dict]:
    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    pages  = []
    for i, page in enumerate(reader.pages[:MAX_PAGES]):
        text = (page.extract_text() or "").strip()
        if text:
            pages.append({"page": i + 1, "text": text})
    return pages


def _extract_txt(file_bytes: bytes) -> list[dict]:
    try:
        raw = file_bytes.decode("utf-8", errors="replace")
    except Exception:
        raw = file_bytes.decode("latin-1", errors="replace")
    parts = raw.split("\f")
    pages = []
    for i, part in enumerate(parts[:MAX_PAGES]):
        text = part.strip()
        if text:
            pages.append({"page": i + 1, "text": text})
    return pages or ([{"page": 1, "text": raw.strip()}] if raw.strip() else [])


def _chunk_pages(pages: list[dict], target_tokens: int = 600, overlap_tokens: int = 80) -> list[dict]:
    words: list[tuple[int, int, str]] = []
    offset = 0
    for page in pages:
        for word in page["text"].split():
            words.append((offset, page["page"], word))
            offset += len(word) + 1
    if not words:
        return []

    wpc  = max(10, int(target_tokens / 1.3))
    wpo  = max(0,  int(overlap_tokens / 1.3))
    step = max(1,  wpc - wpo)
    chunks, idx, i = [], 0, 0

    while i < len(words):
        window = words[i: i + wpc]
        if not window:
            break
        pv: dict[int, int] = {}
        for _, pg, _ in window:
            pv[pg] = pv.get(pg, 0) + 1
        chunks.append({
            "chunk_index": idx,
            "page_number": max(pv, key=lambda p: pv[p]),
            "text":        " ".join(w for _, _, w in window),
            "char_start":  window[0][0],
            "char_end":    window[-1][0] + len(window[-1][2]),
        })
        idx += 1
        i   += step
    return chunks


def _embed(text: str) -> list[float]:
    body = json.dumps({"inputText": text[:8000], "dimensions": EMBED_DIM, "normalize": True})
    for attempt in range(3):
        try:
            resp = bedrock().invoke_model(
                modelId=TITAN_MODEL, body=body,
                contentType="application/json", accept="application/json",
            )
            return json.loads(resp["body"].read())["embedding"]
        except Exception as exc:
            if "ThrottlingException" in type(exc).__name__ and attempt < 2:
                time.sleep(2 ** attempt)
            else:
                raise


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na  = math.sqrt(sum(x * x for x in a))
    nb  = math.sqrt(sum(x * x for x in b))
    return dot / (na * nb) if na and nb else 0.0


def _top_k(query_vec: list[float], chunks: list[dict]) -> list[dict]:
    scored = []
    for c in chunks:
        vec = c.get("embedding")
        if not vec:
            continue
        score = _cosine(query_vec, vec)
        if score >= SIM_THRESHOLD:
            scored.append({**c, "_score": score})
    scored.sort(key=lambda c: c["_score"], reverse=True)
    return scored[:TOP_K]


def _load_chunks_from_db(document_id: str) -> list[dict]:
    table = dynamodb().Table(CHUNKS_TABLE)
    resp  = table.query(
        IndexName="document_id-index",
        KeyConditionExpression=Key("document_id").eq(document_id),
    )
    items = resp.get("Items", [])
    while "LastEvaluatedKey" in resp:
        resp  = table.query(
            IndexName="document_id-index",
            KeyConditionExpression=Key("document_id").eq(document_id),
            ExclusiveStartKey=resp["LastEvaluatedKey"],
        )
        items.extend(resp.get("Items", []))
    for item in items:
        if isinstance(item.get("embedding"), list):
            item["embedding"] = [float(v) for v in item["embedding"]]
        for k in ("page_number", "chunk_index", "char_start", "char_end"):
            if isinstance(item.get(k), Decimal):
                item[k] = int(item[k])
    return items


def _update_doc(document_id: str, fields: dict) -> None:
    table = dynamodb().Table(DOCUMENTS_TABLE)
    names, values, parts = {}, {}, []
    for i, (k, v) in enumerate(fields.items()):
        n, val = f"#f{i}", f":v{i}"
        names[n], values[val] = k, v
        parts.append(f"{n} = {val}")
    table.update_item(
        Key={"document_id": document_id},
        UpdateExpression="SET " + ", ".join(parts),
        ExpressionAttributeNames=names,
        ExpressionAttributeValues=values,
    )


def _process_document(document_id: str, filename: str, file_bytes: bytes) -> None:
    """Full processing pipeline: extract → chunk → embed → store."""
    try:
        _update_doc(document_id, {"status": "processing", "updated_at": now_iso()})

        if filename.lower().endswith(".pdf"):
            pages = _extract_pdf(file_bytes)
        else:
            pages = _extract_txt(file_bytes)

        if not pages:
            raise ValueError("No text could be extracted from the document")

        page_count = max(p["page"] for p in pages)
        _update_doc(document_id, {"page_count": page_count})

        raw_chunks = _chunk_pages(pages)
        if not raw_chunks:
            raise ValueError("Document produced no text chunks")

        enriched = []
        for chunk in raw_chunks:
            vec = _embed(chunk["text"])
            enriched.append({
                "chunk_id":      f"{document_id}#{chunk['chunk_index']}",
                "document_id":   document_id,
                "document_name": filename,
                "page_number":   chunk["page_number"],
                "chunk_index":   chunk["chunk_index"],
                "text":          chunk["text"],
                "char_start":    chunk["char_start"],
                "char_end":      chunk["char_end"],
                "embedding":     [Decimal(str(round(v, 7))) for v in vec],
            })

        table = dynamodb().Table(CHUNKS_TABLE)
        with table.batch_writer() as bw:
            for c in enriched:
                bw.put_item(Item=c)

        _update_doc(document_id, {
            "status":      "ready",
            "page_count":  page_count,
            "chunk_count": len(enriched),
            "updated_at":  now_iso(),
        })
        logger.info("Document %s ready  (%d chunks)", document_id, len(enriched))

    except Exception as exc:
        logger.error("Processing failed for %s: %s", document_id, exc, exc_info=True)
        _update_doc(document_id, {
            "status":        "failed",
            "error_message": str(exc)[:500],
            "updated_at":    now_iso(),
        })


def _build_context(chunks: list[dict]) -> str:
    budget = 9000 // len(chunks)
    parts  = []
    for i, c in enumerate(chunks, 1):
        text = c.get("text", "").strip()
        if len(text) > budget:
            text = text[:budget] + "…"
        parts.append(f"[Source {i} | Page {c.get('page_number', '?')}]\n{text}")
    return "\n\n---\n\n".join(parts)


def _call_claude(question: str, context: str) -> str:
    system = """\
You are CiteWise AI, a precise document Q&A assistant.

STRICT RULES:
1. Answer ONLY from the provided source chunks. Zero outside knowledge.
2. Every factual claim MUST end with an inline citation marker [1], [2], etc.
3. If sources lack the answer, say so clearly.

REQUIRED OUTPUT — return ONLY valid JSON, no markdown fences:
{
  "answer": "<answer with inline [N] markers>",
  "citations": [
    {"citation_number": 1, "page_number": <int>, "chunk_index": <int>, "quote": "<verbatim ≤200 chars>"}
  ]
}"""

    payload = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens":        1024,
        "temperature":       0.0,
        "system":            system,
        "messages":          [{"role": "user", "content": f"QUESTION: {question}\n\nSOURCES:\n{context}\n\nReturn JSON."}],
    })
    resp = bedrock().invoke_model(
        modelId=CLAUDE_MODEL, body=payload,
        contentType="application/json", accept="application/json",
    )
    return json.loads(resp["body"].read())["content"][0]["text"]


def _parse_claude(raw: str, relevant: list[dict]) -> dict:
    cleaned = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", cleaned, re.DOTALL)
        try:
            data = json.loads(m.group()) if m else {}
        except json.JSONDecodeError:
            return {"answer": raw.strip(), "citations": []}

    answer = str(data.get("answer", "")).strip()
    validated = []
    for cit in (data.get("citations") or []):
        if not isinstance(cit, dict) or not cit.get("citation_number"):
            continue
        num = int(cit["citation_number"])
        idx = num - 1
        src = relevant[idx] if 0 <= idx < len(relevant) else {}
        validated.append({
            "citation_number": num,
            "page_number":     int(cit.get("page_number") or src.get("page_number", 1)),
            "chunk_index":     int(cit.get("chunk_index")  or src.get("chunk_index", 0)),
            "quote":           (cit.get("quote") or src.get("text", ""))[:200].strip(),
        })
    return {"answer": answer, "citations": validated}


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/", tags=["health"])
@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "CiteWise AI", "version": "1.0.0"}


@app.post("/upload", status_code=201, tags=["documents"])
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a PDF or TXT file.
    The file is stored in S3, then processed synchronously (extract → chunk → embed).
    Returns document_id and final status.
    """
    filename = file.filename or "upload"
    ext = ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""

    if ext not in ALLOWED_EXTS:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Use .pdf or .txt")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_BYTES:
        raise HTTPException(400, f"File exceeds 10 MB limit ({len(file_bytes):,} bytes)")
    if not file_bytes:
        raise HTTPException(400, "Empty file")

    document_id = new_id()
    s3_key      = f"documents/{document_id}/{filename}"

    # Store in S3 (if configured)
    if S3_BUCKET:
        try:
            s3().put_object(
                Bucket      = S3_BUCKET,
                Key         = s3_key,
                Body        = file_bytes,
                ContentType = file.content_type or "application/octet-stream",
            )
            logger.info("Uploaded to s3://%s/%s", S3_BUCKET, s3_key)
        except Exception as exc:
            logger.error("S3 upload failed: %s", exc, exc_info=True)
            raise HTTPException(500, "Failed to upload file to storage")

    # Create DynamoDB record
    try:
        dynamodb().Table(DOCUMENTS_TABLE).put_item(Item={
            "document_id":   document_id,
            "document_name": filename,
            "s3_key":        s3_key,
            "status":        "processing",
            "page_count":    0,
            "chunk_count":   0,
            "file_size":     len(file_bytes),
            "created_at":    now_iso(),
        })
    except Exception as exc:
        logger.error("DynamoDB put_item failed: %s", exc, exc_info=True)
        raise HTTPException(500, "Failed to create document record")

    # Process synchronously (Render is a long-running server — no Lambda cold-start)
    _process_document(document_id, filename, file_bytes)

    # Return final document state
    result = dynamodb().Table(DOCUMENTS_TABLE).get_item(
        Key={"document_id": document_id}
    ).get("Item", {})

    return _clean(result) or {
        "document_id":   document_id,
        "document_name": filename,
        "status":        "ready",
        "file_size":     len(file_bytes),
        "created_at":    now_iso(),
    }


@app.get("/documents", tags=["documents"])
def list_documents():
    """List all uploaded documents, newest-first."""
    try:
        table = dynamodb().Table(DOCUMENTS_TABLE)
        resp  = table.scan()
        items = resp.get("Items", [])
        while "LastEvaluatedKey" in resp:
            resp  = table.scan(ExclusiveStartKey=resp["LastEvaluatedKey"])
            items.extend(resp.get("Items", []))
        items.sort(key=lambda d: d.get("created_at", ""), reverse=True)
        return {"documents": [_clean(d) for d in items]}
    except Exception as exc:
        logger.error("list_documents: %s", exc, exc_info=True)
        raise HTTPException(500, "Failed to list documents")


@app.get("/documents/{document_id}", tags=["documents"])
def get_document(document_id: str):
    """Get a single document by ID."""
    try:
        result = dynamodb().Table(DOCUMENTS_TABLE).get_item(
            Key={"document_id": document_id}
        )
        item = result.get("Item")
        if not item:
            raise HTTPException(404, f"Document '{document_id}' not found")
        return _clean(item)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("get_document: %s", exc, exc_info=True)
        raise HTTPException(500, "Failed to get document")


@app.delete("/documents/{document_id}", tags=["documents"])
def delete_document(document_id: str):
    """Delete a document and all its chunks."""
    try:
        db    = dynamodb()
        docs  = db.Table(DOCUMENTS_TABLE)

        if not docs.get_item(Key={"document_id": document_id}).get("Item"):
            raise HTTPException(404, f"Document '{document_id}' not found")

        chunks_tbl   = db.Table(CHUNKS_TABLE)
        chunk_result = chunks_tbl.query(
            IndexName="document_id-index",
            KeyConditionExpression=Key("document_id").eq(document_id),
            ProjectionExpression="chunk_id",
        )
        chunk_keys = chunk_result.get("Items", [])
        while "LastEvaluatedKey" in chunk_result:
            chunk_result = chunks_tbl.query(
                IndexName="document_id-index",
                KeyConditionExpression=Key("document_id").eq(document_id),
                ProjectionExpression="chunk_id",
                ExclusiveStartKey=chunk_result["LastEvaluatedKey"],
            )
            chunk_keys.extend(chunk_result.get("Items", []))

        if chunk_keys:
            with chunks_tbl.batch_writer() as bw:
                for ck in chunk_keys:
                    bw.delete_item(Key={"chunk_id": ck["chunk_id"]})

        docs.delete_item(Key={"document_id": document_id})
        return {"deleted": document_id, "chunks_deleted": len(chunk_keys)}

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("delete_document: %s", exc, exc_info=True)
        raise HTTPException(500, "Failed to delete document")


def _run_rag(document_id: str, question: str) -> dict:
    """Shared RAG logic for both /documents/{id}/query and /ask."""
    t0 = time.time()

    if not question.strip():
        raise HTTPException(400, "question is required")
    if len(question) > 2000:
        raise HTTPException(400, "question must be ≤ 2000 characters")

    # Load document
    try:
        result = dynamodb().Table(DOCUMENTS_TABLE).get_item(
            Key={"document_id": document_id}
        )
        doc = result.get("Item")
    except Exception as exc:
        logger.error("get_doc: %s", exc, exc_info=True)
        raise HTTPException(500, "Failed to load document")

    if not doc:
        raise HTTPException(404, f"Document '{document_id}' not found")
    if doc.get("status") != "ready":
        raise HTTPException(400, f"Document is not ready (status='{doc.get('status')}')")

    # Embed question
    try:
        q_vec = _embed(question)
    except Exception as exc:
        logger.error("Embedding failed: %s", exc, exc_info=True)
        raise HTTPException(500, "Failed to embed question")

    # Load + rank chunks
    try:
        all_chunks = _load_chunks_from_db(document_id)
    except Exception as exc:
        logger.error("load_chunks: %s", exc, exc_info=True)
        raise HTTPException(500, "Failed to load document chunks")

    if not all_chunks:
        return {"answer": "This document has no processable content.", "citations": [], "chunks_used": 0, "latency_ms": int((time.time()-t0)*1000)}

    relevant = _top_k(q_vec, all_chunks)
    if not relevant:
        return {"answer": "I could not find relevant information in this document to answer your question.", "citations": [], "chunks_used": 0, "latency_ms": int((time.time()-t0)*1000)}

    # Generate answer
    try:
        raw = _call_claude(question, _build_context(relevant))
    except Exception as exc:
        logger.error("Claude failed: %s", exc, exc_info=True)
        raise HTTPException(500, "Failed to generate answer. Please try again.")

    parsed = _parse_claude(raw, relevant)
    return {**parsed, "chunks_used": len(relevant), "latency_ms": int((time.time()-t0)*1000)}


@app.post("/documents/{document_id}/query", tags=["query"])
def query_document(document_id: str, body: AskRequest):
    """Ask a question about a specific document."""
    return _run_rag(document_id, body.question)


@app.post("/ask", tags=["query"])
def ask(body: AskRequest):
    """Ask a question — document_id must be in the request body."""
    if not body.document_id:
        raise HTTPException(400, "document_id is required in the request body")
    return _run_rag(body.document_id, body.question)


# ── Entry point ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
