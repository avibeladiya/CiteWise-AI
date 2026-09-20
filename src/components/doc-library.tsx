import { FileText, Plus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { SampleCompact } from "@/components/sample-actions";
import { Button } from "@/components/ui/button";
import { useProcessFile } from "@/hooks/useProcessFile";
import { formatBytes, formatRelative, cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat";
import { useDocStore } from "@/store/docs";

const STATUS: Record<string, string> = {
  ready: "Indexed",
  processing: "Indexing",
  uploading: "Uploading",
  failed: "Failed",
};

export function DocLibrary() {
  const docs = useDocStore((s) => s.docs);
  const selectedId = useDocStore((s) => s.selectedId);
  const select = useDocStore((s) => s.select);
  const removeDoc = useDocStore((s) => s.removeDoc);
  const deleteThread = useChatStore((s) => s.deleteThread);
  const { processFile, busy } = useProcessFile();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">Library</p>
          <p className="mt-1 font-display text-lg tracking-tight">Documents</p>
        </div>
        <Button
          variant="secondary"
          size="icon-sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          aria-label="Upload document"
        >
          <Plus className="size-4" />
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void processFile(file);
          }}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {docs.length === 0 ? (
          <div className="px-1 py-2">
            <p className="px-2 pb-4 text-sm leading-relaxed text-muted">
              No documents yet. Index a specimen to open the desk.
            </p>
            <SampleCompact />
          </div>
        ) : (
          <ul className="space-y-1">
            {docs.map((doc) => {
              const active = doc.document_id === selectedId;
              return (
                <li key={doc.document_id}>
                  <div
                    className={cn(
                      "group flex items-start gap-2 rounded-lg border px-2.5 py-2.5 transition-colors duration-150",
                      active
                        ? "border-border bg-subtle"
                        : "border-transparent hover:bg-subtle/70",
                    )}
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                      onClick={() => select(doc.document_id)}
                      disabled={doc.status !== "ready" && doc.status !== "failed"}
                    >
                      <FileText className="mt-0.5 size-4 shrink-0 text-accent" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-fg">
                          {doc.document_name}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs uppercase tracking-wider text-faint">
                          {STATUS[doc.status]}
                          {doc.page_count > 0 ? ` · ${doc.page_count}p` : ""}
                          {doc.chunk_count > 0 ? ` · ${doc.chunk_count}c` : ""}
                          {" · "}
                          {formatBytes(doc.file_size)} · {formatRelative(doc.created_at)}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="mt-0.5 hidden size-8 items-center justify-center rounded-md text-faint hover:bg-bg hover:text-danger group-hover:flex"
                      aria-label={`Remove ${doc.document_name}`}
                      onClick={() => {
                        deleteThread(doc.document_id);
                        removeDoc(doc.document_id);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
