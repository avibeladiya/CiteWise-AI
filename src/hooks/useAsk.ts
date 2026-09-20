import { useCallback } from "react";
import { toast } from "sonner";
import { askCitewise } from "@/lib/citewise/ask";
import { remoteAsk } from "@/lib/citewise/remote";
import { retrieve } from "@/lib/rag/retrieve";
import { useChatStore } from "@/store/chat";
import { useDocStore } from "@/store/docs";
import { useUIStore } from "@/store/ui";

export function useAsk() {
  const addMsg = useChatStore((s) => s.addMsg);
  const setLoading = useChatStore((s) => s.setLoading);
  const showCitations = useUIStore((s) => s.showCitations);

  return useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q) return;
      const { selectedId, selectedDoc, selectedChunks } = useDocStore.getState();
      const doc = selectedDoc();
      if (!selectedId || !doc) {
        toast.error("Select a document first");
        return;
      }
      if (doc.status !== "ready") {
        toast.error("Document is still processing");
        return;
      }
      addMsg({ role: "user", content: q, document_id: selectedId });
      setLoading(selectedId);
      try {
        let result;
        if (doc.origin === "remote") {
          result = await remoteAsk(selectedId, q);
        } else {
          const top = retrieve(q, selectedChunks(), 5);
          if (!top.length) {
            throw new Error("No indexed passages in this document.");
          }
          result = await askCitewise({
            data: {
              question: q,
              documentName: doc.document_name,
              chunks: top.map((c) => ({
                chunk_index: c.chunk_index,
                page_number: c.page_number,
                text: c.text,
                score: c.score,
              })),
            },
          });
        }
        const msg = addMsg({
          role: "assistant",
          content: result.answer,
          citations: result.citations,
          chunks_used: result.chunks_used,
          latency_ms: result.latency_ms,
          grounded: result.grounded,
          document_id: selectedId,
        });
        showCitations(msg.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Question failed";
        addMsg({ role: "error", content: message, document_id: selectedId });
        toast.error("Could not answer", { description: message });
      } finally {
        setLoading(null);
      }
    },
    [addMsg, setLoading, showCitations],
  );
}
