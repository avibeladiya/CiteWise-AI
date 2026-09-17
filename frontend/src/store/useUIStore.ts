import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ToastItem } from '@/types'
import { generateId } from '@/lib/utils'

type View = 'landing' | 'workspace'

interface UIState {
  view:           View
  sidebarOpen:    boolean
  citationsMsgId: string | null
  dark:           boolean
  toasts:         ToastItem[]
  setView:        (v: View) => void
  setSidebar:     (open: boolean) => void
  showCitations:  (msgId: string | null) => void
  toggleDark:     () => void
  toast:          (t: Omit<ToastItem, 'id'>, ms?: number) => void
  dismissToast:   (id: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      view: 'landing', sidebarOpen: true, citationsMsgId: null, dark: false, toasts: [],
      setView:    (v) => set({ view: v }),
      setSidebar: (open) => set({ sidebarOpen: open }),
      showCitations: (msgId) => set({ citationsMsgId: msgId }),
      toggleDark: () =>
        set((s) => {
          const next = !s.dark
          document.documentElement.classList.toggle('dark', next)
          return { dark: next }
        }),
      toast: (t, ms = 4500) => {
        const id = generateId()
        set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), ms)
      },
      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
    }),
    { name: 'cw-ui', partialize: (s) => ({ dark: s.dark, sidebarOpen: s.sidebarOpen }) },
  ),
)
