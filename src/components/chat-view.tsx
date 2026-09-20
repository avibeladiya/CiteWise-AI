import { ArrowUp, BookOpen, Check, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CitedText } from "@/components/cited-text";
import { SampleCompact } from "@/components/sample-actions";
import { Button } from "@/components/ui/button";
import { useAsk } from "@/hooks/useAsk";
import { suggestionsFor } from "@/lib/rag/samples";
import { formatBytes, cn } from "@/lib/utils";
import { threadOf, useChatStore } from "@/store/chat";
import { useDocStore } from "@/store/docs";
import { useUIStore } from "@/store/ui";

const STAGES = [
  { id: "extract", label: "Extract text" },
  { id: "chunk", label: "Split passages" },
  { id: "index", label: "Build index" },
  { id: "ready", label: "Ready" },
] as const;

export function ChatView() {
  const doc = useDocStore((s) => s.selectedDoc());
  const selectedId = useDocStore((s) => s.selectedId);
  const stage = useDocStore((s) => s.stage);
  const msgs = useChatStore((s) => threadOf(s.threads, selectedId));
  const loading = useChatStore((s) => s.loadingFor === selectedId && selectedId !== null);
  const clearThread = useChatStore((s) => s.clearThread);
  const ask = useAsk();
  const activeCite = useUIStore((s) => s.activeCite);
  const showCitations = useUIStore((s) => s.showCitations);
  const pendingAsk = useUIStore((s) => s.pendingAsk);
  const setPendingAsk = useUIStore((s) => s.setPendingAsk);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");

  const ready = doc?.status === "ready";
  const docId = doc?.document_id;

  const firedAsk = useRef<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, loading]);

  useEffect(() => {
    if (!ready || !docId || !pendingAsk || loading) return;
    const key = `${docId}:${pendingAsk}`;
    if (firedAsk.current === key) return;
    firedAsk.current = key;
    const q = pendingAsk;
    setPendingAsk(null);
    void ask(q);
  }, [ready, docId, pendingAsk, loading, ask, setPendingAsk]);

  if (!doc) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
        <BookOpen className="mb-4 size-7 text-faint" />
        <p className="font-display text-2xl tracking-tight">Open a document</p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Index a specimen, then ask. Every answer comes back with a page and a quote.
        </p>
        <div className="mt-8 w-full">
          <SampleCompact />
        </div>
      </div>
    );
  }

  if (doc.status === "processing" || doc.status === "uploading") {
    const current = stage ?? "extract";
    const idx = STAGES.findIndex((s) => s.id === current);
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">Pipeline</p>
        <p className="mt-2 font-display text-3xl tracking-tight">Indexing</p>
        <ol className="mt-8 w-full max-w-sm space-y-3">
          {STAGES.map((s, i) => {
            const done = idx > i || current === "ready";
            const on = s.id === current;
            return (
              <li key={s.id} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-sm font-mono text-xs",
                    done || on ? "bg-accent text-accent-fg" : "bg-subtle text-faint",
                  )}
                >
                  {done ? <Check className="size-3.5" /> : `0${i + 1}`}
                </span>
                <span className={cn("text-sm", on ? "text-fg thinking" : "text-muted")}>
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-8 max-w-sm text-center text-sm text-muted">{doc.document_name}</p>
      </div>
    );
  }

  if (doc.status === "failed") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-2xl tracking-tight">Could not index</p>
        <p className="mt-2 max-w-sm text-sm text-muted">{doc.error_message}</p>
      </div>
    );
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const q = draft.trim();
    if (!q || loading) return;
    setDraft("");
    void ask(q);
  }

  const prompts = suggestionsFor(doc.document_name);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{doc.document_name}</p>
          <p className="font-mono text-xs uppercase tracking-wider text-faint">
            {formatBytes(doc.file_size)}
            {doc.page_count > 0 ? ` · ${doc.page_count} pages` : ""}
            {doc.chunk_count > 0 ? ` · ${doc.chunk_count} chunks` : ""}
            {doc.origin === "remote" ? " · Render" : " · Local index"}
          </p>
        </div>
        {msgs.length > 0 && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear conversation"
            onClick={() => clearThread(doc.document_id)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        {msgs.length === 0 && !loading && !pendingAsk ? (
          <div className="mx-auto flex max-w-xl flex-col items-center pt-10 text-center">
            <p className="font-display text-3xl tracking-tight">Ask the document</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Retrieval ranks passages with BM25. Generation may only quote those passages.
            </p>
            <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
              {prompts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void ask(q)}
                  className="rounded-lg border border-border bg-surface px-4 py-3 text-left text-sm leading-relaxed text-muted transition-colors duration-150 hover:bg-subtle hover:text-fg"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-6">
            {msgs.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg rounded-br-sm bg-subtle px-4 py-3 text-[0.9375rem] leading-relaxed">
                    {m.content}
                  </div>
                </div>
              ) : m.role === "error" ? (
                <div key={m.id} className="rounded-lg border border-danger/30 bg-subtle px-4 py-3 text-sm text-danger">
                  {m.content}
                </div>
              ) : (
                <div key={m.id} className="space-y-3">
                  <CitedText
                    text={m.content}
                    active={activeCite}
                    onCite={(n) => showCitations(m.id, n)}
                  />
                  <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-wider text-faint">
                    <span className="text-ok">Grounded</span>
                    <span>{m.citations?.length ?? 0} sources</span>
                    {m.latency_ms != null && <span>{m.latency_ms} ms</span>}
                    {m.chunks_used != null && <span>{m.chunks_used} chunks</span>}
                    <button
                      type="button"
                      className="text-accent hover:text-fg"
                      onClick={() => showCitations(m.id)}
                    >
                      Open evidence
                    </button>
                  </div>
                </div>
              ),
            )}
            {loading && (
              <p className="thinking font-display text-lg">Retrieving and writing a sourced answer…</p>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={submit} className="border-t border-border p-3 md:p-4">
        <div className="mx-auto flex max-w-2xl items-end gap-2 rounded-lg border border-border bg-surface p-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask anything about this document…"
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed text-fg outline-none placeholder:text-faint"
          />
          <Button type="submit" size="icon" disabled={!draft.trim() || loading} aria-label="Send">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
