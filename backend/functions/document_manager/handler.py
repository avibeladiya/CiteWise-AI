"""
document-manager Lambda
HTTP routes (via API Gateway):

  GET    /documents        → list all documents, newest-first
  GET    /documents/{id}   → get single document metadata
  DELETE /documents/{id}   → delete document + all chunks
"""
from __future__ import annotations

import logging
import os
from decimal import Decimal

from boto3.dynamodb.conditions import Key

from utils import bad_req, not_found, ok, server_err, get_dynamodb

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

DOCS_TABLE   = os.environ["DOCUMENTS_TABLE"]
CHUNKS_TABLE = os.environ["CHUNKS_TABLE"]


# ── Dispatcher ─────────────────────────────────────────────────────────────────

def lambda_handler(event: dict, _ctx) -> dict:
    method = (event.get("requestContext", {}).get("http", {}).get("method", "")).upper()
    params = event.get("pathParameters") or {}
    doc_id = params.get("id")

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": {
            "Access-Control-Allow-Origin":  "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET,DELETE,OPTIONS",
        }, "body": ""}

    if   method == "GET"    and not doc_id: return list_documents()
    elif method == "GET"    and doc_id:     return get_document(doc_id)
    elif method == "DELETE" and doc_id:     return delete_document(doc_id)

    return bad_req(f"Unrecognised route: {method} {event.get('rawPath', '')}")


# ── Route handlers ─────────────────────────────────────────────────────────────

def list_documents() -> dict:
    try:
        table = get_dynamodb().Table(DOCS_TABLE)
        resp  = table.scan()
        items = resp.get("Items", [])
        while "LastEvaluatedKey" in resp:
            resp  = table.scan(ExclusiveStartKey=resp["LastEvaluatedKey"])
            items.extend(resp.get("Items", []))
        items.sort(key=lambda d: d.get("created_at", ""), reverse=True)
        return ok({"documents": [_clean(d) for d in items]})
    except Exception as exc:
        logger.error("list_documents: %s", exc, exc_info=True)
        return server_err("Failed to list documents")


def get_document(document_id: str) -> dict:
    try:
        result = get_dynamodb().Table(DOCS_TABLE).get_item(Key={"document_id": document_id})
        item   = result.get("Item")
        return ok(_clean(item)) if item else not_found(f"Document '{document_id}' not found")
    except Exception as exc:
        logger.error("get_document: %s", exc, exc_info=True)
        return server_err("Failed to get document")


def delete_document(document_id: str) -> dict:
    try:
        dynamo = get_dynamodb()
        docs   = dynamo.Table(DOCS_TABLE)

        if not docs.get_item(Key={"document_id": document_id}).get("Item"):
            return not_found(f"Document '{document_id}' not found")

        # Delete all chunks via GSI
        chunks_tbl   = dynamo.Table(CHUNKS_TABLE)
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
            logger.info("Deleted %d chunks for document %s", len(chunk_keys), document_id)

        docs.delete_item(Key={"document_id": document_id})
        logger.info("Deleted document %s", document_id)
        return ok({"deleted": document_id, "chunks_deleted": len(chunk_keys)})

    except Exception as exc:
        logger.error("delete_document: %s", exc, exc_info=True)
        return server_err("Failed to delete document")


# ── Helpers ────────────────────────────────────────────────────────────────────

def _clean(item: dict) -> dict:
    """Decimal → int/float for safe JSON serialisation."""
    out = {}
    for k, v in item.items():
        if isinstance(v, Decimal):
            out[k] = int(v) if v == int(v) else float(v)
        else:
            out[k] = v
    return out
