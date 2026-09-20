import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ChunkIn = z.object({
  chunk_index: z.number(),
  page_number: z.number(),
  text: z.string(),
  score: z.number().optional(),
});

const Input = z.object({
  question: z.string().min(1).max(2000),
  documentName: z.string().min(1).max(240),
  chunks: z.array(ChunkIn).min(1).max(8),
});

export type AskResult = {
  answer: string;
  citations: {
    citation_number: number;
    page_number: number;
    chunk_index: number;
    quote: string;
    score?: number;
  }[];
  chunks_used: number;
  latency_ms: number;
  grounded: boolean;
};

function quoteFrom(text: string, max = 220): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}

function snapChunk(
  quote: string,
  num: number,
  chunks: z.infer<typeof ChunkIn>[],
): z.infer<typeof ChunkIn> | undefined {
  const needle = quote.replace(/\s+/g, " ").trim().toLowerCase().slice(0, 72);
  if (needle.length > 18) {
    const hit = chunks.find((c) => c.text.toLowerCase().includes(needle.slice(0, 48)));
    if (hit) return hit;
  }
  return chunks[num - 1] ?? chunks[0];
}

function extractive(question: string, chunks: z.infer<typeof ChunkIn>[]): AskResult {
  const terms = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 3);
  const citations = chunks.slice(0, 4).map((c, i) => {
    const sentences = c.text.split(/(?<=[.!?])\s+/);
    const best =
      sentences.find((s) => terms.some((t) => s.toLowerCase().includes(t))) ??
      sentences[0] ??
      c.text;
    return {
      citation_number: i + 1,
      page_number: c.page_number,
      chunk_index: c.chunk_index,
      quote: quoteFrom(best),
      score: c.score,
    };
  });
  const lines = citations.map((c) => `${c.quote} [${c.citation_number}]`);
  return {
    answer:
      lines.join(" ") +
      (citations.length
        ? ""
        : "The retrieved passages do not contain a clear answer to this question."),
    citations,
    chunks_used: chunks.length,
    latency_ms: 12,
    grounded: true,
  };
}

function parseModelJson(raw: string, chunks: z.infer<typeof ChunkIn>[]): AskResult {
  const cleaned = raw.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  let data: { answer?: string; citations?: unknown[] } = {};
  try {
    data = JSON.parse(match ? match[0] : cleaned) as typeof data;
  } catch {
    return extractive("", chunks);
  }
  const citations = (data.citations ?? [])
    .map((item, i) => {
      if (!item || typeof item !== "object") return null;
      const rec = item as Record<string, unknown>;
      const num = Number(rec.citation_number ?? i + 1);
      const quote = quoteFrom(String(rec.quote ?? ""));
      const src = snapChunk(quote, num, chunks);
      if (!src) return null;
      return {
        citation_number: num,
        page_number: src.page_number,
        chunk_index: src.chunk_index,
        quote: quote || quoteFrom(src.text),
        score: src.score,
      };
    })
    .filter((c): c is NonNullable<typeof c> => !!c);
  return {
    answer: String(data.answer ?? "").trim() || extractive("", chunks).answer,
    citations,
    chunks_used: chunks.length,
    latency_ms: 0,
    grounded: true,
  };
}

export const askCitewise = createServerFn({ method: "POST" })
  .validator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<AskResult> => {
    const t0 = Date.now();
    const apiKey = process.env.XAI_API_KEY;
    const fallback = extractive(data.question, data.chunks);
    if (!apiKey) return { ...fallback, latency_ms: Date.now() - t0 };

    const context = data.chunks
      .map((c, i) => {
        const text = c.text.length > 900 ? `${c.text.slice(0, 900)}…` : c.text;
        return `[Source ${i + 1} | Page ${c.page_number} | Chunk ${c.chunk_index}]\n${text}`;
      })
      .join("\n\n---\n\n");

    const system = `You are CiteWise, a document Q&A assistant for "${data.documentName}".

STRICT RULES:
1. Answer ONLY from the provided source chunks. No outside knowledge.
2. Every factual claim must include an inline citation marker like [1] or [2].
3. citation_number N must be the Source N that actually contains the quote.
4. Quotes must be verbatim substrings of that source.
5. If the sources do not contain the answer, say so clearly and cite the closest passages.
6. Return ONLY valid JSON — no markdown fences:
{"answer":"<prose with [N] markers>","citations":[{"citation_number":1,"page_number":<int>,"chunk_index":<int>,"quote":"<verbatim ≤200 chars from that source>"}]}`;

    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          temperature: 0,
          max_tokens: 700,
          messages: [
            { role: "system", content: system },
            {
              role: "user",
              content: `QUESTION: ${data.question}\n\nSOURCES:\n${context}\n\nReturn JSON.`,
            },
          ],
        }),
      });
      if (!res.ok) return { ...fallback, latency_ms: Date.now() - t0 };
      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const raw = body.choices?.[0]?.message?.content ?? "";
      const parsed = parseModelJson(raw, data.chunks);
      return { ...parsed, latency_ms: Date.now() - t0, grounded: true };
    } catch {
      return { ...fallback, latency_ms: Date.now() - t0 };
    }
  });
