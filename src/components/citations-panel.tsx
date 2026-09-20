import { Download, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadText, cn } from "@/lib/utils";
import { threadOf, useChatStore } from "@/store/chat";
import { useDocStore } from "@/store/docs";
import { useUIStore } from "@/store/ui";

export function CitationsPanel() {
  const selectedId = useDocStore((s) => s.selectedId);
  const msgs = useChatStore((s) => threadOf(s.threads, selectedId));
  const activeMsgId = useUIStore((s) => s.activeMsgId);
  const activeCite = useUIStore((s) => s.activeCite);
  const showCitations = useUIStore((s) => s.showCitations);
  const active = msgs.find((m) => m.id === activeMsgId) ?? msgs.filter((m) => m.role === "assistant").at(-1);
  const citations = active?.citations ?? [];
  const maxScore = Math.max(0, ...citations.map((c) => c.score ?? 0));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">Evidence</p>
          <p className="mt-1 font-display text-lg tracking-tight">Sources</p>
        </div>
        {active && citations.length > 0 && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Download sources"
            onClick={() =>
              downloadText(
                [
                  "CiteWise AI — sourced answer",
                  "",
                  active.content,
                  "",
                  ...citations.map(
                    (c) => `[${c.citation_number}] Page ${c.page_number}\n"${c.quote}"`,
                  ),
                ].join("\n"),
                `citewise-${active.id.slice(0, 8)}.txt`,
              )
            }
          >
            <Download className="size-4" />
          </Button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-5">
        {citations.length === 0 ? (
          <div className="px-2 py-10 text-sm leading-relaxed text-muted">
            <Quote className="mb-3 size-5 text-faint" />
            Ask a question. Retrieved passages appear here with page numbers and verbatim quotes.
          </div>
        ) : (
          <ol className="space-y-2">
            {citations.map((c) => {
              const on = activeCite === c.citation_number;
              const width = maxScore > 0 && c.score ? Math.max(8, Math.round((c.score / maxScore) * 100)) : 0;
              return (
                <li key={c.citation_number}>
                  <button
                    type="button"
                    onClick={() => showCitations(active?.id ?? null, c.citation_number)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors duration-150",
                      on ? "border-accent/50 bg-subtle" : "border-border bg-surface hover:bg-subtle",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center rounded-sm font-mono text-xs",
                          on ? "bg-accent text-accent-fg" : "bg-subtle text-accent",
                        )}
                      >
                        {c.citation_number}
                      </span>
                      <span className="font-mono text-xs uppercase tracking-wider text-muted">
                        Page {c.page_number}
                        <span className="text-faint"> · Chunk {c.chunk_index}</span>
                      </span>
                    </div>
                    <blockquote className="mt-2 font-display text-[0.9375rem] leading-relaxed text-fg">
                      “{c.quote}”
                    </blockquote>
                    {width > 0 && (
                      <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    )}
                    {c.score != null && c.score > 0 && (
                      <p className="mt-2 font-mono text-xs uppercase tracking-wider text-faint tabular-nums">
                        BM25 {c.score.toFixed(2)}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
