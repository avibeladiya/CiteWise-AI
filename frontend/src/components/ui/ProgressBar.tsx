import { cn } from '@/lib/utils'
interface Props { value: number; label?: string; className?: string; color?: 'brand' | 'emerald' | 'amber' }
export function ProgressBar({ value, label, className, color = 'brand' }: Props) {
  const colors = { brand: 'bg-brand-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500' }
  return (
    <div className={cn('w-full', className)}>
      {label && <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>}
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn('h-full rounded-full transition-all duration-300', colors[color])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  )
}
