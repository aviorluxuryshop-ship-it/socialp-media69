import { NextResponse } from "next/server";

export function jsonError(status: number, error: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, message, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function readJson<T>(req: Request, maxBytes: number): Promise<{ ok: true; data: T } | { ok: false; res: Response }> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes) return { ok: false, res: jsonError(413, "too_large", "Gönderilen içerik çok büyük. Daha küçük bir bölüm seç.") };
  let text: string;
  try {
    text = await req.text();
  } catch {
    return { ok: false, res: jsonError(400, "bad_request", "İstek okunamadı.") };
  }
  if (text.length > maxBytes) return { ok: false, res: jsonError(413, "too_large", "Gönderilen içerik çok büyük. Daha küçük bir bölüm seç.") };
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, res: jsonError(400, "bad_request", "İstek biçimi geçersiz.") };
  }
}
