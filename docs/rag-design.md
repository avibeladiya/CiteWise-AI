# RAG design

## Extract

- PDF: page-by-page text (pdf.js / pypdf), max 20 pages.
- TXT: split on form-feed or `Page N` headings.

## Chunk

- Target 180 words, 30-word overlap.
- Page number = majority vote of words in the window.
- Offsets stored for audit.

## Retrieve

BM25 (k1 = 1.5, b = 0.75), stopworded tokens length > 2, top 5. If all scores are 0, still return the first k chunks so the model can say “not in document”.

## Generate

Temperature 0. System prompt forbids outside knowledge. Response parsed as JSON. Quotes clipped to ~220 characters.

## Fallback

Sentence-level extractive quotes from the top chunks, each tagged `[n]`. Product remains grounded without an LLM.
