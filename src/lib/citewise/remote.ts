import type { Doc, QueryResponse } from "@/lib/rag/types";

export function apiOrigin(): string | null {
  const raw = import.meta.env.VITE_API_URL;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/\/$/, "");
  return trimmed || null;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

export async function remoteUpload(file: File): Promise<Doc> {
  const origin = apiOrigin();
  if (!origin) throw new Error("Render API is not configured");
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${origin}/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await readError(res));
  const doc = (await res.json()) as Doc;
  return { ...doc, origin: "remote" };
}

export async function remoteAsk(documentId: string, question: string): Promise<QueryResponse> {
  const origin = apiOrigin();
  if (!origin) throw new Error("Render API is not configured");
  const res = await fetch(`${origin}/documents/${documentId}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as QueryResponse;
}
