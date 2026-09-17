import { useState } from 'react'
import { FileText, File, Trash2, MessageSquare, AlertCircle, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { cn, formatBytes, formatRelative, truncate } from '@/lib/utils'
import { useDocStore } from '@/store/useDocStore'
import { useUIStore } from '@/store/useUIStore'
import { useChatStore } from '@/store/useChatStore'
import { api } from '@/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { UploadZone } from '@/components/upload/UploadZone'
import type { Doc } from '@/types'

function DocCard({ doc, selected, onSelect, onDelete }: { doc: Doc; selected: boolean; onSelect: () => void; onDelete: () => void }) {
  const Icon = doc.document_name.toLowerCase().endsWith('.pdf') ? FileText : File
  const uploads = useDocStore((s) => s.uploads)
  const msgCount = useChatStore((s) => s.msgs(doc.document_id).length)
  const upload = uploads.find((u) => u.document_id === doc.document_id)
  return (
    <div onClick={onSelect} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect()} aria-pressed={selected}
      className={cn('group relative flex flex-col gap-2.5 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200',
        selected ? 'border-brand-300 dark:border-brand-700 bg-brand-50/80 dark:bg-brand-950/30 shadow-brand' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-soft')}>
      <div className="flex items-start gap-2.5">
        <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-colors', selected ? 'bg-brand-100 dark:bg-brand-900/50' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/30')}>
          <Icon className={cn('h-4 w-4 transition-colors', selected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-brand-500')} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate" title={doc.document_name}>{truncate(doc.document_name, 28)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{formatBytes(doc.file_size)}{doc.page_count > 0 && ` · ${doc.page_count}p`} · {formatRelative(doc.created_at)}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete() }} aria-label={`Delete ${doc.document_name}`}
          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all duration-150">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={doc.status} />
        {msgCount > 0 && doc.status === 'ready' && <span className="flex items-center gap-1 text-xs text-slate-400 ml-auto"><MessageSquare className="h-3 w-3" />{msgCount}</span>}
        {doc.status === 'ready' && doc.chunk_count > 0 && <span className="text-xs text-slate-400 dark:text-slate-500">{doc.chunk_count} chunks</span>}
      </div>
      {upload && (doc.status === 'uploading' || doc.status === 'processing') && (
        <ProgressBar value={doc.status === 'uploading' ? upload.progress : 100} color={doc.status === 'processing' ? 'brand' : 'emerald'} />
      )}
      {doc.status === 'failed' && doc.error_message && (
        <div className="flex items-start gap-1.5"><AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" /><p className="text-xs text-red-500 leading-snug">{truncate(doc.error_message, 60)}</p></div>
      )}
    </div>
  )
}

export function DocLibrary() {
  const docs       = useDocStore((s) => s.docs)
  const selectedId = useDocStore((s) => s.selectedId)
  const select     = useDocStore((s) => s.select)
  const removeDoc  = useDocStore((s) => s.removeDoc)
  const { deleteThread } = useChatStore()
  const { sidebarOpen, setSidebar, toast } = useUIStore()
  const [target, setTarget] = useState<Doc | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!target) return
    setDeleting(true)
    try {
      await api.deleteDoc(target.document_id)
      removeDoc(target.document_id); deleteThread(target.document_id)
      toast({ type: 'success', title: 'Deleted', description: target.document_name })
    } catch { toast({ type: 'error', title: 'Delete failed' }) }
    finally { setDeleting(false); setTarget(null) }
  }

  return (
    <>
      <aside className={cn('flex flex-col h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 overflow-hidden', sidebarOpen ? 'w-72' : 'w-0')}>
        <div className="flex flex-col h-full min-w-72">
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-600">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden><path d="M7 8h10M7 12h7M7 16h8" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">CiteWise <span className="text-brand-600 dark:text-brand-400">AI</span></span>
            </div>
            <button onClick={() => setSidebar(false)} className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Collapse sidebar"><ChevronLeft className="h-4 w-4" /></button>
          </div>
          <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-800"><UploadZone compact /></div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {docs.length === 0
              ? <EmptyState icon={<BookOpen className="h-6 w-6" />} title="No documents" description="Upload a PDF or TXT file to get started." className="py-8" />
              : docs.map((doc) => <DocCard key={doc.document_id} doc={doc} selected={selectedId === doc.document_id} onSelect={() => select(doc.document_id)} onDelete={() => setTarget(doc)} />)}
          </div>
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-600 text-center">{docs.length} / 20 documents</p>
          </div>
        </div>
      </aside>
      {!sidebarOpen && (
        <button onClick={() => setSidebar(true)} className="fixed left-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-6 h-10 bg-white dark:bg-slate-900 border border-l-0 border-slate-200 dark:border-slate-800 rounded-r-xl text-slate-500 hover:text-brand-600 transition-colors" aria-label="Expand sidebar"><ChevronRight className="h-4 w-4" /></button>
      )}
      <ConfirmDialog open={!!target} onClose={() => setTarget(null)} onConfirm={confirmDelete}
        title="Delete document?" description={`"${target?.document_name}" and all its conversation history will be removed.`}
        confirmLabel="Delete" loading={deleting} />
    </>
  )
}
