import { describe, expect, it } from "vitest";
import { BOOKS, resolveTopic } from "@/lib/catalog";
import { bm25Rank, chunkText, matchTopic } from "@/lib/server/retrieve";

describe("chunkText", () => {
  it("uzun metni parçalar ve çok kısa artığı atar", () => {
    const text = Array.from({ length: 30 }, (_, i) => `Bu, ${i}. satırdır ve fotosentez hakkında bilgi içerir.`).join("\n");
    const chunks = chunkText(12, text, 300);
    expect(chunks.length).toBeGreaterThan(3);
    expect(chunks.every((c) => c.page === 12 && c.text.length > 40)).toBe(true);
    expect(chunkText(1, "kısa")).toEqual([]);
  });
});

describe("bm25Rank", () => {
  const chunks = [
    { page: 1, text: "Hücre zarı seçici geçirgendir ve madde alışverişini düzenler." },
    { page: 2, text: "Newton'un ikinci yasasına göre kuvvet kütle ile ivmenin çarpımına eşittir." },
    { page: 3, text: "Osmanlı Devleti'nin kuruluş dönemi beylikler arası ilişkiler içerir." },
  ];
  it("sorguya en uygun parçayı başa koyar (Türkçe ekler törpülenir)", () => {
    expect(bm25Rank(chunks, "kuvvetin ivmeyle çarpımı nedir")[0].chunk.page).toBe(2);
    expect(bm25Rank(chunks, "hücre zarının geçirgenliği")[0].chunk.page).toBe(1);
  });
  it("eşleşme yoksa sıfır puan döner", () => {
    expect(bm25Rank(chunks, "zzzz qqqq").every((r) => r.score === 0)).toBe(true);
  });
});

describe("matchTopic (gerçek katalogla)", () => {
  const book = BOOKS.find((b) => b.tocVerified && b.units.some((u) => u.topics.length >= 3))!;
  const topic = book.units.flatMap((u) => u.topics).find((t) => t.title.split(" ").length >= 2)!;
  it("konu başlığını kendi kitabında bulur", () => {
    const r = matchTopic(topic.title, [book.id]);
    expect(r).not.toBeNull();
    expect(resolveTopic(r!.topic?.id ?? r!.unit.id)?.book.id).toBe(book.id);
  });
  it("ilgisiz bir soruda uydurma konu döndürmez", () => {
    expect(matchTopic("xyzzy qwerty plugh", [book.id])).toBeNull();
    expect(matchTopic("", [book.id])).toBeNull();
  });
});
