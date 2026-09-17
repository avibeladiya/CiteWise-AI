import { BookOpen, Zap, Quote, ArrowRight, Moon, Sun, Sparkles } from 'lucide-react'
import { UploadZone } from '@/components/upload/UploadZone'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useTheme } from '@/hooks/useTheme'
import { useDocStore } from '@/store/useDocStore'
import { useUIStore } from '@/store/useUIStore'
import { formatBytes, formatRelative } from '@/lib/utils'

const FEATURES = [
  { icon: BookOpen, title: 'Upload any document', desc: 'PDF or TXT files up to 10 MB. Text extraction is automatic.' },
  { icon: Zap,      title: 'Ask in plain English', desc: 'No special syntax. Just ask what you want to know.' },
  { icon: Quote,    title: 'Every answer is cited', desc: 'Every claim is backed by the exact page and quote from your document.' },
]

export function LandingPage() {
  const { dark, toggleDark } = useTheme()
  const docs    = useDocStore((s) => s.docs)
  const select  = useDocStore((s) => s.select)
  const setView = useUIStore((s) => s.setView)

  function openDoc(id: string) { select(id); setView('workspace') }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent-500/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-600 shadow-brand">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold text-surface-900 dark:text-white tracking-tight">
            CiteWise <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent-500">AI</span>
          </span>
        </div>
        <button onClick={toggleDark} aria-label={dark ? 'Light mode' : 'Dark mode'} className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/50 dark:bg-surface-800/50 backdrop-blur-md border border-white/20 dark:border-surface-700/50 text-surface-600 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-700 hover:shadow-soft transition-all">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center px-6 pt-16 pb-24 max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 dark:bg-surface-800/60 backdrop-blur-md border border-brand-200/50 dark:border-brand-500/30 text-brand-700 dark:text-brand-300 text-sm font-semibold mb-8 shadow-sm animate-slide-up">
          <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
          Powered by Amazon Bedrock · Claude 3 Haiku
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-center text-surface-900 dark:text-white tracking-tight leading-[1.1] mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Uncover insights from<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-accent-500 to-brand-500 animate-shimmer bg-[length:200%_auto]">
            your documents
          </span>
        </h1>

        <p className="text-lg md:text-xl text-center text-surface-600 dark:text-surface-400 max-w-2xl leading-relaxed mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Upload your PDFs or text files and ask questions in plain English. Get precise answers instantly, backed by exact page citations and quotes.
        </p>

        <div className="w-full max-w-2xl animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="glass-panel rounded-3xl p-2">
            <UploadZone />
          </div>
        </div>

        {docs.length > 0 && (
          <div className="w-full max-w-2xl mt-16 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-sm font-bold text-surface-500 dark:text-surface-400 uppercase tracking-widest">Recent Documents</h2>
              {docs.length > 3 && (
                <button onClick={() => setView('workspace')} className="text-sm text-brand-600 dark:text-brand-400 hover:text-accent-500 transition-colors flex items-center gap-1 font-semibold group">
                  View all <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
            <div className="space-y-3">
              {docs.slice(0, 3).map((doc) => (
                <button key={doc.document_id} onClick={() => openDoc(doc.document_id)} disabled={doc.status !== 'ready'}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl glass-panel hover:border-brand-400/50 dark:hover:border-brand-500/50 hover:-translate-y-1 hover:shadow-brand transition-all duration-300 text-left disabled:opacity-60 disabled:cursor-not-allowed group">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 shrink-0 group-hover:bg-brand-100 dark:group-hover:bg-brand-800/50 transition-colors">
                    <BookOpen className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-surface-800 dark:text-surface-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{doc.document_name}</p>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5 font-medium">{formatBytes(doc.file_size)}{doc.page_count > 0 && ` · ${doc.page_count} pages`} · {formatRelative(doc.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={doc.status} />
                    {doc.status === 'ready' && <ArrowRight className="h-5 w-5 text-surface-400 group-hover:text-brand-500 transition-colors" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-24 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center gap-3 p-6 rounded-3xl glass-panel hover:-translate-y-2 hover:shadow-glow transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-900/40 dark:to-accent-900/40 mb-2">
                <Icon className="h-6 w-6 text-brand-600 dark:text-accent-400" />
              </div>
              <p className="text-lg font-bold text-surface-900 dark:text-white">{title}</p>
              <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed font-medium">{desc}</p>
            </div>
          ))}
        </div>
      </main>
      <footer className="relative z-10 text-center py-8 text-sm font-medium text-surface-500 dark:text-surface-500">
        CiteWise AI · Built on AWS Bedrock · No data stored beyond your session
      </footer>
    </div>
  )
}
