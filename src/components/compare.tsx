export function GroundedCompare() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <article className="rounded-xl border border-border bg-surface p-5 md:p-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-danger">Ungrounded model</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Operating margin was around 18%, which is typical for a scaled software company after a cost-cutting cycle.
        </p>
        <p className="mt-5 font-mono text-xs uppercase tracking-[0.16em] text-faint">
          No page · No quote · Plausible, not proven
        </p>
      </article>
      <article className="rounded-xl border border-accent/40 bg-surface p-5 md:p-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ok">CiteWise</p>
        <p className="mt-4 font-display text-xl leading-snug tracking-tight">
          Operating margin improved to 18.4%
          <span className="mx-1 inline-flex min-w-6 translate-y-[-2px] items-center justify-center rounded-sm bg-accent px-1 font-mono text-xs font-medium text-accent-fg">
            1
          </span>
          , a 340 basis-point increase
          <span className="mx-1 inline-flex min-w-6 translate-y-[-2px] items-center justify-center rounded-sm bg-subtle px-1 font-mono text-xs font-medium text-accent">
            2
          </span>
          .
        </p>
        <blockquote className="mt-5 border-l-2 border-accent/50 pl-3 text-sm leading-relaxed text-muted">
          “Operating income increased to $772 million, representing an operating margin of 18.4%…” — p.1
        </blockquote>
      </article>
    </div>
  );
}
