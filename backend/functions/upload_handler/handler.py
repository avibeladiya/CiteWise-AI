"""
upload-handler Lambda
POST /upload

Validates the upload request, writes a document record to DynamoDB,
and returns a presigned S3 PUT URL so the browser can upload directly.

Request body (JSON):
    { "filename": "report.pdf", "content_type": "application/pdf", "file_size": 1048576 }

Response (201):
    { "document_id": "...", "upload_url": "...", "s3_key": "..." }
"""
from __future__ import annotations

import json
import logging
import os

from utils import bad_req, created, server_err, get_dynamodb, get_s3, new_id, now_iso

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

DOCS_TABLE    = os.environ["DOCUMENTS_TABLE"]
S3_BUCKET     = os.environ["DOCUMENTS_BUCKET"]
MAX_BYTES     = 10 * 1024 * 1024   # 10 MB
ALLOWED_EXTS  = {".pdf", ".txt"}
ALLOWED_TYPES = {"application/pdf", "text/plain"}
PRESIGN_TTL   = 900                # 15 minutes


def lambda_handler(event: dict, _ctx) -> dict:
    method = (event.get("requestContext", {}).get("http", {}).get("method", "")).upper()

    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin":  "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST,OPTIONS",
            },
            "body": "",
        }

    # ── Parse body ─────────────────────────────────────────────────────────────
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return bad_req("Invalid JSON body")

    filename     = (body.get("filename") or "").strip()
    content_type = (body.get("content_type") or "").strip().lower()
    file_size    = body.get("file_size", 0)

    # ── Validate ───────────────────────────────────────────────────────────────
    if not filename:
        return bad_req("filename is required")

    ext = ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""
    if ext not in ALLOWED_EXTS:
        return bad_req(f"Unsupported file type '{ext}'. Only .pdf and .txt are allowed.")

    # Normalise content-type if browser sends application/octet-stream
    if content_type not in ALLOWED_TYPES:
        content_type = "application/pdf" if ext == ".pdf" else "text/plain"

    try:
        file_size = int(file_size)
    except (TypeError, ValueError):
        return bad_req("file_size must be a positive integer")

    if file_size <= 0:
        return bad_req("file_size must be > 0")
    if file_size > MAX_BYTES:
        return bad_req(f"File exceeds 10 MB limit ({file_size:,} bytes provided)")

    # ── Create DynamoDB record ─────────────────────────────────────────────────
    document_id = new_id()
    s3_key      = f"documents/{document_id}/{filename}"

    try:
        get_dynamodb().Table(DOCS_TABLE).put_item(Item={
            "document_id":   document_id,
            "document_name": filename,
            "s3_key":        s3_key,
            "status":        "uploading",
            "page_count":    0,
            "chunk_count":   0,
            "file_size":     file_size,
            "created_at":    now_iso(),
        })
    except Exception as exc:
        logger.error("DynamoDB put_item failed: %s", exc, exc_info=True)
        return server_err("Failed to create document record")

    # ── Generate presigned S3 PUT URL ──────────────────────────────────────────
    try:
        upload_url = get_s3().generate_presigned_url(
            "put_object",
            Params={"Bucket": S3_BUCKET, "Key": s3_key, "ContentType": content_type},
            ExpiresIn=PRESIGN_TTL,
        )
    except Exception as exc:
        logger.error("Presign failed: %s", exc, exc_info=True)
        return server_err("Failed to generate upload URL")

    logger.info("Upload initiated: document_id=%s key=%s", document_id, s3_key)
    return created({"document_id": document_id, "upload_url": upload_url, "s3_key": s3_key})
