"""CiteWise AI — FastAPI RAG service for Render."""
from __future__ import annotations

import os
import time
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from rag import chunk_pages, extract_pdf, extract_txt, generate, retrieve

MAX_BYTES = 10 * 1024 * 1024
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()]

app = FastAPI(title="CiteWise AI", version="2.0.0", description="Grounded document Q&A with exact citations.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store. Render free-tier disks are ephemeral; this is the intended contract.
DOCS: dict[str, dict[str, Any]] = {}
CHUNKS: dict[str, list[dict[str, Any]]] = {}


class AskBody(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    document_id: str | None = None


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def public_doc(doc: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in doc.items() if k != "raw"}


@app.get("/")
@app.get("/health")
def health():
    return {"status": "ok", "service": "CiteWise AI", "version": "2.0.0"}


@app.post("/upload", status_code=201)
async def upload(file: UploadFile = File(...)):
    filename = file.filename or "upload"
    ext = ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""
    if ext not in {".pdf", ".txt"}:
        raise HTTPException(400, "Use a PDF or TXT file.")
    data = await file.read()
    if not data:
        raise HTTPException(400, "That file is empty.")
    if len(data) > MAX_BYTES:
        raise HTTPException(400, "File exceeds the 10 MB limit.")

    document_id = str(uuid.uuid4())
    doc = {
        "document_id": document_id,
        "document_name": filename,
        "status": "processing",
        "page_count": 0,
        "chunk_count": 0,
        "file_size": len(data),
        "created_at": now_iso(),
    }
    DOCS[document_id] = doc
    try:
        pages = extract_pdf(data) if ext == ".pdf" else extract_txt(data)
        chunks = chunk_pages(pages)
        if not chunks:
            raise ValueError("Document produced no text chunks.")
        CHUNKS[document_id] = chunks
        doc.update({
            "status": "ready",
            "page_count": max(p["page"] for p in pages),
            "chunk_count": len(chunks),
        })
    except Exception as exc:
        doc["status"] = "failed"
        doc["error_message"] = str(exc)[:500]
        raise HTTPException(400, doc["error_message"]) from exc
    return public_doc(doc)


@app.get("/documents")
def list_documents():
    items = sorted(DOCS.values(), key=lambda d: d["created_at"], reverse=True)
    return {"documents": [public_doc(d) for d in items]}


@app.get("/documents/{document_id}")
def get_document(document_id: str):
    doc = DOCS.get(document_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    return public_doc(doc)


@app.delete("/documents/{document_id}")
def delete_document(document_id: str):
    if document_id not in DOCS:
        raise HTTPException(404, "Document not found")
    del DOCS[document_id]
    CHUNKS.pop(document_id, None)
    return {"deleted": document_id}


@app.post("/documents/{document_id}/query")
async def query_document(document_id: str, body: AskBody):
    return await _ask(document_id, body.question)


@app.post("/ask")
async def ask(body: AskBody):
    if not body.document_id:
        raise HTTPException(400, "document_id is required")
    return await _ask(body.document_id, body.question)


async def _ask(document_id: str, question: str) -> dict[str, Any]:
    t0 = time.time()
    doc = DOCS.get(document_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.get("status") != "ready":
        raise HTTPException(400, "Document is still processing")
    chunks = CHUNKS.get(document_id) or []
    top = retrieve(question, chunks)
    if not top:
        return {
            "answer": "I could not find relevant information in this document.",
            "citations": [],
            "chunks_used": 0,
            "latency_ms": int((time.time() - t0) * 1000),
            "grounded": True,
        }
    result = await generate(question, doc["document_name"], top)
    result["latency_ms"] = int((time.time() - t0) * 1000)
    return result
