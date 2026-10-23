// Resmî MEB ders kitabı kaydı (src/data/catalog.json) üzerinde yardımcılar.
// Kayıt scripts/build-catalog.mjs ile resmî portal ve kitap PDF'lerinden üretilir; uydurma alan yoktur.
import raw from "@/data/catalog.json";
import type { Grade, SchoolTypeId, SourceRef } from "@/lib/types";
import { SCHOOL_BY_ID, SUBJECT_BY_ID } from "./data";

export interface CatalogSection {
  id: string;
  no: string;
  title: string;
  page: number;
  endPage: number;
}
export interface CatalogTopic {
  id: string;
  no: string;
  title: string;
  page: number;
  endPage: number;
  sections: CatalogSection[];
}
export interface CatalogUnit {
  id: string;
  no: number;
  kind: "tema" | "unite";
  title: string;
  page: number;
  endPage: number;
  topics: CatalogTopic[];
}
export interface CatalogBook {
  id: number;
  title: string;
  subjectId: string;
  grade: Grade;
  kind: "ders" | "calisma";
  volume: string | null;
  programLabel: string | null;
  kademe: "ortaogretim" | "aihl";
  publisher: string;
  updatedOn: string | null;
  fileStamp: string | null;
  detailUrl: string;
  pdfUrl: string;
  coverUrl: string;
  pdfVerified: boolean;
  coverVerified: boolean;
  pdfBytes: number;
  pageCount: number;
  /** fiziksel PDF sayfası = basılı sayfa + pageOffset */
  pageOffset: number | null;
  tocVerified: boolean;
  units: CatalogUnit[];
}

export const CATALOG = raw as unknown as { source: string; generatedAt: string; books: CatalogBook[] };
export const BOOKS: CatalogBook[] = CATALOG.books;
const BOOK_BY_ID = new Map(BOOKS.map((b) => [b.id, b]));
export const getBook = (id: number) => BOOK_BY_ID.get(id);

export type TopicKind = "unit" | "topic" | "section";
export interface ResolvedTopic {
  id: string;
  kind: TopicKind;
  book: CatalogBook;
  unit: CatalogUnit;
  topic: CatalogTopic | null;
  section: CatalogSection | null;
  title: string;
  /** basılı sayfa aralığı */
  pages: [number, number];
}

let index: Map<string, ResolvedTopic> | null = null;
function buildIndex() {
  const m = new Map<string, ResolvedTopic>();
  for (const book of BOOKS) {
    for (const unit of book.units) {
      m.set(unit.id, { id: unit.id, kind: "unit", book, unit, topic: null, section: null, title: unit.title, pages: [unit.page, unit.endPage] });
      for (const topic of unit.topics) {
        m.set(topic.id, { id: topic.id, kind: "topic", book, unit, topic, section: null, title: topic.title, pages: [topic.page, topic.endPage] });
        for (const section of topic.sections) {
          m.set(section.id, { id: section.id, kind: "section", book, unit, topic, section, title: section.title, pages: [section.page, section.endPage] });
        }
      }
    }
  }
  return m;
}
export function resolveTopic(id: string | null | undefined): ResolvedTopic | null {
  if (!id) return null;
  index ??= buildIndex();
  return index.get(id) ?? null;
}

/** "Matematik 9 · 1.1 Gerçek sayıların…" */
export function topicLabel(id: string | null | undefined): string {
  const r = resolveTopic(id);
  if (!r) return "";
  const prefix = r.topic ? `${r.topic.no} ` : r.unit.kind === "tema" || r.unit.kind === "unite" ? `${r.unit.no}. ` : "";
  return `${prefix}${r.title}`;
}

/** Bir konuya ait kitap alt başlıklarının tümü (konu seçici için düz liste) */
export function bookTopicOptions(bookId: number) {
  const book = getBook(bookId);
  if (!book) return [];
  const out: { id: string; label: string; unit: string; depth: 0 | 1 | 2; pages: [number, number] }[] = [];
  for (const u of book.units) {
    out.push({ id: u.id, label: `${u.no}. ${u.title}`, unit: u.title, depth: 0, pages: [u.page, u.endPage] });
    for (const t of u.topics) {
      out.push({ id: t.id, label: `${t.no} ${t.title}`, unit: u.title, depth: 1, pages: [t.page, t.endPage] });
      for (const s of t.sections) out.push({ id: s.id, label: `${s.no} ${s.title}`, unit: u.title, depth: 2, pages: [s.page, s.endPage] });
    }
  }
  return out;
}

export interface BookFilter {
  grade: Grade;
  schoolType: SchoolTypeId;
}
/** Öğrencinin sınıfı ve okul türüne göre gösterilecek resmî kitaplar. */
export function booksFor({ grade, schoolType }: BookFilter): CatalogBook[] {
  const kademe = SCHOOL_BY_ID.get(schoolType)?.kademe ?? ["ortaogretim"];
  const list = BOOKS.filter((b) => b.grade === grade && kademe.includes(b.kademe));
  // AİHL öğrencisi için AİHL meslek dersleri ve ortaöğretim ortak dersleri; aynı ders adı iki listede
  // yer alıyorsa (Arapça, Kur'an-ı Kerim) okul türüne uygun olan öne çıkar.
  const preferAihl = schoolType === "aihl";
  return list.filter((b) => {
    if (b.kademe === "aihl" || !["arapca", "kuran"].includes(b.subjectId)) return true;
    return !preferAihl; // ortaöğretim Arapça/Kur'an kitabı AİHL'de gösterilmez
  });
}

export function subjectsOfBooks(books: CatalogBook[]) {
  const ids = [...new Set(books.map((b) => b.subjectId))];
  return ids.filter((id) => SUBJECT_BY_ID.has(id));
}

export function bookLabel(b: CatalogBook): string {
  const bits = [b.title.replace(/\s+/g, " ")];
  return bits.join(" ");
}

/** Baskı/sürüm ayırt edici etiketi: "Güncelleme 06.10.2026 · MEB Yayınları" */
export function editionLabel(b: CatalogBook): string {
  const d = b.updatedOn ?? b.fileStamp;
  const date = d ? d.split("-").reverse().join(".") : null;
  const prog = b.programLabel ? `${b.programLabel} · ` : "";
  return `${prog}MEB Yayınları${date ? ` · ${b.updatedOn ? "Güncelleme" : "Dosya"} ${date}` : ""}`;
}

/** Resmî PDF'te basılı sayfaya doğrudan bağlantı (ofset doğrulanmamışsa sayfa belirtilmez). */
export function pdfPageUrl(book: CatalogBook, printedPage: number): string {
  if (book.pageOffset === null) return book.pdfUrl;
  return `${book.pdfUrl}#page=${printedPage + book.pageOffset}`;
}

export function sourceRefFor(topicId: string): SourceRef | null {
  const r = resolveTopic(topicId);
  if (!r) return null;
  return {
    type: "textbook",
    label: `${r.book.title} · ${topicLabel(topicId)}`,
    bookId: r.book.id,
    topicId,
    pages: r.pages,
    url: pdfPageUrl(r.book, r.pages[0]),
  };
}

export function coverFor(b: CatalogBook): string | null {
  return b.coverVerified ? b.coverUrl : null;
}

/** Türkçe duyarlı basit konu arama */
export function searchTopics(query: string, bookIds: number[], limit = 12) {
  const q = query.toLocaleLowerCase("tr-TR").trim();
  if (!q) return [];
  const words = q.split(/\s+/).filter(Boolean);
  const res: { id: string; label: string; bookId: number; score: number }[] = [];
  for (const id of bookIds) {
    for (const o of bookTopicOptions(id)) {
      const hay = o.label.toLocaleLowerCase("tr-TR");
      if (words.every((w) => hay.includes(w))) {
        res.push({ id: o.id, label: o.label, bookId: id, score: hay.startsWith(q) ? 2 : 1 - o.depth * 0.1 });
      }
    }
  }
  return res.sort((a, b) => b.score - a.score).slice(0, limit);
}
