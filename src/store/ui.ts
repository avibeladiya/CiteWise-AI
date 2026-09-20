import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  dark: boolean;
  libraryOpen: boolean;
  sourcesOpen: boolean;
  activeMsgId: string | null;
  activeCite: number | null;
  pendingAsk: string | null;
  toggleDark: () => void;
  setLibraryOpen: (v: boolean) => void;
  setSourcesOpen: (v: boolean) => void;
  setPendingAsk: (q: string | null) => void;
  showCitations: (msgId: string | null, cite?: number | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      dark: true,
      libraryOpen: false,
      sourcesOpen: false,
      activeMsgId: null,
      activeCite: null,
      pendingAsk: null,
      toggleDark: () =>
        set((s) => {
          const dark = !s.dark;
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", dark);
            document.documentElement.classList.toggle("light", !dark);
          }
          return { dark };
        }),
      setLibraryOpen: (v) => set({ libraryOpen: v }),
      setSourcesOpen: (v) => set({ sourcesOpen: v }),
      setPendingAsk: (q) => set({ pendingAsk: q }),
      showCitations: (msgId, cite = null) =>
        set({
          activeMsgId: msgId,
          activeCite: cite ?? null,
          sourcesOpen: Boolean(msgId),
        }),
    }),
    {
      name: "cw-ui-v2",
      partialize: (s) => ({ dark: s.dark }),
      onRehydrateStorage: () => (state) => {
        if (!state || typeof document === "undefined") return;
        document.documentElement.classList.toggle("dark", state.dark);
        document.documentElement.classList.toggle("light", !state.dark);
      },
    },
  ),
);
