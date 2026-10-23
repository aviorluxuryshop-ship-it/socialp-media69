// Resmî MEB (tymm.meb.gov.tr) ders kitabı listesinden 9. ve 10. sınıf kitaplarını çeker.
// Çıktı: scripts/.cache/books.raw.json  (kayıt, kapak ve PDF adresleri HEAD ile doğrulanır)
// Kullanım: node scripts/fetch-textbooks.mjs
import { mkdir, writeFile } from "node:fs/promises";

const ORIGIN = "https://tymm.meb.gov.tr";
const KADEMELER = { ortaogretim: 3, "anadolu-imam-hatip-liseleri": 6 };
const SINIF = { 11: 9, 12: 10 }; // portal sinif id -> sınıf düzeyi

async function getJson(path, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(ORIGIN + path, { signal: AbortSignal.timeout(30000) });
      if (r.ok) return await r.json();
    } catch {}
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  throw new Error("alınamadı: " + path);
}
async function head(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(30000) });
      return {
        ok: r.ok,
        type: r.headers.get("content-type"),
        length: Number(r.headers.get("content-length") || 0),
        modified: r.headers.get("last-modified"),
      };
    } catch {}
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  return { ok: false };
}

/** Kitap sayfasından sürüm bilgisi: alt başlık ("9.Sınıf İngilizce Dersi (9-12)") ve güncelleme tarihi. */
async function readDetail(b) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(ORIGIN + b.detailPath, { signal: AbortSignal.timeout(30000) });
      if (!r.ok) continue;
      const html = await r.text();
      const text = html
        .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&#x27;/g, "'")
        .replace(/\s+/g, " ");
      const i0 = text.indexOf("Süreç");
      const seg = i0 >= 0 ? text.slice(i0 + 5, i0 + 400) : "";
      const upd = seg.match(/Güncelleme tarihi:\s*(\d{2})\.(\d{2})\.(\d{4})/);
      const after = seg.includes(b.title) ? seg.slice(seg.indexOf(b.title) + b.title.length) : seg;
      const sub = after.match(/^\s*\d+\.Sınıf\s+(.+?)\s+(?:Ortaöğretim|Anadolu İmam Hatip Liseleri)\s+Ders Kitapları/);
      return {
        updatedOn: upd ? `${upd[3]}-${upd[2]}-${upd[1]}` : null,
        programLabel: sub ? sub[1].trim() : null,
      };
    } catch {}
    await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
  }
  return { updatedOn: null, programLabel: null };
}

const books = new Map();
for (const [slug, kademeId] of Object.entries(KADEMELER)) {
  for (let page = 1; page < 20; page++) {
    const d = await getJson(`/Kitap/GetDersKitaplariList?kademe=${slug}&page=${page}`);
    for (const it of d.items) {
      const grades = it.sinifIds.map((s) => SINIF[s]).filter(Boolean);
      if (!grades.length) continue;
      books.set(it.id, { ...it, grades, kademeSlug: slug, kademeId });
    }
    if (!d.hasMore) break;
  }
}
// Ders adları
const dersAdi = new Map();
for (const kademeId of Object.values(KADEMELER)) {
  for (const sinifId of [11, 12]) {
    const list = await getJson(`/Ders/GetDerslerBySinif?sinifId=${sinifId}&kademe=${kademeId}`);
    for (const d of list) dersAdi.set(`${kademeId}:${d.id}`, { name: d.dersAdi, programPdf: d.pdf, url: d.url });
  }
}
const out = [];
for (const b of [...books.values()].sort((a, c) => a.id - c.id)) {
  const d = dersAdi.get(`${b.kademeId}:${b.dersId}`);
  const [pdf, cover] = await Promise.all([
    b.pdfUrl ? head(ORIGIN + b.pdfUrl) : { ok: false },
    b.imageUrl ? head(ORIGIN + b.imageUrl) : { ok: false },
  ]);
  const detail = await readDetail(b);
  out.push({ ...b, dersAdi: d?.name ?? null, programPdf: d?.programPdf ?? null, programSlug: d?.url ?? null, pdfCheck: pdf, coverCheck: cover, ...detail });
  process.stdout.write(`${b.id} ${b.title} pdf:${pdf.ok} cover:${cover.ok}\n`);
}
await mkdir("scripts/.cache", { recursive: true });
await writeFile("scripts/.cache/books.raw.json", JSON.stringify({ fetchedAt: new Date().toISOString(), books: out }, null, 1));
console.log("toplam", out.length);
