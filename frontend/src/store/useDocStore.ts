import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Doc, UploadProgress } from '@/types'

interface DocState {
  docs:        Doc[]
  selectedId:  string | null
  uploads:     UploadProgress[]
  setDocs:     (docs: Doc[]) => void
  upsertDoc:   (doc: Doc) => void
  removeDoc:   (id: string) => void
  select:      (id: string | null) => void
  setUpload:   (u: UploadProgress) => void
  clearUpload: (id: string) => void
  selectedDoc: () => Doc | null
}

export const useDocStore = create<DocState>()(
  persist(
    (set, get) => ({
      docs: [], selectedId: null, uploads: [],
      setDocs: (docs) => set({ docs }),
      upsertDoc: (doc) =>
        set((s) => {
          const i = s.docs.findIndex((d) => d.document_id === doc.document_id)
          const next = [...s.docs]
          if (i >= 0) next[i] = doc; else next.unshift(doc)
          return { docs: next }
        }),
      removeDoc: (id) =>
        set((s) => ({
          docs:       s.docs.filter((d) => d.document_id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),
      select: (id) => set({ selectedId: id }),
      setUpload: (u) =>
        set((s) => {
          const i = s.uploads.findIndex((x) => x.document_id === u.document_id)
          const next = [...s.uploads]
          if (i >= 0) next[i] = u; else next.push(u)
          return { uploads: next }
        }),
      clearUpload: (id) =>
        set((s) => ({ uploads: s.uploads.filter((u) => u.document_id !== id) })),
      selectedDoc: () =>
        get().docs.find((d) => d.document_id === get().selectedId) ?? null,
    }),
    {
      name: 'cw-docs',
      partialize: (s) => ({ docs: s.docs, selectedId: s.selectedId }),
    },
  ),
)
