import { useCallback } from 'react'
import { api } from '@/api'
import { useDocStore } from '@/store/useDocStore'
import { useChatStore } from '@/store/useChatStore'
import { useUIStore } from '@/store/useUIStore'

export function useAsk() {
  const selectedDoc = useDocStore((s) => s.selectedDoc)
  const { addMsg, setLoading } = useChatStore()
  const { toast, showCitations } = useUIStore()

  return useCallback(async (question: string) => {
    const doc = selectedDoc()
    if (!doc || doc.status !== 'ready') {
      toast({ type: 'warning', title: 'Document not ready', description: 'Wait for processing to complete.' })
      return
    }
    addMsg({ role: 'user', content: question, document_id: doc.document_id })
    setLoading(doc.document_id)
    try {
      const res = await api.ask(doc.document_id, question)
      const msg = addMsg({ role: 'assistant', content: res.answer, citations: res.citations, chunks_used: res.chunks_used, document_id: doc.document_id })
      if (res.citations.length > 0) showCitations(msg.id)
    } catch (e) {
      addMsg({ role: 'error', content: e instanceof Error ? e.message : 'Query failed. Please try again.', document_id: doc.document_id })
      toast({ type: 'error', title: 'Query failed', description: e instanceof Error ? e.message : undefined })
    } finally {
      setLoading(null)
    }
  }, [selectedDoc, addMsg, setLoading, toast, showCitations])
}
