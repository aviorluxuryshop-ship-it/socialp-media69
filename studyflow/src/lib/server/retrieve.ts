// Kaynak getirme: konu eşleme + sayfa seçimi + BM25 ile en ilgili parçalar.
import { type CatalogBook, getBook, pdfPageUrl, resolveTopic, type ResolvedTopic, bookTopicOptions } from "@/lib/catalog";
import { tokens } from "@/lib/text";
import type { SourceRef } from "@/lib/types";
import { getPrintedPageText } from "./pdf-pages";

export interface Passage {
  id: string; // K1, K2…
  bookId: number;
  page: number; // basılı sayfa
  text: string;
}
export interface Retrieval {
  passages: Passage[];
  refs: Record<string, SourceRef>;
  topic: ResolvedTopic | null;
  /** Kullanıcıya gösterilecek durum notu */
  note: string | null;
  /** Gerçekten kitaptan metin alınabildi mi */
  grounded: boolean;
}

// --- BM25 ---------------------------------------------------------------

export interface Chunk {
  page: number;
  text: string;
}

export function chunkText(page: number, text: string, target = 650): Chunk[] {
  const out: Chunk[] = [];
  let cur = "";
  for (const line of text.split("\n")) {
    if (cur && cur.length + line.length > target) {
      out.push({ page, text: cur.trim() });
      cur = "";
    }
    cur += (cur ? " " : "") + line;
  }
  if (cur.trim().length > 40) out.push({ page, text: cur.trim() });
  return out;
}

export function bm25Rank(chunks: Chunk[], query: string, k1 = 1.5, b = 0.75): { chunk: Chunk; score: number }[] {
  const q = [...new Set(tokens(query))];
  if (!q.length || !chunks.length) return chunks.map((chunk) => ({ chunk, score: 0 }));
  const docs = chunks.map((c) => tokens(c.text));
  const avg = docs.reduce((n, d) => n + d.length, 0) / docs.length || 1;
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  return chunks
    .map((chunk, i) => {
      const d = docs[i];
      const tf = new Map<string, number>();
      for (const t of d) tf.set(t, (tf.get(t) ?? 0) + 1);
      let score = 0;
      for (const t of q) {
        const f = tf.get(t) ?? 0;
        if (!f) continue;
        const idf = Math.log(1 + (docs.length - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));
        score += (idf * f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.length) / avg));
      }
      return { chunk, score };
    })
    .sort((x, y) => y.score - x.score);
}

// --- Konu eşleme -------------------------------------------------------------

/** Soru metnini, seçili kitapların konu başlıklarıyla eşleştirir (IDF ağırlıklı kelime örtüşmesi). */
export function matchTopic(query: string, bookIds: number[]): ResolvedTopic | null {
  const q = [...new Set(tokens(query))];
  if (!q.length) return null;
  const entries: { id: string; toks: Set<string> }[] = [];
  for (const bid of bookIds) {
    for (const o of bookTopicOptions(bid)) {
      const r = resolveTopic(o.id);
      entries.push({ id: o.id, toks: new Set(tokens(`${o.label} ${r?.unit.title ?? ""}`)) });
    }
  }
  if (!entries.length) return null;
  const df = new Map<string, number>();
  for (const e of entries) for (const t of e.toks) df.set(t, (df.get(t) ?? 0) + 1);
  let best: { id: string; score: number } | null = null;
  for (const e of entries) {
    let score = 0;
    for (const t of q) if (e.toks.has(t)) score += Math.log(1 + entries.length / (df.get(t) ?? 1));
    if (score > 0 && (!best || score > best.score)) best = { id: e.id, score };
  }
  const MIN = Math.log(1 + entries.length / 3) * 1.4; // en az ~1-2 ayırt edici kelime
  return best && best.score >= MIN ? resolveTopic(best.id) : null;
}

// --- Getirme -----------------------------------------------------------------

function pickPages(range: [number, number], maxPages: number): number[] {
  const [a, b] = range;
  const n = b - a + 1;
  if (n <= maxPages) return Array.from({ length: n }, (_, i) => a + i);
  // Uzun aralık: baştan 3 sayfa + geri kalanı eşit aralıklı
  const out = new Set<number>([a, a + 1, a + 2]);
  const rest = maxPages - out.size;
  for (let i = 1; i <= rest; i++) out.add(a + 3 + Math.floor(((n - 3) * i) / (rest + 1)));
  return [...out].sort((x, y) => x - y);
}

async function pool<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const res: R[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        res[idx] = await fn(items[idx]);
      }
    }),
  );
  return res;
}

export async function retrieve(opts: {
  bookIds: number[];
  topicId?: string | null;
  query?: string;
  /** Prompt'a girecek en fazla karakter */
  budgetChars: number;
  maxPages?: number;
  signal?: AbortSignal;
}): Promise<Retrieval> {
  const books = opts.bookIds.map(getBook).filter((b): b is CatalogBook => Boolean(b));
  const query = opts.query ?? "";
  let topic = resolveTopic(opts.topicId ?? null);
  if (!topic && query && books.length) topic = matchTopic(query, books.map((b) => b.id));
  if (!topic) {
    return {
      passages: [],
      refs: {},
      topic: null,
      grounded: false,
      note: books.length ? "Sorunla eşleşen bir kitap bölümü bulamadım; genel müfredat bilgisiyle anlatıyorum." : "Bir ders kitabı seçilmediği için genel müfredat bilgisiyle anlatıyorum.",
    };
  }
  const book = topic.book;
  if (book.pageOffset === null) {
    return { passages: [], refs: {}, topic, grounded: false, note: "Bu kitabın sayfa eşlemesi doğrulanmadığı için kitap metnine ulaşılamadı; genel bilgiyle anlatıyorum." };
  }
  // Konu bölümlere ayrılıyorsa ve soru bir bölümle eşleşiyorsa aralığı daralt
  let range: [number, number] = topic.pages;
  if (topic.kind === "topic" && topic.topic && topic.topic.sections.length && query) {
    const sec = matchTopic(query, [book.id]);
    if (sec?.section && sec.topic?.id === topic.topic.id) range = sec.pages;
  }
  const pages = pickPages(range, opts.maxPages ?? 8);
  const texts = await pool(pages, 6, async (p) => ({ p, t: await getPrintedPageText(book, p, opts.signal) }));
  const ok = texts.filter((x): x is { p: number; t: string } => Boolean(x.t && x.t.length > 60));
  if (!ok.length) {
    return { passages: [], refs: {}, topic, grounded: false, note: "Kitap sayfalarına şu an ulaşılamadı; genel bilgiyle anlatıyorum. Bir süre sonra tekrar deneyebilirsin." };
  }
  const chunks = ok.flatMap((x) => chunkText(x.p, x.t));
  const ranked = query ? bm25Rank(chunks, query) : chunks.map((chunk, i) => ({ chunk, score: chunks.length - i }));
  const picked: Chunk[] = [];
  let used = 0;
  for (const { chunk, score } of ranked) {
    if (query && score <= 0 && picked.length >= 2) break;
    if (used + chunk.text.length > opts.budgetChars) continue;
    picked.push(chunk);
    used += chunk.text.length;
  }
  const byPage = new Map<number, string[]>();
  for (const c of picked.sort((a, b) => a.page - b.page)) byPage.set(c.page, [...(byPage.get(c.page) ?? []), c.text]);
  const passages: Passage[] = [];
  const refs: Record<string, SourceRef> = {};
  let n = 0;
  for (const [page, parts] of byPage) {
    const id = `K${++n}`;
    passages.push({ id, bookId: book.id, page, text: parts.join("\n") });
    refs[id] = {
      type: "textbook",
      label: `${book.title.replace(/\.Sınıf/, ". sınıf")}, s. ${page}`,
      bookId: book.id,
      topicId: topic.id,
      pages: [page, page],
      url: pdfPageUrl(book, page),
    };
  }
  return { passages, refs, topic, grounded: passages.length > 0, note: null };
}
