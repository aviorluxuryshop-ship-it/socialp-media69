import { BOOKS } from "@/lib/catalog";
import { checkLimit } from "@/lib/server/ratelimit";
import { jsonError } from "@/lib/server/http";
import { retrieve } from "@/lib/server/retrieve";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Sağlık denetimi: sunucunun resmî MEB PDF'lerine ulaşıp sayfa metni çıkarabildiğini doğrular.
 * Anahtar gerektirmez; kitap metnini DÖNDÜRMEZ, yalnızca sayaçlar ve süre verir. IP başına sınırlıdır.
 */
export async function GET(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  const lim = checkLimit(`probe:${ip}`, { perMinute: 4, perDay: 60 });
  if (!lim.ok) return jsonError(429, "rate_limited", "Çok sık denendi.", { retryAfterSec: lim.retryAfterSec });
  const book = BOOKS.find((b) => b.subjectId === "matematik" && b.grade === 9 && b.tocVerified && b.pageOffset !== null);
  const topic = book?.units[0]?.topics[0];
  if (!book || !topic) return jsonError(500, "no_catalog", "Katalog boş görünüyor.");
  const t0 = Date.now();
  const r = await retrieve({ bookIds: [book.id], topicId: topic.id, query: topic.title, budgetChars: 3000, maxPages: 3, signal: req.signal });
  return Response.json(
    { ok: r.grounded, passages: r.passages.length, chars: r.passages.reduce((n, p) => n + p.text.length, 0), pages: r.passages.map((p) => p.page), book: book.id, ms: Date.now() - t0, note: r.note },
    { status: r.grounded ? 200 : 502, headers: { "Cache-Control": "no-store" } },
  );
}
