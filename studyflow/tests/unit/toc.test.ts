import { describe, expect, it } from "vitest";
// @ts-expect-error — düz JS betik modülü
import { assignRanges, buildUnits, findTocPages, tocEntries } from "../../scripts/lib/toc.mjs";

const toc = `
İÇİNDEKİLER
1. TEMA  SAYILAR VE İŞLEMLER ............ 8
1.1. Doğal sayılar ............ 10
1.1.1 Sayı kümeleri ............ 10
1.2. Tam sayılar ............ 16
1. Tema Ölçme ve Değerlendirme Soruları ... 24
2. TEMA  GEOMETRİ ............ 26
2.1. Üçgenler ............ 28
2.2. Dörtgenler ............ 36
SÖZLÜK ............ 60
`.split("\n");

describe("içindekiler çözümleyici", () => {
  it("satırlardan başlık-sayfa girdileri çıkarır", () => {
    const e = tocEntries(toc);
    expect(e[0]).toEqual({ text: "1. TEMA SAYILAR VE İŞLEMLER", page: 8 });
    expect(e.find((x: { text: string }) => /Üçgenler/.test(x.text))?.page).toBe(28);
  });
  it("ünite/konu/alt başlık hiyerarşisini kurar", () => {
    const { units, issues } = buildUnits(tocEntries(toc));
    expect(issues).toEqual([]);
    expect(units.map((u: { no: number }) => u.no)).toEqual([1, 2]);
    expect(units[0].topics.map((t: { no: string }) => t.no)).toEqual(["1.1", "1.2"]);
    expect(units[0].topics[0].sections[0].no).toBe("1.1.1");
    expect(units[0].evalPage).toBe(24);
  });
  it("sayfa aralıklarını hesaplar; aralıklar çakışmaz", () => {
    const { units } = buildUnits(tocEntries(toc));
    assignRanges(units, 59);
    const t = units[0].topics;
    expect([t[0].page, t[0].endPage]).toEqual([10, 15]);
    expect(t[1].endPage).toBe(23); // ölçme sayfasından önce biter
    expect(units[0].endPage).toBe(25); // ünite aralığı ölçme sayfalarını da kapsar; konu aralıkları kapsamaz
    expect(units[1].topics[1].endPage).toBeLessThanOrEqual(59);
  });
  it("sayfa numarası ayrı satıra düşen başlığı birleştirir", () => {
    const e = tocEntries(["1.3. Çok uzun bir başlık satırı", "devam eden kısım", "42"]);
    expect(e).toEqual([{ text: "1.3. Çok uzun bir başlık satırı devam eden kısım", page: 42 }]);
  });
  it("içindekiler sayfasını yalnızca yeterli sayfa numarası varsa bulur", () => {
    const filler = "Sıradan bir sayfa metni.\n".repeat(5);
    const tocPage = "İçindekiler\n" + Array.from({ length: 8 }, (_, i) => `${i + 1}.1. Başlık ${i} ......... ${10 + i}`).join("\n");
    expect(findTocPages([filler, tocPage, filler])).toEqual([1]);
    expect(findTocPages([filler, filler])).toEqual([]);
  });
});
