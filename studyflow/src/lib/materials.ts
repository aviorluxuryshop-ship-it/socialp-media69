import type { NoteRecord, UploadRecord } from "./types";

export const MAX_MATERIAL_CHARS = 6000;

export function noteText(n: NoteRecord): string {
  return `${n.title ? n.title + "\n" : ""}${n.body}`.trim();
}

export function uploadText(u: UploadRecord): string {
  return u.pages.map((p) => `[sayfa ${p.n}] ${p.text}`).join("\n").trim();
}

export function uploadUsable(u: UploadRecord): boolean {
  return u.extraction.status !== "none" && u.extraction.chars > 40;
}
