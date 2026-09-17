import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
interface Props { icon: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }
export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-6 py-12 animate-fade-in', className)}>
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/30 text-brand-500 dark:text-brand-400 mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1.5">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-5">{description}</p>}
      {action}
    </div>
  )
}
