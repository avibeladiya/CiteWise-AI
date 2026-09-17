import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props { onSubmit: (q: string) => void; disabled?: boolean; loading?: boolean; placeholder?: string }

export function ChatInput({ onSubmit, disabled, loading, placeholder }: Props) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current; if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const q = value.trim(); if (!q || disabled || loading) return
    onSubmit(q); setValue('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  const canSubmit = value.trim().length > 0 && !disabled && !loading

  return (
    <form onSubmit={submit} className="flex items-end gap-3 p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className={cn('flex-1 flex items-end gap-2 px-4 py-3 rounded-2xl border transition-all duration-200',
        disabled ? 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50 dark:bg-slate-900' :
        'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-within:border-brand-400 dark:focus-within:border-brand-600 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:shadow-lg')}>
        <textarea ref={ref} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={onKey}
          disabled={disabled || loading}
          placeholder={placeholder ?? 'Ask anything about this document…'}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none leading-relaxed max-h-40 disabled:cursor-not-allowed"
          aria-label="Question" />
        <p className="text-xs text-slate-400 dark:text-slate-600 self-end mb-0.5 shrink-0 hidden sm:block">↵ Enter</p>
      </div>
      <button type="submit" disabled={!loading && !canSubmit}
        className={cn('shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          loading ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-wait' :
          canSubmit ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand hover:-translate-y-px' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed')}
        aria-label="Send">
        {loading
          ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
          : <Send className="h-4 w-4" />}
      </button>
    </form>
  )
}
