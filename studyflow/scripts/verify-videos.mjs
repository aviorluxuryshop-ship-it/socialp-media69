// Seçilmiş videoları YouTube oEmbed ile yeniden doğrular (gömülebilir mi, başlık/kanal künyeyle uyuşuyor mu),
// küçük resmi kontrol eder ve src/data/videos.json üretir. Başarısız video kataloğa girmez.
//   scripts/videos.curated.json : { videos: [{ id, topicIds[] }] }   (editoryal seçim)
//   scripts/video-meta.json     : süre, yayın tarihi, kanal (vidIQ/YouTube meta verisi)
// Kullanım: node scripts/verify-videos.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { oembed, pool } from "./lib/youtube.mjs";

const curated = JSON.parse(readFileSync("scripts/videos.curated.json", "utf8")).videos;
const metaFile = JSON.parse(readFileSync("scripts/video-meta.json", "utf8"));
const catalog = JSON.parse(readFileSync("src/data/catalog.json", "utf8"));

// konu kimlikleri kataloğda gerçekten var mı?
const known = new Set();
const bookOf = new Map();
for (const b of catalog.books) for (const u of b.units) {
  known.add(u.id); bookOf.set(u.id, b);
  for (const t of u.topics) { known.add(t.id); bookOf.set(t.id, b); for (const s of t.sections) { known.add(s.id); bookOf.set(s.id, b); } }
}

const fold = (s) => s.toLocaleLowerCase("tr-TR").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Stil etiketleri yalnızca doğrulanmış süre/başlık/açıklamadan çıkarılır; kanıt yoksa etiket verilmez. */
export function stylesOf(v) {
  const text = `${v.title} ${v.description ?? ""}`.toLocaleLowerCase("tr-TR");
  const out = [];
  if (v.durationSec <= 600) out.push("kisa");
  if (v.durationSec >= 1800) out.push("ayrintili");
  if (/soru çöz|çözümlü|açık uçlu soru|yazılı soru/.test(text)) out.push("soru-cozumu");
  if (/simülasyon|animasyon|kavram haritası|harita ile|infografik/.test(text)) out.push("gorsel");
  if (/eğlenceli|komik|şakalı/.test(text)) out.push("eglenceli");
  if (/hikâye anlat|hikaye anlat|masal gibi|hikâyeleştir|hikayeleştir/.test(text)) out.push("hikaye");
  return out;
}

const problems = [];
const results = await pool(curated, 4, async (c) => {
  const m = metaFile.videos[c.id];
  if (!m) return problems.push(`${c.id}: künye yok`), null;
  for (const t of c.topicIds) if (!known.has(t)) return problems.push(`${c.id}: konu yok ${t}`), null;
  const o = await oembed(c.id);
  if (!o.ok) return problems.push(`${c.id}: oEmbed başarısız (${o.status}) — gömülemez veya kaldırılmış`), null;
  if (fold(o.title).slice(0, 18) !== fold(m.title).slice(0, 18)) return problems.push(`${c.id}: başlık künyeyle uyuşmuyor ("${o.title}")`), null;
  const th = await fetch(`https://i.ytimg.com/vi/${c.id}/hqdefault.jpg`, { method: "HEAD" }).then((r) => r.ok).catch(() => false);
  if (!th) return problems.push(`${c.id}: küçük resim yok`), null;
  const book = bookOf.get(c.topicIds[0]);
  return {
    id: c.id,
    title: o.title,
    channel: o.author || m.channelTitle,
    channelId: m.channelId,
    durationSec: m.durationSec,
    publishedAt: m.publishedAt,
    subjectId: book.subjectId,
    grade: book.grade,
    topicIds: c.topicIds,
    styles: stylesOf(m),
    verifiedAt: new Date().toISOString().slice(0, 10),
  };
});
const videos = results.filter(Boolean);
writeFileSync("src/data/videos.json", JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), source: "YouTube oEmbed + vidIQ künyesi", videos }, null, 1));
console.log(`${videos.length}/${curated.length} video doğrulandı.`);
if (problems.length) console.log("Elenenler:\n" + problems.join("\n"));
