export const PIPELINE = [
  {
    n: "01",
    title: "Extract",
    body: "PDF and TXT are read page by page. Nothing leaves the browser until you ask.",
  },
  {
    n: "02",
    title: "Chunk",
    body: "Overlapping passages (~180 words) keep page numbers attached to every window.",
  },
  {
    n: "03",
    title: "Retrieve",
    body: "BM25 ranks the chunks that match your question. The model never sees the rest.",
  },
  {
    n: "04",
    title: "Cite",
    body: "Grok must return JSON with [n] markers, page numbers, and verbatim quotes.",
  },
] as const;

export function Pipeline({ compact = false }: { compact?: boolean }) {
  return (
    <ol className={compact ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-4" : "grid gap-6 sm:grid-cols-2 lg:grid-cols-4"}>
      {PIPELINE.map((s) => (
        <li key={s.n} className="border-t border-border pt-4">
          <p className="font-mono text-xs text-accent">{s.n}</p>
          <h3 className="mt-3 font-display text-2xl tracking-tight">{s.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}
