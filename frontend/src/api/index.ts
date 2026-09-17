/**
 * CiteWise AI — API client
 *
 * Automatically switches between:
 *   - REAL mode:  calls the Render FastAPI backend (VITE_API_URL set, VITE_USE_MOCK=false)
 *   - MOCK mode:  full in-browser simulation, no backend needed (default for dev)
 *
 * The Render backend accepts multipart/form-data for file uploads (POST /upload).
 * It does NOT use a presigned URL flow — the file goes directly to the server.
 */

import axios, { type AxiosProgressEvent } from 'axios'
import type { Doc, QueryResponse } from '@/types'
import { generateId } from '@/lib/utils'

// ── Config ─────────────────────────────────────────────────────────────────────
const API_URL  = (import.meta.env.VITE_API_URL  ?? '').trim()
const USE_MOCK = !API_URL || import.meta.env.VITE_USE_MOCK === 'true'

export const http = axios.create({
  baseURL: API_URL,
  timeout: 120_000,   // 2 min — processing can take a while on Render free tier
})

http.interceptors.response.use(
  (r) => r,
  (e) =>
    Promise.reject(
      new Error(
        e.response?.data?.detail ??      // FastAPI validation errors
        e.response?.data?.error ??
        e.response?.data?.message ??
        e.message ??
        'Request failed',
      ),
    ),
)

// ── Mock store ─────────────────────────────────────────────────────────────────
const _mockDocs = new Map<string, Doc>()

const MOCK_ANSWERS = [
  {
    kw: ['gradient', 'descent', 'optim', 'learn', 'backprop'],
    answer:
      'Gradient descent minimizes the loss function by stepping in the negative gradient direction [1]. The learning rate controls step size — too large causes divergence; too small causes slow convergence [2]. Adam adapts per-parameter learning rates for faster convergence [3].',
    citations: [
      { citation_number: 1, page_number: 3, chunk_index: 7, quote: 'Gradient descent updates model weights by computing the gradient of the loss and stepping in the opposite direction.' },
      { citation_number: 2, page_number: 3, chunk_index: 8, quote: 'The learning rate α controls the step size. Too large causes overshooting; too small results in slow convergence.' },
      { citation_number: 3, page_number: 3, chunk_index: 9, quote: 'Adaptive optimizers such as Adam maintain per-parameter learning rates and are the default in modern deep learning.' },
    ],
  },
  {
    kw: ['neural', 'network', 'deep', 'layer', 'relu', 'activation'],
    answer:
      'Neural networks consist of layers of neurons, each applying a weighted sum and a non-linear activation function [1]. Depth enables hierarchical feature learning [2]. ReLU is the default activation because it resists vanishing gradients [3].',
    citations: [
      { citation_number: 1, page_number: 4, chunk_index: 10, quote: 'Each neuron computes a weighted sum of its inputs, adds a bias, and applies a non-linear activation to produce its output.' },
      { citation_number: 2, page_number: 4, chunk_index: 11, quote: 'Deeper networks represent more complex functions through hierarchical composition of features across layers.' },
      { citation_number: 3, page_number: 4, chunk_index: 12, quote: 'ReLU has become the default activation due to its simplicity and resistance to the vanishing gradient problem.' },
    ],
  },
  {
    kw: ['transform', 'attention', 'bert', 'gpt', 'self-attention', 'llm'],
    answer:
      'The Transformer replaces recurrence with self-attention, enabling full parallelization [1]. Multi-head attention attends to different representation subspaces simultaneously [2]. Pre-trained models like BERT fine-tune this architecture with minimal changes [3].',
    citations: [
      { citation_number: 1, page_number: 5, chunk_index: 14, quote: 'The Transformer dispenses with recurrence entirely, relying on self-attention to draw global dependencies between positions.' },
      { citation_number: 2, page_number: 5, chunk_index: 15, quote: 'Multi-head attention allows the model to jointly attend to information from different representation subspaces.' },
      { citation_number: 3, page_number: 5, chunk_index: 16, quote: 'BERT is pre-trained on masked language modelling then fine-tuned on specific tasks with minimal architectural changes.' },
    ],
  },
  {
    kw: ['rag', 'retrieval', 'augmented', 'generation', 'vector', 'embed'],
    answer:
      'RAG connects a language model to an external knowledge source at inference time [1]. Documents are chunked, embedded, and retrieved by similarity before generation [2]. RAG reduces hallucination by anchoring responses to retrieved evidence [3].',
    citations: [
      { citation_number: 1, page_number: 6, chunk_index: 17, quote: 'RAG enhances generative language models by connecting them to an external knowledge source at inference time.' },
      { citation_number: 2, page_number: 6, chunk_index: 18, quote: 'Documents are split into chunks, each chunk is embedded, and vectors are stored in a retrieval index.' },
      { citation_number: 3, page_number: 6, chunk_index: 19, quote: 'RAG significantly reduces hallucination by anchoring the model\'s responses to retrieved evidence.' },
    ],
  },
  {
    kw: ['revenue', 'growth', 'profit', 'quarter', 'financial', 'margin', 'earnings'],
    answer:
      'Total revenue reached $4.2 billion, representing 23% year-over-year growth [1]. Operating margin improved to 18.4%, a 340 basis-point increase [2]. Full-year guidance was raised to $16.8–$17.2 billion [3].',
    citations: [
      { citation_number: 1, page_number: 1, chunk_index: 1, quote: 'Total revenue of $4.2 billion representing 23% year-over-year growth, exceeding analyst consensus of $3.9 billion.' },
      { citation_number: 2, page_number: 1, chunk_index: 2, quote: 'Operating income increased to $772 million, representing an operating margin of 18.4%, a 340 basis-point improvement.' },
      { citation_number: 3, page_number: 1, chunk_index: 3, quote: 'We are raising our full-year revenue outlook to $16.8 billion to $17.2 billion, up from prior guidance of $16.0–$16.5 billion.' },
    ],
  },
]

function _mockAnswer(question: string): QueryResponse {
  const q = question.toLowerCase()
  for (const s of MOCK_ANSWERS) {
    if (s.kw.some((k) => q.includes(k))) {
      return { answer: s.answer, citations: s.citations, chunks_used: s.citations.length, latency_ms: 800 + (Math.random() * 600 | 0) }
    }
  }
  return {
    answer: 'Based on the document, here is what I found relevant to your question [1][2]. The text addresses this topic across several sections with key context provided in the early pages.',
    citations: [
      { citation_number: 1, page_number: 1, chunk_index: 1, quote: 'This document provides a comprehensive overview, establishing foundational concepts in the opening sections.' },
      { citation_number: 2, page_number: 2, chunk_index: 3, quote: 'Subsequent sections explore practical applications and real-world implications of the core principles.' },
    ],
    chunks_used: 2,
    latency_ms: 600 + (Math.random() * 400 | 0),
  }
}

const _delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ── Public API ─────────────────────────────────────────────────────────────────
export const api = {

  /**
   * Upload a file to the backend.
   * REAL:  POST /upload  multipart/form-data  → returns full Doc object
   * MOCK:  simulates upload + processing delay
   */
  async uploadFile(
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<Doc> {
    if (USE_MOCK) {
      // Simulate upload progress
      for (let p = 0; p <= 100; p += 20) {
        await _delay(80)
        onProgress?.(p)
      }
      const document_id   = generateId()
      const created_at    = new Date().toISOString()
      const processingDoc: Doc = {
        document_id,
        document_name: file.name,
        s3_key:        `documents/${document_id}/${file.name}`,
        status:        'processing',
        page_count:    0,
        chunk_count:   0,
        file_size:     file.size,
        created_at,
      }
      _mockDocs.set(document_id, processingDoc)

      // Simulate async processing
      setTimeout(async () => {
        await _delay(2500 + Math.random() * 1500)
        const d = _mockDocs.get(document_id)
        if (d) {
          _mockDocs.set(document_id, {
            ...d,
            status:      'ready',
            page_count:  5 + (Math.random() * 12 | 0),
            chunk_count: 12 + (Math.random() * 28 | 0),
          })
        }
      }, 0)

      return processingDoc
    }

    // Real: POST /upload  multipart/form-data
    const form = new FormData()
    form.append('file', file)

    const { data } = await http.post<Doc>('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e: AxiosProgressEvent) => {
        if (e.total) onProgress?.(Math.round((e.loaded * 100) / e.total))
      },
      timeout: 180_000,   // 3 min for large file + processing on Render free tier
    })
    return data
  },

  async getDoc(documentId: string): Promise<Doc> {
    if (USE_MOCK) {
      await _delay(100)
      const d = _mockDocs.get(documentId)
      if (!d) throw new Error('Document not found')
      return { ...d }
    }
    const { data } = await http.get<Doc>(`/documents/${documentId}`)
    return data
  },

  async listDocs(): Promise<Doc[]> {
    if (USE_MOCK) {
      await _delay(100)
      return [..._mockDocs.values()].sort((a, b) => b.created_at.localeCompare(a.created_at))
    }
    const { data } = await http.get<{ documents: Doc[] }>('/documents')
    return data.documents
  },

  async deleteDoc(documentId: string): Promise<void> {
    if (USE_MOCK) {
      await _delay(200)
      _mockDocs.delete(documentId)
      return
    }
    await http.delete(`/documents/${documentId}`)
  },

  async ask(documentId: string, question: string): Promise<QueryResponse> {
    if (USE_MOCK) {
      const d = _mockDocs.get(documentId)
      if (!d) throw new Error('Document not found')
      if (d.status !== 'ready') throw new Error('Document is still processing')
      await _delay(1200 + Math.random() * 800)
      return _mockAnswer(question)
    }
    const { data } = await http.post<QueryResponse>(`/documents/${documentId}/query`, { question })
    return data
  },
}
