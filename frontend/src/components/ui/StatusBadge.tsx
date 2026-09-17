import { CheckCircle, Loader2, Clock, AlertCircle } from 'lucide-react'
import { Badge } from './Badge'
import type { DocStatus } from '@/types'
export function StatusBadge({ status }: { status: DocStatus }) {
  switch (status) {
    case 'ready':      return <Badge variant="success"><CheckCircle className="h-3 w-3" />Ready</Badge>
    case 'processing': return <Badge variant="brand"><Loader2 className="h-3 w-3 animate-spin" />Processing</Badge>
    case 'uploading':  return <Badge variant="warning"><Clock className="h-3 w-3" />Uploading</Badge>
    case 'failed':     return <Badge variant="error"><AlertCircle className="h-3 w-3" />Failed</Badge>
  }
}
