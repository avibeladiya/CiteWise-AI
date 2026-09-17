import { useEffect, useRef, useState } from 'react'
import { BookOpen, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { useDocStore } from '@/store/useDocStore'
import { useChatStore } from '@/store/useChatStore'
import { useUIStore } from '@/store/useUIStore'
import { useAsk } from '@/hooks/useAsk'
import { formatBytes } from '@/lib/utils'
import { Message } from './Message'
import { TypingIndicator } from './TypingIndicator'
import { ChatInput } from './ChatInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ConfirmDialog } from '@/components/ui/Dialog'

const SUGGESTIONS = ['What is the main topic of this document?', 'Summarise the key points.', 'What conclusions does the author draw?', 'Are there any statistics or data mentioned?']

export function ChatView() {
  const doc        = useDocStore((s) => s.selectedDoc())
  const selectedId = useDocStore((s) => s.selectedId)
  const msgs       = useChatStore((s) => (selectedId ? s.msgs(selectedId) : []))
  const isLoading  = useChatStore((s) => (selectedId ? s.isLoading(selectedId) : false))
  const clearThread= useChatStore((s) => s.clearThread)
  const ask        = useAsk()
  const bottomRef  = useRef<HTMLDivElement>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs.length, isLoading])

  if (!doc) return <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950"><EmptyState icon={<BookOpen className="h-7 w-7" />} title="No document selected" description="Choose a document from the sidebar or upload one to begin." /></div>

  if (doc.status === 'uploading' || doc.status === 'processing') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 bg-slate-50 dark:bg-slate-950 px-6">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/30"><Loader2 className="h-7 w-7 text-brand-500 animate-spin" /></div>
        <div className="text-center">
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">{doc.status === 'uploading' ? 'Uploading document…' : 'Processing document…'}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{doc.status === 'processing' ? 'Extracting text and generating embeddings. Usually 15–30 seconds.' : 'Uploading your file…'}</p>
        </div>
        <StatusBadge status={doc.status} />
      </div>
    )
  }

  if (doc.status === 'failed') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950 px-6">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/30"><AlertTriangle className="h-7 w-7 text-red-500" /></div>
        <div className="text-center"><p className="text-base font-semibold text-slate-800 dark:text-slate-200">Processing failed</p><p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{doc.error_message ?? 'Unknown error. Please try uploading again.'}</p></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center gap-3 px-5 py-3.5 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/30 shrink-0"><BookOpen className="h-4 w-4 text-brand-600 dark:text-brand-400" /></div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate" title={doc.document_name}>{doc.document_name}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{formatBytes(doc.file_size)}{doc.page_count > 0 && ` · ${doc.page_count} pages`}{doc.chunk_count > 0 && ` · ${doc.chunk_count} chunks`}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge status={doc.status} />
          {msgs.length > 0 && <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => setConfirmClear(true)} title="Clear chat" aria-label="Clear conversation"><Trash2 className="h-4 w-4" /></Button>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6" aria-label="Conversation" aria-live="polite">
        {msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 animate-fade-in">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/30 mx-auto mb-3"><BookOpen className="h-6 w-6 text-brand-500" /></div>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200">Ready to answer your questions</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">Every answer includes exact citations — page number and verbatim quote.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
              {SUGGESTIONS.map((q) => <button key={q} onClick={() => ask(q)} className="text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-400 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 hover:text-slate-800 dark:hover:text-slate-200 transition-all duration-200">{q}</button>)}
            </div>
          </div>
        ) : (
          <>{msgs.map((m) => <Message key={m.id} msg={m} />)}{isLoading && <TypingIndicator />}</>
        )}
        <div ref={bottomRef} aria-hidden />
      </div>
      <ChatInput onSubmit={ask} disabled={doc.status !== 'ready'} loading={isLoading} placeholder={doc.status !== 'ready' ? 'Document is being processed…' : 'Ask anything about this document…'} />
      <ConfirmDialog open={confirmClear} onClose={() => setConfirmClear(false)} onConfirm={() => { clearThread(doc.document_id); setConfirmClear(false) }} title="Clear conversation?" description="All messages will be removed. The document stays." confirmLabel="Clear" />
    </div>
  )
}
