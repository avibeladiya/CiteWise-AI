import { Home, Moon, Sun, Sparkles } from 'lucide-react'
import { DocLibrary } from '@/components/documents/DocLibrary'
import { ChatView } from '@/components/chat/ChatView'
import { CitationsPanel } from '@/components/citations/CitationsPanel'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/hooks/useTheme'
import { useUIStore } from '@/store/useUIStore'

export function WorkspacePage() {
  const { dark, toggleDark } = useTheme()
  const setView = useUIStore((s) => s.setView)

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950 relative">
      {/* Subtle Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-brand-500/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 flex w-full h-full p-2 gap-2">
        <div className="h-full glass-panel rounded-2xl overflow-hidden flex flex-col w-72 shrink-0">
          <DocLibrary />
        </div>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden glass-panel rounded-2xl relative shadow-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200/50 dark:border-surface-800/50 bg-white/40 dark:bg-surface-900/40 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" />
              <span className="font-bold text-surface-900 dark:text-white tracking-tight">CiteWise Workspace</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white/50 dark:bg-surface-800/50 hover:bg-white dark:hover:bg-surface-700 hover:shadow-sm" onClick={() => setView('landing')} title="Home" aria-label="Go to home">
                <Home className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white/50 dark:bg-surface-800/50 hover:bg-white dark:hover:bg-surface-700 hover:shadow-sm" onClick={toggleDark} title={dark ? 'Light mode' : 'Dark mode'} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden bg-white/30 dark:bg-surface-950/30">
            <ChatView />
          </div>
        </main>

        <div className="h-full glass-panel rounded-2xl overflow-hidden w-80 shrink-0">
          <CitationsPanel />
        </div>
      </div>
    </div>
  )
}
