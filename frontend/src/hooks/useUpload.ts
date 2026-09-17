import { useCallback } from 'react'
import { api } from '@/api'
import { useDocStore } from '@/store/useDocStore'
import { useUIStore } from '@/store/useUIStore'
import { fileExt } from '@/lib/utils'

const MAX_BYTES = 10 * 1024 * 1024
const OK_EXTS   = new Set(['pdf', 'txt'])

export function useUpload() {
  const { upsertDoc, setUpload, clearUpload, select } = useDocStore()
  const { toast, setView } = useUIStore()

  return useCallback(
    async (file: File) => {
      // ── Client-side validation ──────────────────────────────────────────────
      if (!OK_EXTS.has(fileExt(file.name))) {
        toast({ type: 'error', title: 'Unsupported file type', description: 'Only .pdf and .txt files are allowed.' })
        return
      }
      if (file.size > MAX_BYTES) {
        toast({ type: 'error', title: 'File too large', description: 'Maximum file size is 10 MB.' })
        return
      }

      let docId = ''

      try {
        // Optimistic placeholder in sidebar
        const placeholderId = crypto.randomUUID()
        docId = placeholderId

        upsertDoc({
          document_id:   placeholderId,
          document_name: file.name,
          s3_key:        '',
          status:        'uploading',
          page_count:    0,
          chunk_count:   0,
          file_size:     file.size,
          created_at:    new Date().toISOString(),
        })
        setUpload({ document_id: placeholderId, filename: file.name, progress: 0, stage: 'uploading' })
        select(placeholderId)
        setView('workspace')

        // ── Upload (real = multipart POST, mock = simulated) ─────────────────
        const doc = await api.uploadFile(file, (pct) =>
          setUpload({ document_id: placeholderId, filename: file.name, progress: pct, stage: 'uploading' }),
        )

        // Replace placeholder with real document id from server
        docId = doc.document_id
        upsertDoc(doc)
        select(doc.document_id)

        // Remove placeholder if id changed
        if (placeholderId !== doc.document_id) {
          useDocStore.getState().removeDoc(placeholderId)
        }

        setUpload({ document_id: doc.document_id, filename: file.name, progress: 100, stage: 'processing' })

        // If already ready (server processed synchronously), done
        if (doc.status === 'ready') {
          clearUpload(doc.document_id)
          toast({ type: 'success', title: 'Document ready', description: `${doc.document_name} — ${doc.page_count} pages, ${doc.chunk_count} chunks.` })
          return
        }

        // ── Poll until ready / failed ─────────────────────────────────────────
        for (let i = 0; i < 60; i++) {               // up to 2 minutes
          await new Promise((r) => setTimeout(r, 2000))
          const updated = await api.getDoc(doc.document_id)
          upsertDoc(updated)

          if (updated.status === 'ready') {
            clearUpload(doc.document_id)
            toast({
              type:        'success',
              title:       'Document ready',
              description: `${updated.document_name} — ${updated.page_count} pages, ${updated.chunk_count} chunks.`,
            })
            return
          }
          if (updated.status === 'failed') {
            clearUpload(doc.document_id)
            toast({ type: 'error', title: 'Processing failed', description: updated.error_message ?? 'Unknown error.' })
            return
          }
        }
        toast({ type: 'warning', title: 'Still processing', description: 'Taking longer than expected. Refresh to check.' })

      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Upload failed'
        if (docId) {
          clearUpload(docId)
          upsertDoc({
            document_id:   docId,
            document_name: file.name,
            s3_key:        '',
            status:        'failed',
            page_count:    0,
            chunk_count:   0,
            file_size:     file.size,
            created_at:    new Date().toISOString(),
            error_message: msg,
          })
        }
        toast({ type: 'error', title: 'Upload failed', description: msg })
      }
    },
    [upsertDoc, setUpload, clearUpload, select, toast, setView],
  )
}
