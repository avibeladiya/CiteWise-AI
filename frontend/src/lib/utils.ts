import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (d < 7)  return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s
}

export function fileExt(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function downloadText(content: string, filename: string): void {
  const a = Object.assign(document.createElement('a'), {
    href:     URL.createObjectURL(new Blob([content], { type: 'text/plain' })),
    download: filename,
  })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
