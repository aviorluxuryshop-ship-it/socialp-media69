// Yükleme doğrulaması: uzantıya değil, dosyanın gerçek imzasına bakar.
export const LIMITS = { pdf: 25 * 1024 * 1024, image: 10 * 1024 * 1024 };

export type FileKind = "pdf" | "image";

export interface Validation {
  ok: boolean;
  kind?: FileKind;
  mime?: string;
  error?: string;
}

export function sniff(head: Uint8Array): { kind: FileKind; mime: string } | null {
  const s = (a: number[], off = 0) => a.every((b, i) => head[off + i] === b);
  if (s([0x25, 0x50, 0x44, 0x46, 0x2d])) return { kind: "pdf", mime: "application/pdf" };
  if (s([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { kind: "image", mime: "image/png" };
  if (s([0xff, 0xd8, 0xff])) return { kind: "image", mime: "image/jpeg" };
  if (s([0x52, 0x49, 0x46, 0x46]) && s([0x57, 0x45, 0x42, 0x50], 8)) return { kind: "image", mime: "image/webp" };
  return null;
}

export async function validateFile(file: File): Promise<Validation> {
  if (file.size === 0) return { ok: false, error: "Dosya boş görünüyor." };
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const t = sniff(head);
  if (!t) return { ok: false, error: "Bu dosya türü desteklenmiyor. PDF, PNG, JPEG veya WebP yükleyebilirsin." };
  const limit = t.kind === "pdf" ? LIMITS.pdf : LIMITS.image;
  if (file.size > limit) return { ok: false, error: `Dosya çok büyük (en fazla ${Math.round(limit / 1024 / 1024)} MB).` };
  return { ok: true, kind: t.kind, mime: t.mime };
}

export function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
