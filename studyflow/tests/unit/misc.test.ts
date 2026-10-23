import { beforeEach, describe, expect, it } from "vitest";
import { INTERVALS, nextReview } from "@/lib/cards";
import { sniff, validateFile } from "@/lib/files";
import { plainSnippet, prefixLines, wordCount, wrapSelection } from "@/lib/mdedit";
import { _resetLimits, checkLimit } from "@/lib/server/ratelimit";
import { fold, sentenceCase, tokens, truncate } from "@/lib/text";

describe("Leitner kartları", () => {
  const DAY = 86_400_000;
  it("bildikçe üst kutuya geçer ve aralık uzar", () => {
    const r = nextReview({ box: 1, lapses: 0, reps: 0 }, true, 0);
    expect(r.box).toBe(2);
    expect(r.due).toBe(INTERVALS[2] * DAY);
  });
  it("kutu 5'te kalır", () => {
    expect(nextReview({ box: 5, lapses: 0, reps: 9 }, true, 0).box).toBe(5);
  });
  it("bilmeyince kutu 1'e döner ve 10 dakika sonra yeniden gelir", () => {
    const r = nextReview({ box: 4, lapses: 1, reps: 5 }, false, 1000);
    expect(r).toMatchObject({ box: 1, due: 1000 + 600_000, lapses: 2, reps: 6 });
  });
});

describe("Markdown düzenleme", () => {
  it("seçimi sarar ve ikinci kez çağrılınca kaldırır", () => {
    const a = wrapSelection("merhaba dünya", 0, 7, "**");
    expect(a.value).toBe("**merhaba** dünya");
    const b = wrapSelection(a.value, a.start, a.end, "**");
    expect(b.value).toBe("merhaba dünya");
  });
  it("seçim yoksa yer tutucu ekler", () => {
    expect(wrapSelection("", 0, 0, "$", "$", "x^2").value).toBe("$x^2$");
  });
  it("satır öneklerini ekler/kaldırır ve numaralandırır", () => {
    expect(prefixLines("a\nb", 0, 3, "- ").value).toBe("- a\n- b");
    expect(prefixLines("- a\n- b", 0, 7, "- ").value).toBe("a\nb");
    expect(prefixLines("a\nb", 0, 3, "", true).value).toBe("1. a\n2. b");
  });
  it("özet ve kelime sayısı", () => {
    expect(plainSnippet("# Başlık\n\n**kalın** metin", 100)).toBe("Başlık kalın metin");
    expect(plainSnippet("x".repeat(300), 50).length).toBe(50);
    expect(wordCount("  bir iki   üç ")).toBe(3);
    expect(wordCount("")).toBe(0);
  });
});

describe("dosya doğrulama (gerçek imzaya göre)", () => {
  const file = (bytes: number[], name: string, pad = 0) => new File([new Uint8Array([...bytes, ...Array(pad).fill(0)])], name);
  it("PDF, PNG, JPEG, WebP imzalarını tanır", () => {
    expect(sniff(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]))?.kind).toBe("pdf");
    expect(sniff(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mime).toBe("image/png");
    expect(sniff(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.mime).toBe("image/jpeg");
    expect(sniff(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))?.mime).toBe("image/webp");
  });
  it("uzantı yalan söylüyorsa reddeder", async () => {
    const exe = file([0x4d, 0x5a, 0x90, 0x00], "odev.pdf", 100); // MZ (exe) .pdf adıyla
    const r = await validateFile(exe);
    expect(r.ok).toBe(false);
  });
  it("boş dosyayı ve çok büyük görseli reddeder, geçerli PDF'i kabul eder", async () => {
    expect((await validateFile(new File([], "a.pdf"))).ok).toBe(false);
    const big = file([0xff, 0xd8, 0xff, 0xe0], "foto.jpg", 11 * 1024 * 1024);
    expect((await validateFile(big)).ok).toBe(false);
    const ok = await validateFile(file([0x25, 0x50, 0x44, 0x46, 0x2d], "ders.pdf", 2000));
    expect(ok).toMatchObject({ ok: true, kind: "pdf" });
  });
});

describe("hız sınırlayıcı", () => {
  beforeEach(() => _resetLimits());
  it("dakikalık sınırı uygular ve süre dolunca açar", () => {
    const o = { perMinute: 2, perDay: 100 };
    expect(checkLimit("u", { ...o, now: 0 }).ok).toBe(true);
    expect(checkLimit("u", { ...o, now: 1000 }).ok).toBe(true);
    const r = checkLimit("u", { ...o, now: 2000 });
    expect(r).toMatchObject({ ok: false, reason: "burst" });
    expect(checkLimit("u", { ...o, now: 61_500 }).ok).toBe(true);
  });
  it("günlük sınırı uygular ve kullanıcıları ayırır", () => {
    const o = { perMinute: 100, perDay: 2 };
    checkLimit("a", { ...o, now: 0 });
    checkLimit("a", { ...o, now: 1 });
    expect(checkLimit("a", { ...o, now: 2 })).toMatchObject({ ok: false, reason: "daily" });
    expect(checkLimit("b", { ...o, now: 2 }).ok).toBe(true);
  });
});

describe("metin yardımcıları", () => {
  it("Türkçe katlama ve belirteçler", () => {
    expect(fold("ÇIĞIR Şöyle İşte")).toBe("cigir soyle iste");
    expect(tokens("Fotosentezin evreleri nelerdir")).toContain("fotose");
    expect(tokens("ve bir bu")).toEqual([]);
  });
  it("cümle büyük harfi ve kısaltma", () => {
    expect(sentenceCase("İSTANBUL'UN FETHİ")).toMatch(/^İstanbul/);
    expect(truncate("abcdefghij", 5)).toBe("abcd…");
  });
});
