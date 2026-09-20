export function IssueBar() {
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-y border-fg py-2 font-mono text-[0.625rem] uppercase tracking-[0.22em] text-faint">
        <span>CiteWise Review</span>
        <span className="text-accent">Vol. 01 · Grounded RAG</span>
        <span className="hidden sm:inline">AIDLC · Citation desk</span>
      </div>
    </div>
  );
}
