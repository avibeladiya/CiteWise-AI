"""
document-processor Lambda
Triggered by S3 ObjectCreated event (not HTTP).

Flow:
  1. Parse S3 event → bucket + key → derive document_id
  2. Mark document status = "processing"
  3. Download file from S3 into memory
  4. Extract text page-by-page (pypdf for PDF, plain read for TXT)
  5. Truncate to MAX_PAGES
  6. Chunk with overlap via shared utils
  7. Embed each chunk via Bedrock Titan Embeddings V2
  8. Batch-write chunks to DynamoDB chunks table
  9. Update document: status = "ready" (or "failed" on error)
"""
from __future__ import annotations

import io
import json
import logging
import os
from decimal import Decimal

from utils import chunk_pages, embed, get_dynamodb, get_s3, now_iso

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

DOCS_TABLE   = os.environ["DOCUMENTS_TABLE"]
CHUNKS_TABLE = os.environ["CHUNKS_TABLE"]
MAX_PAGES    = int(os.environ.get("MAX_PAGES", "20"))


# ── Text extraction ────────────────────────────────────────────────────────────

def _extract_pdf(file_bytes: bytes) -> list[dict]:
    """Return [{"page": int, "text": str}, ...] from a PDF (up to MAX_PAGES)."""
    try:
        import pypdf  # installed in the Lambda layer
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        pages  = []
        for i, page in enumerate(reader.pages[:MAX_PAGES]):
            text = (page.extract_text() or "").strip()
            if text:
                pages.append({"page": i + 1, "text": text})
        return pages
    except Exception as exc:
        raise ValueError(f"PDF extraction failed: {exc}") from exc


def _extract_txt(file_bytes: bytes) -> list[dict]:
    """Split TXT on form-feed (\f) as page breaks; treat whole file as page 1 otherwise."""
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


# ── DynamoDB helpers ───────────────────────────────────────────────────────────

def _update_doc(document_id: str, fields: dict) -> None:
    table = get_dynamodb().Table(DOCS_TABLE)
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


def _save_chunks(chunks: list[dict]) -> None:
    table = get_dynamodb().Table(CHUNKS_TABLE)
    with table.batch_writer() as bw:
        for c in chunks:
            # Store embedding as Decimal list (DynamoDB native numeric type)
            bw.put_item(Item={
                **c,
                "embedding": [Decimal(str(round(v, 7))) for v in c["embedding"]],
            })


# ── Main handler ───────────────────────────────────────────────────────────────

def lambda_handler(event: dict, _ctx) -> None:
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key    = record["s3"]["object"]["key"]
        parts  = key.split("/")                  # documents/{doc_id}/{filename}
        if len(parts) < 3:
            logger.warning("Unexpected key format: %s", key)
            continue
        document_id   = parts[1]
        document_name = parts[2]
        logger.info("Processing document_id=%s  key=%s", document_id, key)
        _process(bucket, key, document_id, document_name)


def _process(bucket: str, key: str, document_id: str, document_name: str) -> None:
    try:
        # 1. Mark processing
        _update_doc(document_id, {"status": "processing", "updated_at": now_iso()})

        # 2. Download
        logger.info("Downloading s3://%s/%s", bucket, key)
        obj_bytes = get_s3().get_object(Bucket=bucket, Key=key)["Body"].read()
        logger.info("Downloaded %d bytes", len(obj_bytes))

        # 3. Extract
        if key.lower().endswith(".pdf"):
            pages = _extract_pdf(obj_bytes)
        else:
            pages = _extract_txt(obj_bytes)

        if not pages:
            raise ValueError("No text could be extracted from the document")

        page_count = max(p["page"] for p in pages)
        logger.info("Extracted %d pages (%d chars)",
                    page_count, sum(len(p["text"]) for p in pages))
        _update_doc(document_id, {"page_count": page_count})

        # 4. Chunk
        raw_chunks = chunk_pages(pages, target_tokens=600, overlap_tokens=80)
        if not raw_chunks:
            raise ValueError("Document produced no text chunks after splitting")
        logger.info("Created %d chunks", len(raw_chunks))

        # 5. Embed
        enriched = []
        for chunk in raw_chunks:
            vec = embed(chunk["text"])
            enriched.append({
                "chunk_id":      f"{document_id}#{chunk['chunk_index']}",
                "document_id":   document_id,
                "document_name": document_name,
                "page_number":   chunk["page_number"],
                "chunk_index":   chunk["chunk_index"],
                "text":          chunk["text"],
                "char_start":    chunk["char_start"],
                "char_end":      chunk["char_end"],
                "embedding":     vec,
            })

        # 6. Save chunks
        _save_chunks(enriched)
        logger.info("Saved %d chunks", len(enriched))

        # 7. Mark ready
        _update_doc(document_id, {
            "status":      "ready",
            "page_count":  page_count,
            "chunk_count": len(enriched),
            "updated_at":  now_iso(),
        })
        logger.info("Document %s ready (%d chunks)", document_id, len(enriched))

    except Exception as exc:
        logger.error("Processing failed for %s: %s", document_id, exc, exc_info=True)
        try:
            _update_doc(document_id, {
                "status":        "failed",
                "error_message": str(exc)[:500],
                "updated_at":    now_iso(),
            })
        except Exception as inner:
            logger.error("Could not update failure status: %s", inner)
