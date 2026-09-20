"""CiteWise RAG primitives: extract, chunk, BM25 retrieve, grounded generate."""
from __future__ import annotations

import json
import math
import os
import re
from collections import Counter
from typing import Any

import httpx
import pypdf

MAX_PAGES = 20
TARGET_WORDS = 180
OVERLAP_WORDS = 30
TOP_K = 5
STOP = {
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her",
    "was", "one", "our", "out", "has", "have", "this", "that", "with", "from",
    "they", "been", "said", "each", "which", "their", "will", "other", "about",
    "what", "when", "where", "who", "how", "why", "into", "than", "then", "them",
}


def extract_pdf(data: bytes) -> list[dict[str, Any]]:
    reader = pypdf.PdfReader(__import__("io").BytesIO(data))
    pages: list[dict[str, Any]] = []
    for i, page in enumerate(reader.pages[:MAX_PAGES]):
        text = (page.extract_text() or "").strip()
        if text:
            pages.append({"page": i + 1, "text": text})
    if not pages:
        raise ValueError("No text could be extracted from this PDF.")
    return pages


def extract_txt(data: bytes) -> list[dict[str, Any]]:
    raw = data.decode("utf-8", errors="replace")
    parts = [p.strip() for p in re.split(r"\f|(?=^Page\s+\d+)", raw, flags=re.M) if p.strip()]
    pages: list[dict[str, Any]] = []
    preamble = ""
    for part in parts:
        labeled = re.match(r"Page\s+(\d+)", part, flags=re.I)
        if not labeled:
            preamble = f"{preamble}\n\n{part}" if preamble else part
            continue
        text = f"{preamble}\n\n{part}" if preamble else part
        preamble = ""
        pages.append({"page": int(labeled.group(1)), "text": text})
        if len(pages) >= MAX_PAGES:
            break
    if preamble:
        if not pages:
            pages.append({"page": 1, "text": preamble})
        else:
            pages[-1]["text"] += f"\n\n{preamble}"
    if not pages and raw.strip():
        pages.append({"page": 1, "text": raw.strip()})
    if not pages:
        raise ValueError("That file is empty.")
    return pages[:MAX_PAGES]


def chunk_pages(pages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    step = max(1, TARGET_WORDS - OVERLAP_WORDS)
    chunks: list[dict[str, Any]] = []
    idx = 0
    for page in pages:
        words = page["text"].split()
        if not words:
            continue
        i = 0
        while i < len(words):
            window = words[i : i + TARGET_WORDS]
            if not window:
                break
            text = " ".join(window)
            chunks.append({
                "chunk_index": idx,
                "page_number": page["page"],
                "text": text,
                "char_start": 0,
                "char_end": len(text),
            })
            idx += 1
            if i + TARGET_WORDS >= len(words):
                break
            i += step
    return chunks


def _tokenize(text: str) -> list[str]:
    return [
        t for t in re.sub(r"[^a-z0-9\s]", " ", text.lower()).split()
        if (len(t) > 2 or any(ch.isdigit() for ch in t)) and t not in STOP
    ]


def retrieve(query: str, chunks: list[dict[str, Any]], k: int = TOP_K) -> list[dict[str, Any]]:
    if not chunks:
        return []
    docs = [_tokenize(c["text"]) for c in chunks]
    df: Counter[str] = Counter()
    for tokens in docs:
        df.update(set(tokens))
    n_docs = len(docs)
    avgdl = sum(len(d) for d in docs) / max(n_docs, 1)
    k1, b = 1.5, 0.75
    q = _tokenize(query)
    scored: list[tuple[float, int]] = []
    for i, tokens in enumerate(docs):
        tf = Counter(tokens)
        dl = len(tokens) or 1
        score = 0.0
        covered = 0
        for term in set(q):
            f = tf.get(term, 0)
            if not f:
                continue
            covered += 1
            n = df.get(term, 0)
            idf = math.log((n_docs - n + 0.5) / (n + 0.5) + 1)
            score += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * dl / avgdl))
        coverage = covered / len(set(q)) if q else 0
        scored.append((score * (0.2 + 0.8 * coverage), i))
    scored.sort(reverse=True)
    positive = [s for s in scored if s[0] > 0][:k] or scored[:k]
    out = []
    for score, i in positive:
        item = dict(chunks[i])
        item["score"] = score
        out.append(item)
    return out


def _quote(text: str, n: int = 220) -> str:
    clean = re.sub(r"\s+", " ", text).strip()
    return clean[:n].rstrip() + ("…" if len(clean) > n else "")


def _snap(quote: str, num: int, chunks: list[dict[str, Any]]) -> dict[str, Any]:
    needle = re.sub(r"\s+", " ", quote).strip().lower()[:72]
    if len(needle) > 18:
        for chunk in chunks:
            if needle[:48] in chunk["text"].lower():
                return chunk
    if 0 <= num - 1 < len(chunks):
        return chunks[num - 1]
    return chunks[0]


def extractive(question: str, chunks: list[dict[str, Any]]) -> dict[str, Any]:
    terms = [t for t in _tokenize(question) if len(t) > 3]
    citations = []
    for i, chunk in enumerate(chunks[:4], start=1):
        sentences = re.split(r"(?<=[.!?])\s+", chunk["text"])
        best = next((s for s in sentences if any(t in s.lower() for t in terms)), sentences[0] if sentences else chunk["text"])
        citations.append({
            "citation_number": i,
            "page_number": chunk["page_number"],
            "chunk_index": chunk["chunk_index"],
            "quote": _quote(best),
            "score": chunk.get("score"),
        })
    answer = " ".join(f"{c['quote']} [{c['citation_number']}]" for c in citations)
    return {"answer": answer, "citations": citations, "chunks_used": len(chunks), "grounded": True}


async def generate(question: str, document_name: str, chunks: list[dict[str, Any]]) -> dict[str, Any]:
    fallback = extractive(question, chunks)
    api_key = os.environ.get("XAI_API_KEY") or os.environ.get("GROK_API_KEY")
    if not api_key:
        return fallback

    context = []
    for i, chunk in enumerate(chunks, start=1):
        text = chunk["text"][:900]
        context.append(f"[Source {i} | Page {chunk['page_number']} | Chunk {chunk['chunk_index']}]\n{text}")
    system = (
        f'You are CiteWise, a document Q&A assistant for "{document_name}".\n'
        "STRICT RULES:\n"
        "1. Answer ONLY from the provided source chunks. No outside knowledge.\n"
        "2. Every factual claim must include an inline citation marker like [1] or [2].\n"
        "3. If the sources do not contain the answer, say so clearly.\n"
        "4. Return ONLY valid JSON — no markdown fences:\n"
        '{"answer":"<prose with [N] markers>","citations":[{"citation_number":1,"page_number":1,"chunk_index":0,"quote":"<verbatim ≤200 chars>"}]}'
    )
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            res = await client.post(
                "https://api.x.ai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "grok-4.5",
                    "temperature": 0,
                    "max_tokens": 700,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": f"QUESTION: {question}\n\nSOURCES:\n" + "\n\n---\n\n".join(context) + "\n\nReturn JSON."},
                    ],
                },
            )
            res.raise_for_status()
            raw = res.json()["choices"][0]["message"]["content"]
    except Exception:
        return fallback

    cleaned = re.sub(r"```(?:json)?", "", raw).strip().strip("`")
    match = re.search(r"\{.*\}", cleaned, re.S)
    try:
        data = json.loads(match.group() if match else cleaned)
    except json.JSONDecodeError:
        return fallback

    citations = []
    for i, item in enumerate(data.get("citations") or []):
        if not isinstance(item, dict):
            continue
        num = int(item.get("citation_number") or i + 1)
        quote = _quote(str(item.get("quote") or ""))
        src = _snap(quote, num, chunks)
        citations.append({
            "citation_number": num,
            "page_number": src["page_number"],
            "chunk_index": src["chunk_index"],
            "quote": quote or _quote(src["text"]),
            "score": src.get("score"),
        })
    return {
        "answer": str(data.get("answer") or fallback["answer"]).strip(),
        "citations": citations,
        "chunks_used": len(chunks),
        "grounded": True,
    }
