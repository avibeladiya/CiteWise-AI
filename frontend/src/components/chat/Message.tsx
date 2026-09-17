import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { AlertCircle, BookOpen, Download, Quote, ChevronDown } from 'lucide-react'
import { cn, formatRelative, downloadText } from '@/lib/utils'
import { useUIStore } from '@/store/useUIStore'
import { Button } from '@/components/ui/Button'
import type { Msg, Citation } from '@/types'

function CitationChip({ c, onClick }: { c: Citation; onClick: () => void }) {
  return (
    <button onClick={onClick} className="citation-card flex items-start gap-3 w-full text-left" aria-label={`Citation ${c.citation_number} – page ${c.page_number}`}>
      <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 text-xs font-bold mt-0.5">{c.citation_number}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <BookOpen className="h-3.5 w-3.5 text-brand-500 shrink-0" aria-hidden />
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">Page {c.page_number}</span>
          <span className="text-xs text-slate-400"> · Chunk {c.chunk_index}</span>
        </div>
        <blockquote className="flex items-start gap-1.5">
          <Quote className="h-3 w-3 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5 rotate-180" aria-hidden />
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 italic">{c.quote}</p>
        </blockquote>
      </div>
    </button>
  )
}

export function Message({ msg }: { msg: Msg }) {
  const [expanded, setExpanded] = useState(true)
  const { citationsMsgId, showCitations } = useUIStore()
  const active = citationsMsgId === msg.id
  const hasCitations = (msg.citations?.length ?? 0) > 0

  function handleDownload() {
    const lines = ['CiteWise AI – Answer', '', msg.content]
    if (msg.citations?.length) { lines.push('', 'Sources:'); msg.citations.forEach((c) => lines.push(`[${c.citation_number}] Page ${c.page_number} — "${c.quote}"`)) }
    downloadText(lines.join('\n'), `citewise-${msg.id.slice(0, 8)}.txt`)
  }

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end gap-2 animate-slide-up">
        <div className="max-w-[78%] md:max-w-[65%]">
          <div className="px-4 py-3 bg-brand-600 text-white rounded-2xl rounded-tr-sm shadow-brand"><p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p></div>
          <p className="text-right text-xs text-slate-400 dark:text-slate-600 mt-1 pr-1">{formatRelative(msg.timestamp)}</p>
        </div>
      </div>
    )
  }

  if (msg.role === 'error') {
    return (
      <div className="flex gap-3 animate-slide-up">
        <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/50 mt-1"><AlertCircle className="h-4 w-4 text-red-500" aria-hidden /></div>
        <div className="max-w-[78%]">
          <div className="px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl rounded-tl-sm"><p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">{msg.content}</p></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 animate-slide-up group/m">
      <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-brand-600 mt-1" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M7 8h10M7 12h7M7 16h8" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
      </div>
      <div className="flex-1 min-w-0 max-w-[calc(100%-3rem)]">
        <div className={cn('px-4 py-3.5 rounded-2xl rounded-tl-sm border shadow-soft transition-all duration-200',
          active ? 'border-brand-300 dark:border-brand-700 bg-brand-50/30 dark:bg-brand-950/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900')}>
          <div className="prose-answer text-sm leading-relaxed"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-600 flex-1">{formatRelative(msg.timestamp)}{(msg.chunks_used ?? 0) > 0 && ` · ${msg.chunks_used} source${msg.chunks_used !== 1 ? 's' : ''}`}</p>
            <div className="flex items-center gap-1 opacity-0 group-hover/m:opacity-100 transition-opacity">
              {hasCitations && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => showCitations(active ? null : msg.id)} title="Toggle sources panel" aria-label="Toggle sources panel"><BookOpen className="h-3.5 w-3.5" /></Button>}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload} title="Download answer" aria-label="Download answer"><Download className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        </div>
        {hasCitations && (
          <div className="mt-2">
            <button onClick={() => setExpanded((e) => !e)} className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-2" aria-expanded={expanded}>
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              {msg.citations!.length} source{msg.citations!.length !== 1 ? 's' : ''}
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', expanded && 'rotate-180')} aria-hidden />
            </button>
            {expanded && <div className="space-y-2 animate-fade-in">{msg.citations!.map((c) => <CitationChip key={c.citation_number} c={c} onClick={() => showCitations(active ? null : msg.id)} />)}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
