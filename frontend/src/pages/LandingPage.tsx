import * as React from 'react'
import { BookOpen, Zap, Quote, ArrowRight, Moon, Sun } from 'lucide-react'
import { UploadZone } from '@/components/upload/UploadZone'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/hooks/useTheme'
import { useDocumentStore } from '@/store/useDocumentStore'
import { useUIStore } from '@/store/useUIStore'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatFileSize, formatDate } from '@/lib/utils'

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Upload any document',
    description: 'PDF or TXT files up to 10 MB. We handle extraction automatically.',
  },
  {
    icon: Zap,
    title: 'Ask in plain English',
    description: 'No special syntax needed. Just ask what you want to know.',
  },
  {
    icon: Quote,
    title: 'Every answer is cited',
    description: 'Every claim is backed by the exact page and quote from your document.',
  },
]

export function LandingPage() {
  const { darkMode, toggleDarkMode } = useTheme()
  const documents = useDocumentStore((s) => s.documents)
  const { selectDocument, setView } = useUIStore() as unknown as {
    selectDocument: (id: string) => void
    setView: (v: 'workspace') => void
  }
  const selectDoc = useDocumentStore((s) => s.selectDocument)
  const setViewUI = useUIStore((s) => s.setView)

  const recentDocs = documents.slice(0, 3)

  function openDocument(id: string) {
    selectDoc(id)
    setViewUI('workspace')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/20 flex flex-col">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 shadow-indigo">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
              <path d="M7 8h10M7 12h7M7 16h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <circle cx="19" cy="17" r="4" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5" />
              <path d="M17.5 17l1 1 2-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            CiteWise <span className="text-indigo-600 dark:text-indigo-400">AI</span>
          </span>
        </div>

        <button
          onClick={toggleDarkMode}
          className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center px-6 pt-12 pb-20 max-w-3xl mx-auto w-full">
        {/* Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-medium mb-7 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse-soft" aria-hidden="true" />
          Powered by Amazon Bedrock · Claude 3 Haiku
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-center text-slate-900 dark:text-slate-50 tracking-tight leading-tight mb-5 animate-slide-up">
          Ask anything about
          <br />
          <span className="text-indigo-600 dark:text-indigo-400">your documents</span>
        </h1>

        <p className="text-lg text-center text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed mb-10 animate-slide-up">
          Upload a PDF or text file. Ask questions in plain English.
          Get grounded answers with exact citations — page number and quote included.
        </p>

        {/* Upload zone */}
        <div className="w-full animate-slide-up">
          <UploadZone />
        </div>

        {/* Recent documents */}
        {recentDocs.length > 0 && (
          <div className="w-full mt-12 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Recent documents
              </h2>
              {documents.length > 3 && (
                <button
                  onClick={() => setViewUI('workspace')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {recentDocs.map((doc) => (
                <button
                  key={doc.document_id}
                  onClick={() => openDocument(doc.document_id)}
                  disabled={doc.status !== 'ready'}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-soft transition-all duration-200 text-left disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex-shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/50 transition-colors">
                    <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {doc.document_name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {formatFileSize(doc.file_size)}
                      {doc.page_count > 0 && ` · ${doc.page_count} pages`}
                      {' · '}
                      {formatDate(doc.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={doc.status} />
                    {doc.status === 'ready' && (
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" aria-hidden="true" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feature pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-14 animate-fade-in">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 mb-1">
                <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="text-center py-6 text-xs text-slate-400 dark:text-slate-600">
        CiteWise AI · Built on AWS Bedrock · No data stored beyond your session
      </footer>
    </div>
  )
}
