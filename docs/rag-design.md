# RAG Pipeline Design Decisions

## Why RAG (not fine-tuning)?

CiteWise AI uses **Retrieval-Augmented Generation** rather than fine-tuning because:

1. **No training required** — documents are uploaded at runtime, not training time
2. **Always current** — new documents are indexed in seconds, not hours
3. **Verifiable** — retrieved chunks are explicit, making citations tractable
4. **Cost-effective** — no fine-tuning costs; pay only for inference
5. **Grounded** — the model is constrained to the retrieved context, reducing hallucination

## Chunking: Why ~600 tokens with 80-token overlap?

**Target size (600 tokens ≈ 460 words):**
- Large enough to contain a complete idea or paragraph
- Small enough to be specific and avoid "noisy" retrieval
- Within Claude's ability to quote accurately
- Well within Titan V2's 8,000-character input limit

**Overlap (80 tokens ≈ 62 words):**
- Prevents context loss at chunk boundaries
- A sentence that spans two chunks will appear in both, ensuring it's retrievable
- Small enough not to double-count too much

**Word-level splitting (not sentence or token):**
- No external tokenizer or NLP library needed in Lambda
- Sentence boundaries are imprecise across document types
- Consistent and deterministic across all document formats

## Embeddings: Why Titan V2 at 1024 dimensions?

- **Native AWS** — no third-party API keys, no egress costs, same IAM auth
- **1024 dimensions** — balances quality vs. storage cost (256/512 also available)
- **Normalised vectors** — cosine similarity reduces to a dot product, slightly faster
- **Supports 8,000 characters** — accommodates our ~460-word chunks comfortably

## Retrieval: Why in-memory cosine similarity?

For a **demo/MVP** with up to ~500 chunks (20 documents × 25 chunks each):

- DynamoDB full scan for a document + in-memory cosine similarity is fast (< 100ms)
- No additional services needed (no OpenSearch, no pgvector, no Pinecone)
- Pure Python implementation — no numpy Lambda layer required
- The `document_id` GSI ensures we only scan chunks for the selected document, not the entire table

**Upgrade path for production:**
1. **OpenSearch Serverless** — KNN vectors, k-NN scoring, no provisioning
2. **Aurora PostgreSQL + pgvector** — SQL queries, transactional, familiar
3. **Amazon MemoryDB + vector search** — sub-millisecond, in-memory

## Prompt Engineering: Enforcing Citations

The system prompt includes these critical constraints:

```
1. Answer ONLY from the provided source chunks. Use ZERO outside knowledge.
2. Every factual claim MUST end with an inline citation marker [1], [2], etc.
3. Return ONLY this JSON object — no markdown fences, no preamble:
   {
     "answer": "...[1]...[2]...",
     "citations": [{ "citation_number": 1, "page_number": 3, ... }]
   }
```

**Why temperature=0?**
Deterministic output is critical for citation accuracy. Even small temperature values can cause the model to paraphrase quotes in ways that no longer match the source verbatim.

**Why JSON output?**
Structured output makes citations machine-readable. The frontend can render them as interactive cards with hover effects. Free-text output would require fragile regex parsing.

**Fallback parser:**
Claude occasionally returns JSON wrapped in markdown fences (```json ... ```). The parser:
1. Strips any markdown fences
2. Attempts `json.loads()`
3. If that fails, applies `re.search(r'\{.*\}', ..., re.DOTALL)` to extract the JSON object
4. For any missing citation fields, backfills from the retrieved chunk metadata

## Similarity Threshold: 0.25

A threshold of 0.25 on normalised 1024-dim cosine similarity:
- Eliminates truly unrelated chunks (similarity < 0.1)
- Keeps clearly relevant chunks (similarity > 0.5)
- The 0.25 sweet spot is empirically good for document Q&A with Titan V2
- Configurable via `SIM_THRESHOLD` Lambda environment variable

## Top-K: 5 chunks

- 5 chunks × ~460 words = ~2,300 words of context (~3,000 tokens)
- Leaves ample room within Claude 3 Haiku's 200K context window
- Enough to answer most specific questions
- Reduces prompt cost vs. using more chunks
