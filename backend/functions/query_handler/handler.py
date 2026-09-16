"""
query-handler Lambda
POST /documents/{id}/query   OR   POST /ask

Request body:
    { "question": "What does the document say about X?",
      "document_id": "<uuid>"   // only needed for /ask route
    }

Response:
    {
      "answer": "...",
      "citations": [
        { "citation_number": 1, "page_number": 3, "chunk_index": 7, "quote": "..." }
      ],
      "chunks_used": 4,
      "latency_ms": 1230
    }

RAG Pipeline:
  1. Validate document (status must be "ready")
  2. Embed question → Titan V2
  3. Load all chunks from DynamoDB (GSI)
  4. Cosine similarity → top-K chunks
  5. Build context block + strict citation system prompt
  6. Call Claude 3 Haiku (temperature=0 for determinism)
  7. Parse JSON response → enrich citations → return
"""
from __future__ import annotations

import json
import logging
import os
import re
import time
from decimal import Decimal

from boto3.dynamodb.conditions import Key

from utils import (
    bad_req, not_found, ok, server_err,
    embed, top_k_chunks,
    get_bedrock, get_dynamodb,
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

DOCS_TABLE      = os.environ["DOCUMENTS_TABLE"]
CHUNKS_TABLE    = os.environ["CHUNKS_TABLE"]
TOP_K           = int(os.environ.get("TOP_K", "5"))
SIM_THRESHOLD   = float(os.environ.get("SIM_THRESHOLD", "0.25"))
CLAUDE_MODEL    = "anthropic.claude-3-haiku-20240307-v1:0"
MAX_OUT_TOKENS  = 1024
MAX_CONTEXT_CH  = 9000   # total characters across all context chunks


# ── Handler ────────────────────────────────────────────────────────────────────

def lambda_handler(event: dict, _ctx) -> dict:
    t0 = time.time()

    if (event.get("requestContext", {}).get("http", {}).get("method", "")).upper() == "OPTIONS":
        return {"statusCode": 200, "headers": {
            "Access-Control-Allow-Origin":  "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
        }, "body": ""}

    # ── Parse body ─────────────────────────────────────────────────────────────
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return bad_req("Invalid JSON body")

    question = (body.get("question") or "").strip()
    if not question:
        return bad_req("question is required")
    if len(question) > 2000:
        return bad_req("question must be ≤ 2000 characters")

    params      = event.get("pathParameters") or {}
    document_id = params.get("id") or (body.get("document_id") or "").strip()
    if not document_id:
        return bad_req("document_id is required")

    # ── Load document ──────────────────────────────────────────────────────────
    doc = _get_doc(document_id)
    if not doc:
        return not_found(f"Document '{document_id}' not found")
    if doc.get("status") != "ready":
        return bad_req(
            f"Document is not ready (status='{doc.get('status')}'). "
            "Please wait for processing to complete."
        )

    # ── Embed question ─────────────────────────────────────────────────────────
    try:
        q_vec = embed(question)
    except Exception as exc:
        logger.error("Embedding failed: %s", exc, exc_info=True)
        return server_err("Failed to embed question")

    # ── Load & rank chunks ─────────────────────────────────────────────────────
    try:
        all_chunks = _load_chunks(document_id)
    except Exception as exc:
        logger.error("load_chunks: %s", exc, exc_info=True)
        return server_err("Failed to load document chunks")

    if not all_chunks:
        return ok({"answer": "This document has no processable content.",
                   "citations": [], "chunks_used": 0,
                   "latency_ms": _ms(t0)})

    relevant = top_k_chunks(q_vec, all_chunks, k=TOP_K, threshold=SIM_THRESHOLD)
    logger.info("%d / %d chunks above threshold %.2f",
                len(relevant), len(all_chunks), SIM_THRESHOLD)

    if not relevant:
        return ok({
            "answer": (
                "I could not find relevant information in this document to "
                "answer your question. Try rephrasing or asking about a "
                "topic covered in the document."
            ),
            "citations": [], "chunks_used": 0, "latency_ms": _ms(t0),
        })

    # ── Build prompt ───────────────────────────────────────────────────────────
    context_text = _build_context(relevant)
    system_msg   = _system_prompt()
    user_msg     = f"QUESTION: {question}\n\nSOURCES:\n{context_text}\n\nReturn a valid JSON object."

    # ── Call Claude 3 Haiku ────────────────────────────────────────────────────
    try:
        raw = _call_claude(system_msg, user_msg)
        logger.info("Claude raw (first 300): %s", raw[:300])
    except Exception as exc:
        logger.error("Claude call failed: %s", exc, exc_info=True)
        return server_err("Failed to generate answer. Please try again.")

    # ── Parse response ─────────────────────────────────────────────────────────
    parsed = _parse(raw, relevant)
    return ok({**parsed, "chunks_used": len(relevant), "latency_ms": _ms(t0)})


# ── DynamoDB ───────────────────────────────────────────────────────────────────

def _get_doc(document_id: str) -> dict | None:
    result = get_dynamodb().Table(DOCS_TABLE).get_item(Key={"document_id": document_id})
    item   = result.get("Item")
    if item:
        for k, v in item.items():
            if isinstance(v, Decimal):
                item[k] = int(v) if v == int(v) else float(v)
    return item


def _load_chunks(document_id: str) -> list[dict]:
    """Query chunks table via document_id GSI; deserialise Decimal embeddings."""
    table  = get_dynamodb().Table(CHUNKS_TABLE)
    resp   = table.query(
        IndexName="document_id-index",
        KeyConditionExpression=Key("document_id").eq(document_id),
    )
    items  = resp.get("Items", [])
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


# ── Prompt helpers ─────────────────────────────────────────────────────────────

def _build_context(chunks: list[dict]) -> str:
    budget_each = MAX_CONTEXT_CH // len(chunks)
    parts = []
    for i, c in enumerate(chunks, 1):
        text = c.get("text", "").strip()
        if len(text) > budget_each:
            text = text[:budget_each] + "…"
        parts.append(f"[Source {i} | Page {c.get('page_number', '?')}]\n{text}")
    return "\n\n---\n\n".join(parts)


def _system_prompt() -> str:
    return """\
You are CiteWise AI, a precise document Q&A assistant.

STRICT RULES (never violate these):
1. Answer ONLY from the provided source chunks. Use zero outside knowledge.
2. Every factual claim MUST end with an inline citation marker [1], [2], etc.
3. If sources lack enough information, reply that you could not find it.
4. Be concise and accurate.

REQUIRED OUTPUT FORMAT — return ONLY this JSON (no markdown fences, no extra text):
{
  "answer": "<your answer with inline [1] [2] markers after each claim>",
  "citations": [
    {
      "citation_number": 1,
      "page_number": <int>,
      "chunk_index": <int>,
      "quote": "<verbatim excerpt from the source chunk, max 200 chars>"
    }
  ]
}

Rules for citations:
- citation_number must match the [N] marker in the answer.
- quote must be a verbatim substring of the corresponding source.
- Trim quotes to ≤ 200 characters while keeping them meaningful.
- If no relevant information: {"answer": "I could not find relevant information in the document.", "citations": []}"""


# ── Claude call ────────────────────────────────────────────────────────────────

def _call_claude(system: str, user: str) -> str:
    payload = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens":        MAX_OUT_TOKENS,
        "temperature":       0.0,
        "top_p":             0.9,
        "system":            system,
        "messages":          [{"role": "user", "content": user}],
    })
    resp = get_bedrock().invoke_model(
        modelId=CLAUDE_MODEL, body=payload,
        contentType="application/json", accept="application/json",
    )
    return json.loads(resp["body"].read())["content"][0]["text"]


# ── Response parser ────────────────────────────────────────────────────────────

def _parse(raw: str, relevant: list[dict]) -> dict:
    # Strip accidental markdown fences
    cleaned = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", cleaned, re.DOTALL)
        try:
            data = json.loads(m.group()) if m else {}
        except json.JSONDecodeError:
            return {"answer": raw.strip(), "citations": []}

    answer    = str(data.get("answer", "")).strip()
    raw_cits  = data.get("citations") or []
    validated = []

    for cit in raw_cits:
        if not isinstance(cit, dict):
            continue
        num = cit.get("citation_number")
        if not num:
            continue

        # Fall back to the relevant chunk at that 1-based index
        idx = int(num) - 1
        src = relevant[idx] if 0 <= idx < len(relevant) else {}

        page  = cit.get("page_number") or src.get("page_number", 1)
        cidx  = cit.get("chunk_index")  or src.get("chunk_index", 0)
        quote = (cit.get("quote") or src.get("text", ""))[:200].strip()

        validated.append({
            "citation_number": int(num),
            "page_number":     int(page),
            "chunk_index":     int(cidx),
            "quote":           quote,
        })

    return {"answer": answer, "citations": validated}


# ── Helpers ────────────────────────────────────────────────────────────────────

def _ms(t0: float) -> int:
    return int((time.time() - t0) * 1000)
