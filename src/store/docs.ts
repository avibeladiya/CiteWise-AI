import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Chunk, Doc, ProcessStage } from "@/lib/rag/types";

interface DocState {
  docs: Doc[];
  selectedId: string | null;
  chunksByDoc: Record<string, Chunk[]>;
  stage: ProcessStage | null;
  stageDocId: string | null;
  setStage: (stage: ProcessStage | null, docId?: string | null) => void;
  upsertDoc: (doc: Doc) => void;
  removeDoc: (id: string) => void;
  select: (id: string | null) => void;
  setChunks: (id: string, chunks: Chunk[]) => void;
  selectedDoc: () => Doc | null;
  selectedChunks: () => Chunk[];
}

export const useDocStore = create<DocState>()(
  persist(
    (set, get) => ({
      docs: [],
      selectedId: null,
      chunksByDoc: {},
      stage: null,
      stageDocId: null,
      setStage: (stage, docId) =>
        set({ stage, stageDocId: docId === undefined ? get().stageDocId : docId }),
      upsertDoc: (doc) =>
        set((s) => {
          const i = s.docs.findIndex((d) => d.document_id === doc.document_id);
          const next = [...s.docs];
          if (i >= 0) next[i] = { ...next[i], ...doc };
          else next.unshift(doc);
          return { docs: next };
        }),
      removeDoc: (id) =>
        set((s) => {
          const chunksByDoc = { ...s.chunksByDoc };
          delete chunksByDoc[id];
          return {
            docs: s.docs.filter((d) => d.document_id !== id),
            selectedId: s.selectedId === id ? null : s.selectedId,
            chunksByDoc,
          };
        }),
      select: (id) => set({ selectedId: id }),
      setChunks: (id, chunks) =>
        set((s) => ({ chunksByDoc: { ...s.chunksByDoc, [id]: chunks } })),
      selectedDoc: () => get().docs.find((d) => d.document_id === get().selectedId) ?? null,
      selectedChunks: () => {
        const id = get().selectedId;
        return id ? (get().chunksByDoc[id] ?? []) : [];
      },
    }),
    {
      name: "cw-docs-v2",
      partialize: (s) => ({
        docs: s.docs,
        selectedId: s.selectedId,
        chunksByDoc: s.chunksByDoc,
      }),
    },
  ),
);
