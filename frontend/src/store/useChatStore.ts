import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Msg } from '@/types'
import { generateId } from '@/lib/utils'

interface ChatState {
  threads:     Record<string, Msg[]>
  loadingFor:  string | null
  addMsg:      (m: Omit<Msg, 'id' | 'timestamp'>) => Msg
  setLoading:  (id: string | null) => void
  clearThread: (docId: string) => void
  deleteThread:(docId: string) => void
  msgs:        (docId: string) => Msg[]
  isLoading:   (docId: string) => boolean
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: {}, loadingFor: null,
      addMsg: (m) => {
        const msg: Msg = { ...m, id: generateId(), timestamp: new Date().toISOString() }
        set((s) => ({
          threads: { ...s.threads, [m.document_id]: [...(s.threads[m.document_id] ?? []), msg] },
        }))
        return msg
      },
      setLoading: (id) => set({ loadingFor: id }),
      clearThread: (docId) =>
        set((s) => ({ threads: { ...s.threads, [docId]: [] } })),
      deleteThread: (docId) =>
        set((s) => { const t = { ...s.threads }; delete t[docId]; return { threads: t } }),
      msgs:      (docId) => get().threads[docId] ?? [],
      isLoading: (docId) => get().loadingFor === docId,
    }),
    { name: 'cw-chat', partialize: (s) => ({ threads: s.threads }) },
  ),
)
