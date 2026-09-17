export type DocStatus = 'uploading' | 'processing' | 'ready' | 'failed'

export interface Doc {
  document_id:    string
  document_name:  string
  s3_key:         string
  status:         DocStatus
  page_count:     number
  chunk_count:    number
  file_size:      number
  created_at:     string
  error_message?: string
}

export interface Citation {
  citation_number: number
  page_number:     number
  chunk_index:     number
  quote:           string
}

export interface QueryResponse {
  answer:       string
  citations:    Citation[]
  chunks_used:  number
  latency_ms?:  number
}

export type MsgRole = 'user' | 'assistant' | 'error'

export interface Msg {
  id:           string
  role:         MsgRole
  content:      string
  citations?:   Citation[]
  chunks_used?: number
  timestamp:    string
  document_id:  string
}

export interface ToastItem {
  id:           string
  type:         'success' | 'error' | 'info' | 'warning'
  title:        string
  description?: string
}

export interface UploadProgress {
  document_id: string
  filename:    string
  progress:    number
  stage:       'uploading' | 'processing' | 'done' | 'error'
  error?:      string
}
