export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in" role="status" aria-label="CiteWise AI is thinking">
      <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-brand-600 mt-1" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M7 8h10M7 12h7M7 16h8" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-sm shadow-soft">
        <span className="dot" /><span className="dot" /><span className="dot" />
        <span className="sr-only">Thinking…</span>
      </div>
    </div>
  )
}
