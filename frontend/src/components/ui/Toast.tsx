import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/useUIStore'
import type { ToastItem } from '@/types'

const iconMap  = { success: CheckCircle, error: XCircle, warning: AlertCircle, info: Info }
const colorMap = { success: { border: 'border-emerald-200 dark:border-emerald-800', icon: 'text-emerald-500' }, error: { border: 'border-red-200 dark:border-red-900', icon: 'text-red-500' }, warning: { border: 'border-amber-200 dark:border-amber-800', icon: 'text-amber-500' }, info: { border: 'border-brand-200 dark:border-brand-800', icon: 'text-brand-500' } }

function Item({ t }: { t: ToastItem }) {
  const dismiss = useUIStore((s) => s.dismissToast)
  const Icon = iconMap[t.type]; const c = colorMap[t.type]
  return (
    <div role="alert" aria-live="polite" className={cn('flex items-start gap-3 w-full max-w-sm p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-card animate-slide-up', c.border)}>
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', c.icon)} aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.title}</p>
        {t.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{t.description}</p>}
      </div>
      <button onClick={() => dismiss(t.id)} className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Dismiss"><X className="h-4 w-4" /></button>
    </div>
  )
}

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts)
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => <div key={t.id} className="pointer-events-auto"><Item t={t} /></div>)}
    </div>
  )
}
