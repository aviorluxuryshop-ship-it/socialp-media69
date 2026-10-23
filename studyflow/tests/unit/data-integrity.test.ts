// Gerçek katalog ve video verisi üzerinde yapısal tutarlılık kontrolleri (ağ gerektirmez).
import { describe, expect, it } from "vitest";
import { BOOKS, pdfPageUrl, resolveTopic } from "@/lib/catalog";
import { SUBJECT_BY_ID } from "@/lib/catalog/data";
import { VIDEOS, lineage, videosForTopic } from "@/lib/videos";

describe("MEB ders kitabı kataloğu", () => {
  it("kitap kimlikleri benzersiz, kaynaklar resmî alan adında", () => {
    expect(new Set(BOOKS.map((b) => b.id)).size).toBe(BOOKS.length);
    for (const b of BOOKS) {
      expect(b.pdfUrl, b.title).toMatch(/^https:\/\/tymm\.meb\.gov\.tr\/assets\/pdf\/.+\.pdf$/);
      expect(b.detailUrl, b.title).toMatch(/^https:\/\/tymm\.meb\.gov\.tr\/kitap\/\d+\//);
      if (b.coverUrl) expect(b.coverUrl, b.title).toMatch(/^https:\/\/tymm\.meb\.gov\.tr\/assets\/img\//);
      expect([9, 10]).toContain(b.grade);
      expect(SUBJECT_BY_ID.has(b.subjectId), `${b.title}: bilinmeyen ders ${b.subjectId}`).toBe(true);
    }
  });
  it("kapak yalnızca doğrulanmışsa kullanılır; PDF doğrulaması işaretlidir", () => {
    for (const b of BOOKS) {
      if (b.coverVerified === false) expect(b.coverUrl ?? null, b.title).toBeNull();
      expect(b.pdfVerified, b.title).toBe(true);
      // Sayfa sayısı belirlenemeyen (0) çalışma kitaplarında arayüz "—" gösterir; içindekiler doğrulanmışsa mutlaka bilinir.
      expect(b.pageCount, b.title).toBeGreaterThanOrEqual(0);
      if (b.tocVerified) expect(b.pageCount, b.title).toBeGreaterThan(20);
    }
  });
  it("ünite/konu/alt başlık kimlikleri benzersiz ve sayfa aralıkları tutarlı", () => {
    const seen = new Set<string>();
    let topics = 0;
    for (const b of BOOKS) {
      for (const u of b.units) {
        expect(seen.has(u.id), u.id).toBe(false);
        seen.add(u.id);
        expect(u.endPage, u.id).toBeGreaterThanOrEqual(u.page);
        for (const t of u.topics) {
          topics++;
          expect(seen.has(t.id), t.id).toBe(false);
          seen.add(t.id);
          expect(t.endPage, t.id).toBeGreaterThanOrEqual(t.page);
          expect(t.page, `${t.id} ünite dışında`).toBeGreaterThanOrEqual(u.page);
          expect(t.endPage, `${t.id} ünite dışında`).toBeLessThanOrEqual(u.endPage);
          expect(t.endPage + (b.pageOffset ?? 0), `${t.id} kitap sayfa sayısını aşıyor`).toBeLessThanOrEqual(b.pageCount);
          for (const s of t.sections) {
            expect(seen.has(s.id), s.id).toBe(false);
            seen.add(s.id);
            expect(s.endPage, s.id).toBeGreaterThanOrEqual(s.page);
          }
        }
      }
    }
    expect(topics).toBeGreaterThan(100);
  });
  it("içindekiler doğrulanmış kitapların çoğunluğunda konu vardır; doğrulanmamışlar işaretlidir", () => {
    const verified = BOOKS.filter((b) => b.tocVerified);
    expect(verified.length).toBeGreaterThan(BOOKS.length / 2);
    for (const b of verified) expect(b.units.length, b.title).toBeGreaterThan(0);
    for (const b of BOOKS.filter((x) => !x.tocVerified)) expect(b.units.every((u) => u.topics.length === 0) || b.units.length === 0, b.title).toBe(true);
  });
  it("resolveTopic her kimliği geri çözer; sayfa bağlantısı PDF'e #page ile gider", () => {
    const b = BOOKS.find((x) => x.tocVerified && x.units[0]?.topics[0])!;
    const t = b.units[0].topics[0];
    const r = resolveTopic(t.id)!;
    expect(r.book.id).toBe(b.id);
    expect(r.pages).toEqual([t.page, t.endPage]);
    expect(pdfPageUrl(b, t.page)).toBe(`${b.pdfUrl}#page=${t.page + (b.pageOffset ?? 0)}`);
    // ofseti doğrulanmamış kitapta sayfa numarası uydurulmaz: yalnızca PDF bağlantısı verilir
    for (const x of BOOKS) expect(pdfPageUrl(x, 5)).toBe(x.pageOffset === null ? x.pdfUrl : `${x.pdfUrl}#page=${5 + x.pageOffset}`);
    expect(resolveTopic("b0-t9.9")).toBeNull();
    expect(resolveTopic(undefined)).toBeNull();
  });
});

describe("doğrulanmış video kataloğu", () => {
  it("kimlikler benzersiz ve YouTube biçiminde; künye eksiksiz", () => {
    expect(new Set(VIDEOS.map((v) => v.id)).size).toBe(VIDEOS.length);
    for (const v of VIDEOS) {
      expect(v.id, v.title).toMatch(/^[\w-]{11}$/);
      expect(v.title.length).toBeGreaterThan(5);
      expect(v.durationSec, v.id).toBeGreaterThan(30);
      expect(v.publishedAt, v.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(v.verifiedAt, v.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(v.channelId, v.id).toMatch(/^UC[\w-]{22}$/);
      expect(v.topicIds.length, v.id).toBeGreaterThan(0);
    }
  });
  it("her videonun konusu katalogda vardır ve dersi/sınıfı kitapla uyuşur", () => {
    for (const v of VIDEOS) {
      for (const tid of v.topicIds) {
        const r = resolveTopic(tid);
        expect(r, `${v.id} → ${tid}`).not.toBeNull();
        expect(r!.book.subjectId, `${v.id} ders`).toBe(v.subjectId);
        expect(r!.book.grade, `${v.id} sınıf`).toBe(v.grade);
      }
    }
  });
  it("stil etiketleri yalnızca bilinen değerlerdir; kanıtsız etiket atanmamıştır", () => {
    const known = new Set(["kisa", "ayrintili", "soru-cozumu", "gorsel", "eglenceli", "hikaye"]);
    for (const v of VIDEOS) {
      for (const s of v.styles) expect(known.has(s), `${v.id}: ${s}`).toBe(true);
      if (v.styles.includes("kisa")) expect(v.durationSec, v.id).toBeLessThanOrEqual(600);
    }
  });
  it("konu soy ağacı ünite ↔ konu eşleşmesini kapsar", () => {
    const v = VIDEOS[0];
    const L = lineage(v.topicIds[0]);
    expect(L.has(v.topicIds[0])).toBe(true);
    expect(videosForTopic(v.topicIds[0]).some((x) => x.id === v.id)).toBe(true);
  });
});
