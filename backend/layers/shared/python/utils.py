"""
Shared utilities for CiteWise AI Lambda functions.
Provides: AWS client singletons, HTTP helpers, text chunking,
          Bedrock Titan embeddings, cosine similarity.
"""
from __future__ import annotations

import json
import logging
import math
import os
import time
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

import boto3
from botocore.config import Config

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# ── Environment ────────────────────────────────────────────────────────────────
AWS_REGION     = os.environ.get("AWS_REGION", "us-east-1")
BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "us-east-1")

# ── Lazy AWS client singletons (survive warm Lambda re-use) ───────────────────
_bedrock: Any  = None
_dynamodb: Any = None
_s3: Any       = None


def get_bedrock():
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


def get_dynamodb():
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
    return _dynamodb


def get_s3():
    global _s3
    if _s3 is None:
        _s3 = boto3.client("s3", region_name=AWS_REGION)
    return _s3


# ── HTTP response helpers ──────────────────────────────────────────────────────
CORS_HEADERS = {
    "Access-Control-Allow-Origin":  os.environ.get("CORS_ORIGIN", "*"),
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Content-Type": "application/json",
}


def _serial(obj: Any) -> Any:
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Not serializable: {type(obj)}")


def http_resp(status: int, body: Any) -> dict:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, default=_serial),
    }


def ok(body: Any) -> dict:
    return http_resp(200, body)

def created(body: Any) -> dict:
    return http_resp(201, body)

def bad_req(msg: str) -> dict:
    return http_resp(400, {"error": msg})

def not_found(msg: str = "Not found") -> dict:
    return http_resp(404, {"error": msg})

def server_err(msg: str = "Internal server error") -> dict:
    return http_resp(500, {"error": msg})


# ── Identifiers & timestamps ───────────────────────────────────────────────────
def new_id() -> str:
    return str(uuid.uuid4())

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Text chunking ──────────────────────────────────────────────────────────────
def chunk_pages(
    pages: list[dict],          # [{"page": int, "text": str}, ...]
    target_tokens: int = 600,
    overlap_tokens: int = 80,
) -> list[dict]:
    """
    Split pages into overlapping token-aware chunks.

    Each chunk dict:
        chunk_index, page_number, text, char_start, char_end
    """
    # Flatten to word-level list: (global_offset, page_number, word)
    words: list[tuple[int, int, str]] = []
    offset = 0
    for page in pages:
        for word in page["text"].split():
            words.append((offset, page["page"], word))
            offset += len(word) + 1

    if not words:
        return []

    # 1 word ≈ 1.3 tokens
    wpc  = max(10, int(target_tokens / 1.3))
    wpo  = max(0,  int(overlap_tokens / 1.3))
    step = max(1,  wpc - wpo)

    chunks, idx, i = [], 0, 0
    while i < len(words):
        window = words[i: i + wpc]
        if not window:
            break

        # Dominant page = most words
        page_votes: dict[int, int] = {}
        for _, pg, _ in window:
            page_votes[pg] = page_votes.get(pg, 0) + 1
        dominant_page = max(page_votes, key=lambda p: page_votes[p])

        chunks.append({
            "chunk_index": idx,
            "page_number": dominant_page,
            "text":        " ".join(w for _, _, w in window),
            "char_start":  window[0][0],
            "char_end":    window[-1][0] + len(window[-1][2]),
        })
        idx += 1
        i   += step

    return chunks


# ── Bedrock Titan Embeddings V2 ────────────────────────────────────────────────
TITAN_MODEL = "amazon.titan-embed-text-v2:0"
EMBED_DIM   = 1024   # Titan V2 supports 256/512/1024; 1024 = highest quality


def embed(text: str) -> list[float]:
    """
    Embed text via Amazon Bedrock Titan Embeddings V2.
    Retries up to 3x on throttling with exponential back-off.
    """
    client = get_bedrock()
    body   = json.dumps({
        "inputText":  text[:8000],   # Titan V2 character limit
        "dimensions": EMBED_DIM,
        "normalize":  True,
    })
    for attempt in range(3):
        try:
            resp   = client.invoke_model(
                modelId=TITAN_MODEL, body=body,
                contentType="application/json", accept="application/json",
            )
            return json.loads(resp["body"].read())["embedding"]
        except Exception as exc:
            if "ThrottlingException" in type(exc).__name__ and attempt < 2:
                wait = 2 ** attempt
                logger.warning("Titan throttled; retrying in %ds", wait)
                time.sleep(wait)
            else:
                raise


# ── Cosine similarity (pure Python – no numpy required) ───────────────────────
def cosine_sim(a: list[float], b: list[float]) -> float:
    dot  = sum(x * y for x, y in zip(a, b))
    na   = math.sqrt(sum(x * x for x in a))
    nb   = math.sqrt(sum(x * x for x in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def top_k_chunks(
    query_vec: list[float],
    chunks: list[dict],
    k: int = 5,
    threshold: float = 0.25,
) -> list[dict]:
    """Return the k most similar chunks above the similarity threshold."""
    scored = []
    for c in chunks:
        vec = c.get("embedding")
        if not vec:
            continue
        score = cosine_sim(query_vec, vec)
        if score >= threshold:
            scored.append({**c, "_score": score})
    scored.sort(key=lambda c: c["_score"], reverse=True)
    return scored[:k]
