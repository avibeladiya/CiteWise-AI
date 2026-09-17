import { useDropzone } from 'react-dropzone'
import { Upload, FileText, File } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUpload } from '@/hooks/useUpload'

interface Props { compact?: boolean; className?: string }

export function UploadZone({ compact, className }: Props) {
  const upload = useUpload()
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    onDropAccepted: ([f]) => upload(f),
  })
  const active = isDragActive && !isDragReject

  if (compact) {
    return (
      <div {...getRootProps()} tabIndex={0} role="button" aria-label="Upload document"
        className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
          active ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/30' : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 hover:bg-brand-50/40 dark:hover:bg-brand-950/20', className)}>
        <input {...getInputProps()} />
        <Upload className="h-4 w-4 text-brand-500 shrink-0" aria-hidden />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{active ? 'Drop file…' : 'Upload document'}</span>
      </div>
    )
  }

  return (
    <div {...getRootProps()} tabIndex={0} role="button" aria-label="Upload a PDF or TXT file"
      className={cn('flex flex-col items-center justify-center gap-5 w-full rounded-3xl border-2 border-dashed cursor-pointer p-12 md:p-16 transition-all duration-300',
        active         ? 'border-brand-400 bg-brand-50/80 dark:bg-brand-950/30 scale-[1.01] shadow-brand' :
        isDragReject   ? 'border-red-400 bg-red-50 dark:bg-red-950/20' :
                         'border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 hover:border-brand-400 hover:bg-brand-50/40 dark:hover:bg-brand-950/20 hover:shadow-card', className)}>
      <input {...getInputProps()} />
      <div className="relative flex items-end justify-center gap-1 h-16" aria-hidden>
        <div className={cn('flex items-center justify-center w-12 h-14 rounded-2xl shadow-soft transition-all duration-300 -rotate-6 -translate-x-1', active ? 'bg-brand-100 dark:bg-brand-900/50' : 'bg-slate-100 dark:bg-slate-800')}>
          <FileText className="h-6 w-6 text-slate-400" />
        </div>
        <div className={cn('flex items-center justify-center w-14 h-16 rounded-2xl shadow-card z-10 transition-all duration-300', active ? 'bg-brand-500 scale-110' : 'bg-brand-600 dark:bg-brand-500')}>
          <Upload className="h-7 w-7 text-white" />
        </div>
        <div className={cn('flex items-center justify-center w-12 h-14 rounded-2xl shadow-soft transition-all duration-300 rotate-6 translate-x-1', active ? 'bg-brand-100 dark:bg-brand-900/50' : 'bg-slate-100 dark:bg-slate-800')}>
          <File className="h-6 w-6 text-slate-400" />
        </div>
      </div>
      <div className="text-center space-y-1">
        {active
          ? <p className="text-base font-semibold text-brand-600 dark:text-brand-400">Release to upload</p>
          : isDragReject
            ? <p className="text-base font-semibold text-red-600">Unsupported file type</p>
            : <>
                <p className="text-base font-semibold text-slate-800 dark:text-slate-200">Drag & drop your document here</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">or <span className="text-brand-600 dark:text-brand-400 font-medium underline underline-offset-2">browse to choose</span></p>
              </>}
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
        {['PDF or TXT', 'Max 10 MB', 'Up to 20 pages'].map((l) => (
          <span key={l} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden />{l}</span>
        ))}
      </div>
    </div>
  )
}
