import { useMemo, useState } from 'react'
import { X, BookOpen, Quote, ChevronRight, Download } from 'lucide-react'
import { cn, downloadText } from '@/lib/utils'
import { useUIStore } from '@/store/useUIStore'
import { useChatStore } from '@/store/useChatStore'
import { useDocStore } from '@/store/useDocStore'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Citation } from '@/types'

function CitationCard({ c }: { c: Citation }) {
  const [open, setOpen] = useState(true)
  return (
    <div className={cn('rounded-2xl border transition-all duration-200 overflow-hidden', 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900', 'hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-soft')}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-3 w-full p-3.5 text-left" aria-expanded={open}>
        <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 text-xs font-bold">{c.citation_number}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-brand-500 shrink-0" />
            <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">Page {c.page_number}</span>
            <span className="text-xs text-slate-400"> · Chunk {c.chunk_index}</span>
          </div>
        </div>
        <ChevronRight className={cn('h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200', open && 'rotate-90')} />
      </button>
      {open && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <Quote className="h-3.5 w-3.5 text-brand-300 dark:text-brand-700 shrink-0 mt-0.5 rotate-180" />
            <blockquote className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">{c.quote}</blockquote>
          </div>
        </div>
      )}
    </div>
  )
}

export function CitationsPanel() {
  const { citationsMsgId, showCitations } = useUIStore()
  const selectedId = useDocStore((s) => s.selectedId)
  const msgs       = useChatStore((s) => (selectedId ? s.msgs(selectedId) : []))
  const activeMsg  = useMemo(() => msgs.find((m) => m.id === citationsMsgId) ?? null, [msgs, citationsMsgId])
  const citations  = activeMsg?.citations ?? []
  const isOpen     = !!citationsMsgId

  function downloadSources() {
    if (!activeMsg) return
    const lines = ['CiteWise AI – Sources', '', `Answer: ${activeMsg.content}`, '', 'Citations:', ...citations.map((c) => `[${c.citation_number}] Page ${c.page_number}\n"${c.quote}"`)]
    downloadText(lines.join('\n'), `sources-${activeMsg.id.slice(0, 8)}.txt`)
  }

  return (
    <aside className={cn('flex flex-col h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 transition-all duration-300 overflow-hidden', isOpen ? 'w-80 xl:w-96' : 'w-0')}>
      <div className="flex flex-col h-full min-w-80 xl:min-w-96">
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Sources</h2>
            {citations.length > 0 && <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 text-xs font-bold">{citations.length}</span>}
          </div>
          <div className="flex items-center gap-1">
            {citations.length > 0 && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={downloadSources} title="Download sources"><Download className="h-3.5 w-3.5" /></Button>}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => showCitations(null)} title="Close" aria-label="Close sources panel"><X className="h-4 w-4" /></Button>
          </div>
        </div>
        {activeMsg && (
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed"><span className="font-medium text-slate-600 dark:text-slate-300">Answer: </span>{activeMsg.content.slice(0, 120)}{activeMsg.content.length > 120 && '…'}</p>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {citations.length === 0
            ? <EmptyState icon={<Quote className="h-6 w-6" />} title="No sources selected" description="Click the sources icon on an AI answer to view citations here." className="py-10" />
            : citations.map((c) => <CitationCard key={c.citation_number} c={c} />)}
        </div>
        {citations.length > 0 && <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0"><p className="text-xs text-slate-400 dark:text-slate-600 text-center">All quotes are verbatim excerpts from your document.</p></div>}
      </div>
    </aside>
  )
}
