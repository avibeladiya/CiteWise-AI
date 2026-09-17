import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
type V = 'default' | 'success' | 'warning' | 'error' | 'brand'
export function Badge({ className, variant = 'default', children, ...p }: HTMLAttributes<HTMLSpanElement> & { variant?: V }) {
  const v = { default: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', success: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400', warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400', error: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400', brand: 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300' }
  return <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', v[variant], className)} {...p}>{children}</span>
}
