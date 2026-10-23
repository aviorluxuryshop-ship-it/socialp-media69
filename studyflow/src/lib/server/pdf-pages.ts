// Resmî MEB ders kitabı PDF'inden yalnızca gereken sayfaların metnini okur (HTTP Range ile).
// Kitap metni depolanmaz veya yayımlanmaz; yalnızca sunucu belleğinde kısa süreli önbelleğe alınır
// ve öğrenciye atıfla, kısa özetlenmiş olarak yansır. URL yalnızca kataloğdan gelir (SSRF yok).
import { type CatalogBook } from "@/lib/catalog";

type PdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
let pdfjsP: Promise<PdfJs> | null = null;

async function pdfjs(): Promise<PdfJs> {
  pdfjsP ??= (async () => {
    // Sunucusuz ortamda iş parçacığı dosyası yolu çözmek yerine modülü doğrudan tanıt
    const worker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs" as string);
    (globalThis as unknown as { pdfjsWorker: unknown }).pdfjsWorker = worker;
    return import("pdfjs-dist/legacy/build/pdf.mjs");
  })();
  return pdfjsP;
}

type Doc = Awaited<ReturnType<PdfJs["getDocument"]>["promise"]>;
type Task = ReturnType<PdfJs["getDocument"]>;
const docs = new Map<number, { p: Promise<Doc>; task: { current: Task | null }; at: number }>();
const pageCache = new Map<string, { text: string; at: number }>();
const DOC_TTL = 20 * 60_000;
const PAGE_TTL = 6 * 60 * 60_000;
const MAX_DOCS = 5;
const MAX_PAGES = 600;

async function fetchRange(url: string, begin: number, end: number, signal?: AbortSignal): Promise<{ data: Uint8Array; total: number | null }> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { Range: `bytes=${begin}-${end - 1}` }, signal: AbortSignal.any([AbortSignal.timeout(10_000), ...(signal ? [signal] : [])]), cache: "no-store" });
      if (!(res.status === 206 || res.status === 200)) throw new Error(`pdf-range-${res.status}`);
      const total = Number(res.headers.get("content-range")?.split("/")[1]) || null;
      const buf = new Uint8Array(await res.arrayBuffer());
      return { data: res.status === 200 ? buf.subarray(begin, end) : buf, total };
    } catch (e) {
      last = e;
      if (signal?.aborted) break;
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }
  throw last;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("pdf-timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

async function openDoc(book: CatalogBook, signal?: AbortSignal): Promise<Doc> {
  const hit = docs.get(book.id);
  if (hit && Date.now() - hit.at < DOC_TTL) return hit.p;
  const lib = await pdfjs();
  const task: { current: Task | null } = { current: null };
  const p = (async () => {
    const first = await fetchRange(book.pdfUrl, 0, 65536, signal);
    const length = first.total ?? book.pdfBytes;
    if (!length) throw new Error("pdf-length");
    class RangeTransport extends lib.PDFDataRangeTransport {
      constructor() {
        super(length, first.data);
      }
      requestDataRange(begin: number, end: number) {
        fetchRange(book.pdfUrl, begin, Math.min(end, length), signal)
          .then((r) => this.onDataRange(begin, r.data))
          .catch(() => {
            /* sayfa okunamazsa getPage zaman aşımına uğrar; üst katman yakalar */
          });
      }
    }
    task.current = lib.getDocument({
      range: new RangeTransport(),
      disableAutoFetch: true,
      disableStream: true,
      useSystemFonts: false,
      verbosity: 0,
    });
    return task.current.promise;
  })();
  docs.set(book.id, { p, task, at: Date.now() });
  p.catch(() => docs.delete(book.id));
  if (docs.size > MAX_DOCS) {
    const oldest = [...docs.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) {
      docs.delete(oldest[0]);
      void oldest[1].task.current?.destroy().catch(() => {});
    }
  }
  return p;
}

/** Sayfa metnini okunur hâle getirir: satır sonları, tek başına sayfa numaraları ve koşan başlıklar atılır. */
export function cleanPageText(raw: string): string {
  const lines = raw
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l && !/^\d{1,3}$/.test(l) && !/^\d+\.\s*(tema|ünite)\s*\/\s*.{0,60}$/i.test(l));
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

/** Basılı sayfa numarasından (offset ile) fiziksel sayfa metnini döndürür; hata olursa null. */
export async function getPrintedPageText(book: CatalogBook, printedPage: number, signal?: AbortSignal): Promise<string | null> {
  if (book.pageOffset === null) return null;
  const phys = printedPage + book.pageOffset;
  if (phys < 1 || phys > Math.min(book.pageCount || MAX_PAGES, MAX_PAGES)) return null;
  const key = `${book.id}:${phys}`;
  const hit = pageCache.get(key);
  if (hit && Date.now() - hit.at < PAGE_TTL) return hit.text;
  try {
    const raw = await withTimeout(
      (async () => {
        const doc = await openDoc(book, signal);
        const page = await doc.getPage(phys);
        const tc = await page.getTextContent();
        return tc.items.map((i) => ("str" in i ? i.str + (i.hasEOL ? "\n" : "") : "")).join("");
      })(),
      25_000,
    );
    const text = cleanPageText(raw);
    pageCache.set(key, { text, at: Date.now() });
    if (pageCache.size > 1500) {
      const oldest = [...pageCache.entries()].sort((a, b) => a[1].at - b[1].at).slice(0, 300);
      for (const [k] of oldest) pageCache.delete(k);
    }
    return text;
  } catch {
    docs.delete(book.id);
    return null;
  }
}

export function _clearCaches() {
  docs.clear();
  pageCache.clear();
}
