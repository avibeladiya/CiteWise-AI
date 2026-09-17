import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface DialogProps { open: boolean; onClose: () => void; title: string; description?: string; children?: ReactNode }
export function Dialog({ open, onClose, title, description, children }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close"><X className="h-5 w-5" /></button>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h2>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{description}</p>}
        {children}
      </div>
    </div>
  )
}

interface ConfirmProps { open: boolean; onClose: () => void; onConfirm: () => void; title: string; description?: string; confirmLabel?: string; loading?: boolean }
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', loading }: ConfirmProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="flex gap-3 justify-end mt-2">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="danger" size="sm" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Dialog>
  )
}
