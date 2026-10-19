// Oyuncu analizi: bölümler, kaynaklar, teknik/video bütünlüğü, yasak dil denetimi,
// dizin süzgeçleri ve "Bu videoda bak" panelinin dürüstlüğü.
import fs from 'node:fs';
import path from 'node:path';

export const include = ['data/players.ts', 'data/player-check.ts', 'data/player-types.ts', 'data/index.ts', 'data/video-build.ts', 'lib/player-filter.ts', 'lib/player-video.ts'];

const ORIGINAL_IDS = [
  'lionel-messi', 'xavi-hernandez', 'andres-iniesta', 'luka-modric', 'toni-kroos', 'ngolo-kante', 'rodri', 'kevin-de-bruyne', 'arda-guler',
  'hakan-calhanoglu', 'mohamed-salah', 'vinicius-junior', 'erling-haaland', 'thierry-henry', 'virgil-van-dijk', 'philipp-lahm', 'manuel-neuer', 'trent-alexander-arnold',
];

export default async ({ ok, test, load, root }) => {
  const pl = await load('data/players.js');
  const chk = await load('data/player-check.js');
  const types = await load('data/player-types.js');
  const idx = await load('data/index.js');
  const build = await load('data/video-build.js');
  const filt = await load('lib/player-filter.js');
  const pv = await load('lib/player-video.js');
  const { PLAYERS, PLAYER_BY_ID } = pl;

  const curated = JSON.parse(fs.readFileSync(path.join(root, 'data/videos/curated.json'), 'utf8'));
  const verified = JSON.parse(fs.readFileSync(path.join(root, 'data/videos/verified.json'), 'utf8')).videos;
  const VIDEOS = build.buildVideos(curated, verified, (id) => idx.TECH_BY_ID[id]?.name);
  const ctx = { techIds: new Set(Object.keys(idx.TECH_BY_ID)), videoTopics: Object.fromEntries(VIDEOS.map((v) => [v.id, v.topic])) };

  await test('Oyuncular: tüm veri doğrulayıcıdan geçer (bölümler, kaynaklar, teknik ve video kimlikleri)', async () => {
    const errs = chk.validatePlayers(PLAYERS, ctx);
    ok(errs.length === 0, errs.slice(0, 5).join(' | '));
  });

  await test('Oyuncular: ilk sürümdeki 18 kimlik ve içerik korunur; yeni oyuncular eklenmiştir; kimlikler benzersiz', async () => {
    for (const id of ORIGINAL_IDS) ok(PLAYER_BY_ID[id], `eski kimlik kayboldu: ${id}`);
    ok(PLAYERS.length >= 22 && PLAYERS.length <= 26, `oyuncu sayısı beklenmedik: ${PLAYERS.length}`);
    ok(new Set(PLAYERS.map((p) => p.id)).size === PLAYERS.length, 'yinelenen kimlik');
    ok(PLAYERS.slice(0, 18).map((p) => p.id).join() === ORIGINAL_IDS.join(), 'eski oyuncuların sırası korunmalı');
    // eski içerik (ilk sürümden) hâlâ duruyor
    ok(PLAYER_BY_ID['lionel-messi'].lessons.length === 3 && PLAYER_BY_ID['lionel-messi'].watch.length === 3, 'Messi dersleri/izleme noktaları korunmalı');
    ok(PLAYER_BY_ID['rodri'].style.includes('dengeyi'), 'Rodri özeti korunmalı');
    ok(PLAYERS.slice(18).every((p) => p.sources.length >= 1), 'yeni oyuncuların kaynağı var');
  });

  await test('Oyuncular: her oyuncunun tüm bölümleri dolu; ≥1 kaynak (https + erişim tarihi); 3–6 doğrulanmış video', async () => {
    for (const p of PLAYERS) {
      for (const k of ['style', 'role', 'tagline']) ok(p[k].trim().length > 20 || k === 'role', `${p.id}.${k}`);
      for (const k of ['onBall', 'offBall', 'defending', 'lessons', 'watch', 'positioning', 'passing', 'control', 'decisions', 'strengths', 'limits', 'similar']) ok(p[k].length >= 1, `${p.id}.${k} boş`);
      ok(p.sources.length >= 1, `${p.id}: kaynak yok`);
      for (const s of p.sources) {
        ok(/^https:\/\//.test(s.url) && /^\d{4}-\d{2}-\d{2}$/.test(s.accessed) && s.title && s.note, `${p.id}: kaynak alanları`);
        ok(new URL(s.url).hostname.includes('.'), `${p.id}: kaynak alan adı`);
      }
      ok(p.videos.length >= 3 && p.videos.length <= 6, `${p.id}: video sayısı ${p.videos.length}`);
      for (const v of p.videos) ok(verified[v]?.ok === true, `${p.id}: ${v} doğrulanmamış/gömülemez`);
    }
  });

  await test('Oyuncular: teknik bağlantıları gerçek ve benzer oyuncular geçerli (kendini göstermez)', async () => {
    for (const p of PLAYERS) {
      for (const t of p.techs) ok(idx.TECH_BY_ID[t], `${p.id}: ${t} teknik yok`);
      for (const s of p.similar) ok(PLAYER_BY_ID[s] && s !== p.id, `${p.id}: benzer ${s} geçersiz`);
    }
  });

  await test('Oyuncular: Messi en kapsamlı; diğer oyunculardan belirgin biçimde daha derin', async () => {
    const m = PLAYER_BY_ID['lionel-messi'];
    ok(m.deep === true && PLAYERS.filter((p) => p.deep).length === 1, 'yalnızca Messi “deep” olmalı');
    const size = (p) => ['onBall', 'offBall', 'defending', 'positioning', 'passing', 'control', 'decisions', 'strengths', 'limits'].reduce((a, k) => a + p[k].length, 0) + (p.extra ?? []).reduce((a, e) => a + e.items.length, 0);
    const others = PLAYERS.filter((p) => p.id !== m.id);
    ok(size(m) >= Math.max(...others.map(size)) + 10, `Messi ${size(m)} madde; en fazla diğer ${Math.max(...others.map(size))}`);
    ok((m.extra ?? []).length >= 3 && m.sources.length >= 2, 'ek bloklar ve ≥2 kaynak');
  });

  await test('Oyuncular: kaynak yoksa söylemek yerine azaltır — istatistik/ödül/transfer/zaman kodu dili yoktur', async () => {
    const all = (p) => [p.tagline, p.style, ...p.onBall, ...p.offBall, ...p.defending, ...p.lessons, ...p.watch, ...p.positioning, ...p.passing, ...p.control, ...p.decisions, ...p.strengths, ...p.limits, ...Object.values(p.videoLooks), ...(p.extra ?? []).flatMap((e) => [e.title, ...e.items])];
    for (const p of PLAYERS) {
      for (const t of all(p)) {
        ok(!chk.FORBIDDEN_RE.test(t), `${p.id}: yasak dil: ${t.slice(0, 70)}`);
        ok(!/\b\d{1,2}:\d{2}\b/.test(t), `${p.id}: zaman kodu verilmemeli: ${t.slice(0, 70)}`);
      }
    }
  });

  await test('Oyuncu doğrulayıcısı: bozuk veriyi yakalar (eksik bölüm, bilinmeyen teknik/video, http kaynak, yinelenen kimlik, yasak dil, video metni yok)', async () => {
    const base = structuredClone(PLAYER_BY_ID['rodri']);
    const run = (mut) => {
      const p = structuredClone(base);
      mut(p);
      return chk.validatePlayers([p, structuredClone(PLAYER_BY_ID['sergio-busquets'])], ctx).join(' | ');
    };
    ok(/passing.*boş/.test(run((p) => { p.passing = []; })), 'boş bölüm');
    ok(/bilinmeyen teknik/.test(run((p) => { p.techs.push('yok-boyle-teknik'); })), 'teknik');
    ok(/doğrulanmış değil/.test(run((p) => { p.videos = [...p.videos.slice(0, 3), 'AAAAAAAAAAA']; })), 'doğrulanmamış video');
    ok(/en az 1 kaynak/.test(run((p) => { p.sources = []; })), 'kaynaksız');
    ok(/kaynak adresi geçersiz/.test(run((p) => { p.sources[0].url = 'http://example.com/x'; })), 'http kaynak');
    ok(/yinelenen kimlik/.test(chk.validatePlayers([base, structuredClone(base)], ctx).join(' | ')), 'yinelenen kimlik');
    ok(/yasak dil/.test(run((p) => { p.strengths.push('Sezonda 25 gol attı ve büyük bir transfer yaptı.'); })), 'yasak dil');
    ok(/Bu videoda bak|metni yok/.test(run((p) => { delete p.videoLooks[Object.keys(p.videoLooks)[0]]; })), 'video metni');
    ok(/3–6 video/.test(run((p) => { p.videos = p.videos.slice(0, 2); })), 'video sayısı');
    ok(/benzer oyuncu bulunamadı/.test(run((p) => { p.similar = ['hayali-oyuncu']; })), 'benzer oyuncu');
  });

  await test('Oyuncu dizini: konum/tür süzgeçleri, arama (Türkçe harf duyarsız), sayaçlar ve sıralama', async () => {
    const list = PLAYERS.map((p) => ({ id: p.id, name: p.name, pos: p.pos, role: p.role, tagline: p.tagline, kind: p.kind, deep: !!p.deep, sources: p.sources.length, videos: p.videos.length, sections: 14 }));
    const F = filt.DEFAULT_PLAYER_FILTERS;
    ok(filt.filterPlayers(list, F).length === list.length, 'varsayılan: hepsi');
    const kal = filt.filterPlayers(list, { ...F, pos: 'kaleci' });
    ok(kal.length >= 1 && kal.every((p) => p.pos === 'kaleci'), 'kaleci konumu');
    ok(filt.filterPlayers(list, { ...F, q: 'ÇALHANOĞLU' }).map((p) => p.id).join() === 'hakan-calhanoglu', 'Türkçe büyük harf arama');
    ok(filt.filterPlayers(list, { ...F, q: 'messi' })[0].id === 'lionel-messi', 'Messi aranabilir');
    ok(filt.filterPlayers(list, { ...F, q: 'zzzxq' }).length === 0, 'boş sonuç');
    for (const k of types.PLAYER_KIND_ORDER) ok(filt.filterPlayers(list, { ...F, kind: k }).length >= 1, `${k} türünde oyuncu yok`);
    const pc = filt.posCounts(list, F);
    ok(Object.values(pc).reduce((a, b) => a + b, 0) === list.length, 'konum sayaçları toplamı');
    const withKind = { ...F, kind: 'denge' };
    ok(Object.values(filt.posCounts(list, withKind)).reduce((a, b) => a + b, 0) === filt.filterPlayers(list, withKind).length, 'konum sayaçları tür süzgecine uyar');
    ok(filt.orderPlayers(list)[0].id === 'lionel-messi', 'Messi öne çıkarılır');
    ok(filt.orderPlayers(list).length === list.length, 'sıralama kayıpsız');
    ok(JSON.stringify(filt.parsePlayerFilters('?poz=kaleci&tur=kaleci&q=neuer')) === JSON.stringify({ q: 'neuer', pos: 'kaleci', kind: 'kaleci' }), 'adres okuma');
    ok(JSON.stringify(filt.parsePlayerFilters('?poz=yok&tur=yok')) === JSON.stringify(F) && filt.playerFiltersToSearch(F) === '', 'bozuk adres yok sayılır');
    ok(filt.initialsOf('Lionel Messi') === 'LM' && filt.initialsOf('Rodri') === 'RO' && filt.surnameOf('Kevin De Bruyne') === 'Bruyne', 'baş harfler');
  });

  await test('“Bu videoda bak” paneli dürüsttür: video oyuncu hakkında değil denir; başlıkta ad geçse içerik doğrulanmadı denir', async () => {
    const messi = PLAYER_BY_ID['lionel-messi'];
    const vids = VIDEOS.filter((v) => messi.videos.includes(v.id));
    ok(vids.length === messi.videos.length, 'Messi videoları kütüphanede');
    const named = VIDEOS.find((v) => v.id === 'qCnyXi0bHWI');
    const plain = VIDEOS.find((v) => v.id === '5GdObYQTDqQ');
    const a = pv.buildVideoPanel(messi, named);
    const b = pv.buildVideoPanel(messi, plain);
    ok(a.titleMentions && /doğrulamadı/.test(a.intro), 'başlıkta ad geçince içerik doğrulanmadı denmeli');
    ok(!b.titleMentions && /hakkında değil/.test(b.intro), 'başlıkta ad yoksa video oyuncu hakkında değil denmeli');
    for (const p of PLAYERS) {
      for (const id of p.videos) {
        const v = VIDEOS.find((x) => x.id === id);
        const m = pv.buildVideoPanel(p, v);
        ok(m.look.length >= 1 && m.look.every((t) => t.length > 20), `${p.id}/${id}: panel metni`);
        ok(m.specific, `${p.id}/${id}: konuya özel metin olmalı`);
        ok(!/\b\d{1,2}:\d{2}\b/.test(m.intro + m.look.join(' ')), 'zaman kodu yok');
      }
    }
    ok(pv.titleMentionsPlayer('NGOLO KANTE GİBİ ORTA SAHA OLMAK', 'N’Golo Kanté') && !pv.titleMentionsPlayer('Passing: Inside of the Foot', 'Lionel Messi'), 'ad eşleme');
    ok(pv.buildVideoPanel({ ...messi, videoLooks: {} }, plain).specific === false && pv.buildVideoPanel({ ...messi, videoLooks: {} }, plain).look.length === 2, 'metin yoksa genel izleme noktalarına düşer');
  });
};
