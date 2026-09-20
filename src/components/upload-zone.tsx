import { FileText, Upload } from "lucide-react";
import { useCallback, useRef, useState, type DragEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useProcessFile } from "@/hooks/useProcessFile";
import { cn } from "@/lib/utils";

export function UploadZone({ compact = false }: { compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const { processFile, busy } = useProcessFile();
  const navigate = useNavigate();

  const onFile = useCallback(
    async (file?: File) => {
      if (!file) return;
      const doc = await processFile(file);
      if (doc) await navigate({ to: "/workspace" });
    },
    [navigate, processFile],
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void onFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn(
        "relative overflow-hidden rounded-xl border border-dashed transition-[border-color,background-color] duration-200",
        over ? "border-accent bg-subtle" : "border-border bg-surface",
        compact ? "p-4" : "p-8 md:p-10",
      )}
    >
      <div className="paper-grain pointer-events-none absolute inset-0 opacity-[0.06]" />
      <div className="relative flex flex-col items-center text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-lg border border-border bg-subtle text-accent">
          {busy ? (
            <Upload className="size-5 animate-pulse" />
          ) : (
            <FileText className="size-5" />
          )}
        </span>
        <p className="font-display text-xl tracking-tight text-fg">
          {busy ? "Indexing the document" : "Drop a PDF or TXT"}
        </p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
          {busy
            ? "Extracting pages, splitting passages, building a retrieval index."
            : "Up to 10 MB and 20 pages. Text is chunked locally, then answers are grounded in the retrieved quotes."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </Button>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
            PDF · TXT · 10 MB
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void onFile(file);
          }}
        />
      </div>
    </div>
  );
}
