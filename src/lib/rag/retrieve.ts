import type { Chunk } from "./types";

const STOP = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her",
  "was", "one", "our", "out", "has", "have", "this", "that", "with", "from",
  "they", "been", "said", "each", "which", "their", "will", "other", "about",
  "what", "when", "where", "who", "how", "why", "into", "than", "then", "them",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => (t.length > 2 || /\d/.test(t)) && !STOP.has(t));
}

export function retrieve(query: string, chunks: Chunk[], k = 5): Chunk[] {
  if (!chunks.length) return [];
  const docs = chunks.map((c) => tokenize(c.text));
  const df = new Map<string, number>();
  for (const tokens of docs) {
    for (const t of new Set(tokens)) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const N = docs.length;
  const k1 = 1.5;
  const b = 0.75;
  const avgdl = docs.reduce((s, d) => s + d.length, 0) / Math.max(N, 1);
  const qTokens = tokenize(query);
  const qSet = new Set(qTokens);
  const scored = docs.map((tokens, i) => {
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    const dl = tokens.length || 1;
    let covered = 0;
    for (const t of qSet) {
      const f = tf.get(t) ?? 0;
      if (!f) continue;
      covered += 1;
      const n = df.get(t) ?? 0;
      const idf = Math.log((N - n + 0.5) / (n + 0.5) + 1);
      score += (idf * (f * (k1 + 1))) / (f + k1 * (1 - b + (b * dl) / avgdl));
    }
    const coverage = qSet.size ? covered / qSet.size : 0;
    return { i, score: score * (0.2 + 0.8 * coverage) };
  });
  scored.sort((a, b) => b.score - a.score);
  const positive = scored.filter((s) => s.score > 0).slice(0, k);
  const picked = positive.length ? positive : scored.slice(0, Math.min(k, scored.length));
  return picked.map((s) => ({ ...chunks[s.i], score: s.score }));
}
