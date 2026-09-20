import { useCallback, useState } from "react";
import { toast } from "sonner";
import { apiOrigin, remoteUpload } from "@/lib/citewise/remote";
import { chunkPages } from "@/lib/rag/chunk";
import { extractPages } from "@/lib/rag/extract";
import type { Doc } from "@/lib/rag/types";
import { generateId } from "@/lib/utils";
import { useDocStore } from "@/store/docs";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useProcessFile() {
  const [busy, setBusy] = useState(false);
  const upsertDoc = useDocStore((s) => s.upsertDoc);
  const removeDoc = useDocStore((s) => s.removeDoc);
  const setChunks = useDocStore((s) => s.setChunks);
  const select = useDocStore((s) => s.select);
  const setStage = useDocStore((s) => s.setStage);

  const processFile = useCallback(
    async (file: File) => {
      setBusy(true);
      const id = generateId();
      const created: Doc = {
        document_id: id,
        document_name: file.name,
        status: "processing",
        page_count: 0,
        chunk_count: 0,
        file_size: file.size,
        created_at: new Date().toISOString(),
        origin: "local",
      };
      upsertDoc(created);
      select(id);
      setStage("extract", id);
      try {
        if (apiOrigin()) {
          setStage("index", id);
          const remote = await remoteUpload(file);
          removeDoc(id);
          upsertDoc({ ...remote, origin: "remote" });
          select(remote.document_id);
          setStage("ready", remote.document_id);
          toast.success("Document indexed", {
            description: `${remote.page_count} pages · ${remote.chunk_count} chunks`,
          });
          return remote;
        }

        const t0 = Date.now();
        const pages = await extractPages(file);
        if (Date.now() - t0 < 280) await wait(280);
        upsertDoc({ ...created, page_count: pages.length, status: "processing" });
        setStage("chunk", id);
        await wait(180);
        const chunks = chunkPages(pages);
        setStage("index", id);
        await wait(180);
        setChunks(id, chunks);
        const ready: Doc = {
          ...created,
          status: "ready",
          page_count: pages.length,
          chunk_count: chunks.length,
        };
        upsertDoc(ready);
        setStage("ready", id);
        toast.success("Document indexed", {
          description: `${pages.length} pages · ${chunks.length} chunks`,
        });
        return ready;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Processing failed";
        upsertDoc({ ...created, status: "failed", error_message: message });
        setStage("error", id);
        toast.error("Could not index document", { description: message });
        return null;
      } finally {
        setBusy(false);
      }
    },
    [removeDoc, select, setChunks, setStage, upsertDoc],
  );

  return { processFile, busy };
}
