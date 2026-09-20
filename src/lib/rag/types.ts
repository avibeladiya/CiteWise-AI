export type DocStatus = "uploading" | "processing" | "ready" | "failed";

export interface Chunk {
  chunk_index: number;
  page_number: number;
  text: string;
  char_start: number;
  char_end: number;
  score?: number;
}

export interface Doc {
  document_id: string;
  document_name: string;
  status: DocStatus;
  page_count: number;
  chunk_count: number;
  file_size: number;
  created_at: string;
  error_message?: string;
  origin?: "local" | "remote";
}

export interface Citation {
  citation_number: number;
  page_number: number;
  chunk_index: number;
  quote: string;
  score?: number;
}

export interface QueryResponse {
  answer: string;
  citations: Citation[];
  chunks_used: number;
  latency_ms?: number;
  grounded?: boolean;
}

export type MsgRole = "user" | "assistant" | "error";

export interface Msg {
  id: string;
  role: MsgRole;
  content: string;
  citations?: Citation[];
  chunks_used?: number;
  timestamp: string;
  document_id: string;
  latency_ms?: number;
  grounded?: boolean;
}

export type ProcessStage = "extract" | "chunk" | "index" | "ready" | "error";
