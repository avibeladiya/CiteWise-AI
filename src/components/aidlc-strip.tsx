const PHASES = [
  { n: "01", title: "Intent", body: "Ground every claim in the source." },
  { n: "02", title: "Inception", body: "Stories, domain, retrieval units." },
  { n: "03", title: "Construction", body: "BM25, Grok JSON, citation desk." },
  { n: "04", title: "Operation", body: "Vercel web · Render API." },
] as const;

export function AidlcStrip() {
  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {PHASES.map((p) => (
        <li key={p.n} className="border-t border-border pt-4">
          <p className="font-mono text-xs text-accent">{p.n}</p>
          <h3 className="mt-3 font-display text-2xl tracking-tight">{p.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
        </li>
      ))}
    </ol>
  );
}
