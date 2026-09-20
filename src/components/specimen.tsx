import { useState } from "react";
import { cn } from "@/lib/utils";

const CITES = [
  {
    n: 1,
    page: 1,
    quote:
      "Operating income increased to $772 million, representing an operating margin of 18.4%, a 340 basis-point improvement.",
  },
  {
    n: 2,
    page: 1,
    quote:
      "This margin expansion reflects the successful completion of our cost optimization program initiated in Q2.",
  },
] as const;

export function Specimen() {
  const [active, setActive] = useState(1);
  const current = CITES.find((c) => c.n === active) ?? CITES[0];

  return (
    <aside className="rounded-xl border border-border bg-surface p-5 shadow-soft md:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-faint">Specimen</p>
        <p className="font-mono text-xs uppercase tracking-wider text-accent">Acme Q3 · p.1</p>
      </div>
      <p className="mt-3 text-sm text-muted">What was Q3 operating margin?</p>
      <p className="mt-4 font-display text-xl leading-snug tracking-tight md:text-2xl">
        Operating margin improved to 18.4%{" "}
        <Mark n={1} active={active} onClick={setActive} />
        , a 340 basis-point increase{" "}
        <Mark n={2} active={active} onClick={setActive} />.
      </p>
      <div className="mt-5 rounded-lg border border-accent/40 bg-subtle p-4 transition-colors duration-150">
        <p className="font-mono text-xs uppercase tracking-wider text-accent">
          [{current.n}] Page {current.page}
        </p>
        <p className="mt-2 font-display text-base leading-relaxed text-fg">
          “{current.quote}”
        </p>
      </div>
      <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-faint">
        Click a marker · every claim is auditable
      </p>
    </aside>
  );
}

function Mark({
  n,
  active,
  onClick,
}: {
  n: number;
  active: number;
  onClick: (n: number) => void;
}) {
  const on = active === n;
  return (
    <button
      type="button"
      onClick={() => onClick(n)}
      className={cn(
        "inline-flex min-w-6 translate-y-[-2px] items-center justify-center rounded-sm px-1 font-mono text-xs font-medium transition-colors duration-150",
        on ? "bg-accent text-accent-fg" : "bg-subtle text-accent hover:bg-accent hover:text-accent-fg",
      )}
      aria-label={`Show citation ${n}`}
    >
      {n}
    </button>
  );
}
