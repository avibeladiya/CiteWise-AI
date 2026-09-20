import type { Chunk } from "./types";

const TARGET_WORDS = 180;
const OVERLAP_WORDS = 30;

export interface PageText {
  page: number;
  text: string;
}

export function chunkPages(pages: PageText[]): Chunk[] {
  const step = Math.max(1, TARGET_WORDS - OVERLAP_WORDS);
  const chunks: Chunk[] = [];
  let idx = 0;

  for (const page of pages) {
    const words = page.text.split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    for (let i = 0; i < words.length; i += step) {
      const window = words.slice(i, i + TARGET_WORDS);
      if (!window.length) break;
      const text = window.join(" ");
      chunks.push({
        chunk_index: idx,
        page_number: page.page,
        text,
        char_start: 0,
        char_end: text.length,
      });
      idx += 1;
      if (i + TARGET_WORDS >= words.length) break;
    }
  }
  return chunks;
}
