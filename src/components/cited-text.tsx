import { cn } from "@/lib/utils";

export function CitedText({
  text,
  active,
  onCite,
}: {
  text: string;
  active?: number | null;
  onCite?: (n: number) => void;
}) {
  const cleaned = text.replace(/\s*(\[\d+\])\s*/g, " $1 ").replace(/\s+/g, " ").trim();
  const parts = cleaned.split(/(\[\d+\])/g);
  return (
    <p className="text-[0.9375rem] leading-relaxed text-fg">
      {parts.map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/);
        if (!m) return <span key={i}>{part}</span>;
        const n = Number(m[1]);
        const isActive = active === n;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onCite?.(n)}
            className={cn(
              "mx-0.5 inline-flex min-w-6 translate-y-[-1px] items-center justify-center rounded-sm px-1 font-mono text-xs font-medium transition-colors duration-150",
              isActive
                ? "bg-accent text-accent-fg"
                : "bg-subtle text-accent hover:bg-accent hover:text-accent-fg",
            )}
            aria-label={`Open citation ${n}`}
          >
            {n}
          </button>
        );
      })}
    </p>
  );
}
