// Libero — video doğrulama
//
// data/videos/curated.json içindeki her YouTube kimliğini YouTube'un herkese açık
// oEmbed uç noktasıyla (anahtar gerekmez) ve izleme sayfasındaki oynatıcı bilgisiyle
// doğrular; sonucu data/videos/verified.json dosyasına yazar.
//   • oEmbed 200 → video var ve gömülebilir (sahibi gömmeye izin veriyor)
//   • oEmbed 404/401/403 → kaldırılmış, özel ya da gömmeye kapalı → kütüphaneden çıkarılır
//   • izleme sayfası → süre, altyazı dilleri, Türkçe otomatik çeviri imkânı (en iyi çaba:
//     veri merkezi IP'lerinde bot denetimi çıkabilir; bu denetim aşılmaya ÇALIŞILMAZ,
//     bilgi alınamazsa alan boş kalır ve arayüz bunu iddia etmez)
// Siteye yalnızca doğrulanmış (ok: true) videolar girer. Hiçbir video indirilmez.
// Elenen videolar data/videos/REPORT.md içinde (kimlik, neden, tarih) listelenir.
//
// Kullanım:
//   node scripts/verify-videos.mjs [--force] [--delay=2500] [--only=id1,id2]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const curatedPath = path.join(root, 'data/videos/curated.json');
const outPath = path.join(root, 'data/videos/verified.json');
const reportPath = path.join(root, 'data/videos/REPORT.md');
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const force = process.argv.includes('--force');
const delay = Number(arg('delay') ?? 2500);
const only = arg('only')?.split(',').filter(Boolean) ?? null;
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = new Date().toISOString().slice(0, 10);

const curated = JSON.parse(fs.readFileSync(curatedPath, 'utf8'));
const prev = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : { videos: {} };
const videos = { ...prev.videos };

/** Kalıcı ret durumları: video yok / özel / gömmeye kapalı */
const DEFINITIVE = new Set([401, 403, 404]);

async function oembed(id) {
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}`;
  let status = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
      status = r.status;
      if (r.ok) {
        const j = await r.json();
        return { ok: true, title: j.title, author: j.author_name, authorUrl: j.author_url };
      }
      if (DEFINITIVE.has(r.status)) return { ok: false, status: r.status };
    } catch (e) {
      status = `ağ: ${e.message}`;
    }
    await sleep(4000 * (attempt + 1)); // 429/5xx/ağ hatası → bekle, yeniden dene
  }
  return { ok: false, status, transient: true };
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

const WATCH_KEYS = ['playable', 'playableInEmbed', 'seconds', 'live', 'captions', 'trCaptions', 'trTranslatable'];

let n = 0;
const todo = only ? curated.filter((c) => only.includes(c.id)) : curated;
for (const c of todo) {
  n++;
  const old = videos[c.id];
  if (!force && old?.ok && old.verifiedAt === today) {
    console.log(`${n}/${todo.length} ${c.id} (önceden doğrulanmış)`);
    continue;
  }
  let rec = { ok: false, verifiedAt: today };
  try {
    const o = await oembed(c.id);
    if (!o.ok) {
      rec = o.transient
        ? { ok: false, verifiedAt: today, reason: `doğrulanamadı: oEmbed yanıt vermedi (${o.status}); sonra yeniden dene` }
        : { ok: false, verifiedAt: today, reason: `oEmbed ${o.status} (video yok, özel ya da gömmeye kapalı)` };
    } else {
      rec = { ok: true, verifiedAt: today, title: o.title, author: o.author, authorUrl: o.authorUrl, watched: false };
      await sleep(delay);
      let w = null;
      try { w = await watch(c.id); } catch { w = null; }
      if (w) {
        // Gömme izni için resmî ölçüt oEmbed'dir. İzleme sayfası yalnızca ek bilgi verir:
        // veri merkezi IP'lerinde "giriş yapın" yanıtı dönebildiği için oynatılabilirlik
        // alanları elemede kullanılmaz; yalnızca canlı yayınlar dışarıda bırakılır.
        if (w.live) rec = { ...rec, ok: false, reason: 'canlı yayın' };
        else rec = { ...rec, ...w, watched: w.playable };
      } else if (old?.ok) {
        // İzleme sayfası bu kez okunamadı (bot denetimi / ağ): önceki doğrulanmış süre ve altyazı bilgisi korunur.
        for (const k of WATCH_KEYS) if (old[k] !== undefined && old[k] !== null) rec[k] = old[k];
      }
    }
  } catch (e) {
    rec = { ok: false, verifiedAt: today, reason: 'ağ hatası: ' + e.message };
  }
  videos[c.id] = rec;
  console.log(`${n}/${todo.length} ${c.id} ${rec.ok ? 'OK ' : 'RED'} ${rec.title ?? rec.reason ?? ''}`.slice(0, 150));
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: today, note: 'scripts/verify-videos.mjs tarafından üretilir; elle düzenlemeyin.', videos }, null, 1));
  await sleep(delay);
}

// ── REPORT.md: elenen videolar (otomatik bölüm) ─────────────────
const START = '<!-- otomatik:başla -->';
const END = '<!-- otomatik:bitti -->';
const excluded = curated.filter((c) => !videos[c.id]?.ok);
const okCount = curated.length - excluded.length;
const cell = (s) => String(s ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ');
const auto = [
  START,
  `Son doğrulama: ${today} · Kürasyon: ${curated.length} kimlik · Yayında: ${okCount} · Elenen: ${excluded.length}`,
  '',
  excluded.length
    ? ['| Kimlik | Konu | Neden | Tarih |', '| --- | --- | --- | --- |', ...excluded.map((c) => `| \`${c.id}\` | ${c.topic} | ${cell(videos[c.id]?.reason ?? 'doğrulama kaydı yok')} | ${videos[c.id]?.verifiedAt ?? '—'} |`)].join('\n')
    : 'Elenen video yok.',
  END,
].join('\n');
let report = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf8') : '# Video doğrulama raporu\n\n## Elenen videolar (otomatik)\n\n' + START + '\n' + END + '\n\n## Değişiklik günlüğü (elle)\n';
if (report.includes(START) && report.includes(END)) report = report.slice(0, report.indexOf(START)) + auto + report.slice(report.indexOf(END) + END.length);
else report += '\n' + auto + '\n';
fs.writeFileSync(reportPath, report);

console.log(`\nBitti: ${okCount}/${curated.length} video doğrulandı, ${excluded.length} elendi (data/videos/REPORT.md).`);
