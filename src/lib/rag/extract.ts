import type { PageText } from "./chunk";

const MAX_PAGES = 20;
const MAX_BYTES = 10 * 1024 * 1024;

export function assertFile(file: File) {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".pdf") && !name.endsWith(".txt")) {
    throw new Error("Use a PDF or TXT file.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("File exceeds the 10 MB limit.");
  }
  if (file.size === 0) {
    throw new Error("That file is empty.");
  }
}

export async function extractPages(file: File): Promise<PageText[]> {
  assertFile(file);
  if (file.name.toLowerCase().endsWith(".txt")) {
    return extractTxt(await file.text());
  }
  return extractPdf(await file.arrayBuffer());
}

export function extractTxt(raw: string): PageText[] {
  const parts = raw.split(/\f|(?=^Page\s+\d+)/im).map((p) => p.trim()).filter(Boolean);
  const pages: PageText[] = [];
  let preamble = "";
  for (const part of parts) {
    const labeled = part.match(/^Page\s+(\d+)/i);
    if (!labeled) {
      preamble = preamble ? `${preamble}\n\n${part}` : part;
      continue;
    }
    const text = preamble ? `${preamble}\n\n${part}` : part;
    preamble = "";
    pages.push({ page: Number(labeled[1]), text });
    if (pages.length >= MAX_PAGES) break;
  }
  if (preamble) {
    if (!pages.length) pages.push({ page: 1, text: preamble });
    else pages[pages.length - 1].text += `\n\n${preamble}`;
  }
  if (!pages.length && raw.trim()) pages.push({ page: 1, text: raw.trim() });
  return pages.slice(0, MAX_PAGES);
}

async function extractPdf(data: ArrayBuffer): Promise<PageText[]> {
  const pdfjs = await import("pdfjs-dist");
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: PageText[] = [];
  const n = Math.min(doc.numPages, MAX_PAGES);
  for (let i = 1; i <= n; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) pages.push({ page: i, text });
  }
  if (!pages.length) throw new Error("No text could be extracted from this PDF.");
  return pages;
}
