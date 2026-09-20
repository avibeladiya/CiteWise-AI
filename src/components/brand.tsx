import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md border border-border bg-surface font-display text-xs font-medium tracking-tight text-fg",
        className,
      )}
      aria-hidden
    >
      [1]
    </span>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 text-fg">
      <Mark />
      <span className="leading-none">
        <span className="block font-sans text-xs font-medium uppercase tracking-[0.22em] text-muted">
          CiteWise
        </span>
        {!compact && (
          <span className="font-display text-lg tracking-tight">Grounded Q&A</span>
        )}
      </span>
    </Link>
  );
}
