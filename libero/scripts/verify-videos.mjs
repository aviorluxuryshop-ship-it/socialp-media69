// Libero — video doğrulama
//
// data/videos/curated.json içindeki her YouTube kimliğini YouTube'un herkese açık
// oEmbed uç noktasıyla (anahtar gerekmez) ve izleme sayfasındaki oynatıcı bilgisiyle
// doğrular; sonucu data/videos/verified.json dosyasına yazar.
//   • oEmbed 200 → video var ve gömülebilir (sahibi gömmeye izin veriyor)
//   • izleme sayfası → süre, altyazı dilleri, Türkçe otomatik çeviri imkânı
// Siteye yalnızca doğrulanmış (ok: true) videolar girer. Hiçbir video indirilmez.
//
// Kullanım:  node scripts/verify-videos.mjs [--force] [--delay=2500]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const curatedPath = path.join(root, 'data/videos/curated.json');
const outPath = path.join(root, 'data/videos/verified.json');
const force = process.argv.includes('--force');
const delay = Number((process.argv.find((a) => a.startsWith('--delay=')) ?? '--delay=2500').split('=')[1]);
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = new Date().toISOString().slice(0, 10);

const curated = JSON.parse(fs.readFileSync(curatedPath, 'utf8'));
const prev = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : { videos: {} };
const videos = { ...prev.videos };

async function oembed(id) {
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}`;
  const r = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) return { ok: false, status: r.status };
  const j = await r.json();
  return { ok: true, title: j.title, author: j.author_name, authorUrl: j.author_url };
}

async function watch(id) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch(`https://www.youtube.com/watch?v=${id}&hl=tr`, { headers: { 'user-agent': UA, 'accept-language': 'tr-TR,tr;q=0.9,en;q=0.5' }, signal: AbortSignal.timeout(25000) });
    if (r.status === 429) { await sleep(12000); continue; }
    if (!r.ok) return null;
    const html = await r.text();
    const m = html.match(/var ytInitialPlayerResponse = (\{.*?\});(?:var |<\/script>)/s);
    if (!m) return null;
    const pr = JSON.parse(m[1]);
    const vd = pr.videoDetails ?? {};
    const cap = pr.captions?.playerCaptionsTracklistRenderer;
    const tracks = (cap?.captionTracks ?? []).map((t) => ({ lang: t.languageCode, auto: t.kind === 'asr' }));
    return {
      playable: pr.playabilityStatus?.status === 'OK',
      playableInEmbed: pr.playabilityStatus?.playableInEmbed !== false,
      seconds: Number(vd.lengthSeconds) || null,
      live: !!vd.isLiveContent,
      captions: tracks,
      trCaptions: tracks.some((t) => t.lang.startsWith('tr')),
      trTranslatable: !!cap?.translationLanguages?.some((l) => l.languageCode === 'tr'),
    };
  }
  return null;
}

let n = 0;
for (const c of curated) {
  n++;
  const old = videos[c.id];
  if (!force && old?.ok && old.verifiedAt === today) {
    console.log(`${n}/${curated.length} ${c.id} (önceden doğrulanmış)`);
    continue;
  }
  let rec = { ok: false, verifiedAt: today };
  try {
    const o = await oembed(c.id);
    if (!o.ok) {
      rec = { ok: false, verifiedAt: today, reason: `oEmbed ${o.status} (video yok, özel ya da gömmeye kapalı)` };
    } else {
      rec = { ok: true, verifiedAt: today, title: o.title, author: o.author, authorUrl: o.authorUrl, watched: false };
      await sleep(delay);
      const w = await watch(c.id);
      if (w) {
        // Gömme izni için resmî ölçüt oEmbed'dir. İzleme sayfası yalnızca ek bilgi verir:
        // veri merkezi IP'lerinde "giriş yapın" yanıtı dönebildiği için oynatılabilirlik
        // alanları elemede kullanılmaz; yalnızca canlı yayınlar dışarıda bırakılır.
        if (w.live) rec = { ...rec, ok: false, reason: 'canlı yayın' };
        else rec = { ...rec, ...w, watched: w.playable };
      }
    }
  } catch (e) {
    rec = { ok: false, verifiedAt: today, reason: 'ağ hatası: ' + e.message };
  }
  videos[c.id] = rec;
  console.log(`${n}/${curated.length} ${c.id} ${rec.ok ? 'OK ' : 'RED'} ${rec.title ?? rec.reason ?? ''}`.slice(0, 150));
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: today, note: 'scripts/verify-videos.mjs tarafından üretilir; elle düzenlemeyin.', videos }, null, 1));
  await sleep(delay);
}
const ok = curated.filter((c) => videos[c.id]?.ok).length;
console.log(`\nBitti: ${ok}/${curated.length} video doğrulandı.`);
