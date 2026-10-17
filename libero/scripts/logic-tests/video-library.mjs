// Video kütüphanesi: konu/grup tutarlılığı, süzgeçler, adres bağlantıları, sayaçlar, sıralama,
// kişisel zaman notları (eski yedekler dahil), dürüstlük rozetleri, arayüz tercihleri ve veri bütünlüğü.
import fs from 'node:fs';
import path from 'node:path';

export const include = [
  'data/video-topics.ts',
  'data/video-build.ts',
  'data/index.ts',
  'lib/video-filter.ts',
  'lib/video-moments.ts',
  'lib/video-honesty.ts',
  'lib/ui-prefs.ts',
  'lib/youtube-api.ts',
  'lib/store.ts',
];

export default async ({ ok, test, load, root }) => {
  const topics = await load('data/video-topics.js');
  const build = await load('data/video-build.js');
  const dataIdx = await load('data/index.js');
  const f = await load('lib/video-filter.js');
  const mo = await load('lib/video-moments.js');
  const hon = await load('lib/video-honesty.js');
  const ui = await load('lib/ui-prefs.js');
  const yt = await load('lib/youtube-api.js');
  const store = await load('lib/store.js');
  // data/videos.ts ile aynı kurulum (node JSON içe aktarmayı öznitelik olmadan yüklemez; build sırasında ayrıca denetlenir)
  const curatedAll = JSON.parse(fs.readFileSync(path.join(root, 'data/videos/curated.json'), 'utf8'));
  const verifiedAll = JSON.parse(fs.readFileSync(path.join(root, 'data/videos/verified.json'), 'utf8')).videos;
  const VIDEOS = build.buildVideos(curatedAll, verifiedAll, (id) => dataIdx.TECH_BY_ID[id]?.name);
  const ME = { level: 2, positions: [] };
  const index = f.indexVideos(VIDEOS);

  await test('Video: her konu tam bir grupta; sıra tüm konuları kapsar; her grupta video var', async () => {
    const names = Object.keys(topics.VIDEO_TOPIC_NAME);
    ok(topics.VIDEO_TOPIC_ORDER.length === names.length && new Set(topics.VIDEO_TOPIC_ORDER).size === names.length, 'konu sırası eksik/yinelenen');
    for (const t of names) {
      const owners = topics.VIDEO_GROUPS.filter((g) => g.topics.includes(t));
      ok(owners.length === 1, `${t} ${owners.length} grupta`);
      ok(topics.GROUP_OF_TOPIC[t] === owners[0].id, `${t} grup eşlemesi tutarsız`);
    }
    for (const g of topics.VIDEO_GROUPS) ok(VIDEOS.some((v) => topics.GROUP_OF_TOPIC[v.topic] === g.id), `${g.name} grubunda video yok`);
    ok(topics.isVideoTopic('pas') && !topics.isVideoTopic('yok') && topics.isVideoGroup('kaleci') && !topics.isVideoGroup('x'), 'tür koruyucuları');
  });

  await test('Video veri: yinelenen kimlik yok, özet ve Türkçe alanlar dolu, dil/altyazı alanı tutarlı', async () => {
    ok(VIDEOS.length >= 50, `video sayısı az: ${VIDEOS.length}`);
    const ids = new Set();
    for (const v of VIDEOS) {
      ok(/^[\w-]{11}$/.test(v.id) && !ids.has(v.id), `kimlik: ${v.id}`);
      ids.add(v.id);
      ok(v.title && v.author && v.summary.length >= 20, `${v.id} eksik alan`);
      ok(v.lv[0] >= 1 && v.lv[1] <= 5 && v.lv[0] <= v.lv[1], `${v.id} seviye`);
      ok(v.lang === 'tr' ? v.sub === 'tr-anlatim' : v.sub === 'tr-ceviri' || v.sub === 'tr-yok', `${v.id} altyazı durumu`);
      ok(v.related.length === v.techs.length && v.related.every((r) => r.name), `${v.id} ilgili teknik adları`);
    }
  });

  await test('Video veri: elenen kimlikler REPORT.md içinde listelenir; yayındaki her video doğrulanmıştır', async () => {
    const dir = path.join(root, 'data/videos');
    const cur = curatedAll;
    const ver = verifiedAll;
    ok(build.validateCurated(cur, ver, new Set(cur.filter((c) => !ver[c.id]?.ok).map((c) => c.id))).length === 0, 'validateCurated hata verdi');
    const report = fs.readFileSync(path.join(dir, 'REPORT.md'), 'utf8');
    for (const c of cur) {
      ok(ver[c.id], `${c.id} için doğrulama kaydı yok`);
      if (!ver[c.id].ok) ok(report.includes(c.id), `${c.id} elenmiş ama REPORT.md içinde yok`);
    }
    for (const v of VIDEOS) ok(ver[v.id]?.ok === true, `${v.id} doğrulanmamış ama yayında`);
    ok(VIDEOS.length === cur.filter((c) => ver[c.id]?.ok).length, 'yayındaki video sayısı doğrulananlarla uyuşmuyor');
  });

  await test('Video kapakları: her konunun çizimi ve rengi vardır', async () => {
    const src = fs.readFileSync(path.join(root, 'components/VideoCover.tsx'), 'utf8');
    for (const t of Object.keys(topics.VIDEO_TOPIC_NAME)) {
      ok(new RegExp(`^  ${t}: \\(\\) =>`, 'm').test(src), `${t} için kapak sahnesi yok`);
      ok(new RegExp(`^  ${t}: '`, 'm').test(src), `${t} için kapak rengi yok`);
    }
    const css = fs.readFileSync(path.join(root, 'styles/video.css'), 'utf8');
    const used = new Set([...src.matchAll(/vc-[a-z0-9-]+/g)].map((m) => m[0]).filter((c) => !c.endsWith('-')));
    const missing = [...used].filter((c) => !css.includes(`.${c}`) && !(c === 'vc-f-mint' || c === 'vc-f-grass'));
    ok(missing.length === 0, `kapak sınıfları stilsiz: ${missing.join(', ')}`);
  });

  await test('Süzgeç: adres bağlantısı (?konu=pas&dil=tr) konudan grubu türetir, bozuk değerler yok sayılır', async () => {
    const a = f.parseFilters('?konu=pas&dil=tr');
    ok(a.topic === 'pas' && a.lang === 'tr' && a.group === 'teknik', JSON.stringify(a));
    const b = f.parseFilters('konu=yok&dil=de&seviye=9&pozisyon=hayali&sirala=x&grup=zzz');
    ok(b.topic === 'all' && b.lang === 'all' && b.level === 'all' && b.pos === 'all' && b.sort === 'konu' && b.group === 'all', JSON.stringify(b));
    ok(f.parseFilters('grup=kaleci').group === 'kaleci', 'grup bağlantısı');
    ok(f.parseFilters('seviye=3&uygun=1&q=pas').level === 3 && f.parseFilters('uygun=1').mine === true, 'seviye/uygun');
    ok(f.parseFilters('q=' + 'a'.repeat(300)).q.length === 80, 'arama uzunluğu sınırlanmalı');
    ok(f.filtersToSearch(f.DEFAULT_FILTERS) === '', 'varsayılan süzgeç adrese yazılmaz');
  });

  await test('Süzgeç: adres ↔ süzgeç gidiş dönüş kayıpsızdır', async () => {
    const samples = ['?konu=sut&dil=en&seviye=4', '?grup=oyun&sirala=dil', '?q=trivela&uygun=1', '?konu=kalecilik&pozisyon=kaleci&sirala=seviye', ''];
    for (const s of samples) {
      const p1 = f.parseFilters(s);
      const s2 = f.filtersToSearch(p1);
      const p2 = f.parseFilters(s2);
      ok(JSON.stringify(p1) === JSON.stringify(p2), `${s} → ${s2} tutarsız`);
    }
    // konu seçiliyken grup parametresi yazılmaz (konu zaten grubu belirler)
    ok(!f.filtersToSearch(f.parseFilters('?konu=pas&grup=kaleci')).includes('grup='), 'tutarsız grup/konu düzeltilmeli');
    ok(f.parseFilters('?konu=pas&grup=kaleci').group === 'teknik', 'konu grubu belirler');
  });

  await test('Süzgeç: sayaçlar toplamı tutar; konu çipi sayısı seçili konudan etkilenmez', async () => {
    const g = f.groupCounts(index, f.DEFAULT_FILTERS, ME);
    const t = f.topicCounts(index, f.DEFAULT_FILTERS, ME);
    ok(g.all === VIDEOS.length, `Tümü ${g.all} ≠ ${VIDEOS.length}`);
    ok(g.teknik + g.oyun + g.kaleci + g.fiziksel === g.all, 'grup toplamı');
    ok(Object.values(t).reduce((a, b) => a + b, 0) === g.all, 'konu toplamı');
    for (const gr of topics.VIDEO_GROUPS) ok(gr.topics.reduce((a, tp) => a + t[tp], 0) === g[gr.id], `${gr.id} grubu sayacı`);
    const sel = f.parseFilters('?konu=pas');
    ok(JSON.stringify(f.topicCounts(index, sel, ME)) === JSON.stringify(t), 'seçili konu diğer konuların sayısını değiştirmemeli');
    const tr = f.parseFilters('?dil=tr');
    const trTotal = VIDEOS.filter((v) => v.lang === 'tr').length;
    ok(f.groupCounts(index, tr, ME).all === trTotal, 'dil süzgeci sayaçlara yansımalı');
  });

  await test('Süzgeç: dil, seviye, pozisyon, konu ve arama doğru süzer', async () => {
    const n = (s) => f.filterVideos(index, f.parseFilters(s), ME);
    ok(n('?dil=en').every((v) => v.lang === 'en') && n('?dil=tr').every((v) => v.lang === 'tr'), 'dil');
    ok(n('?dil=tr').length + n('?dil=en').length === VIDEOS.length, 'dil toplamı');
    ok(n('?seviye=5').every((v) => v.lv[0] <= 5 && 5 <= v.lv[1]), 'seviye');
    ok(n('?konu=kalecilik').every((v) => v.topic === 'kalecilik') && n('?konu=kalecilik').length > 0, 'konu');
    ok(n('?pozisyon=kaleci').every((v) => v.pos.length === 0 || v.pos.includes('kaleci')), 'pozisyon (pozisyonsuz video herkes içindir)');
    ok(n('?q=kaleci').length > 0, 'arama sonuç vermeli');
    ok(n('?q=KALECİ').length === n('?q=kaleci').length, 'Türkçe büyük/küçük harf duyarsız');
    ok(n('?q=zzzxqq').length === 0, 'anlamsız arama boş dönmeli');
    ok(f.filterVideos(index, f.parseFilters('?uygun=1&seviye=1'), { level: 5, positions: [] }).length <= n('?seviye=1').length, 'uygun süzgeci daraltır');
  });

  await test('Süzgeç: sıralama kararlı ve beklenen düzende', async () => {
    const all = f.filterVideos(index, f.DEFAULT_FILTERS, ME);
    const rank = Object.fromEntries(topics.VIDEO_TOPIC_ORDER.map((t, i) => [t, i]));
    const byKonu = f.sortVideos(all, 'konu');
    for (let i = 1; i < byKonu.length; i++) ok(rank[byKonu[i - 1].topic] <= rank[byKonu[i].topic], 'konu sırası bozuk');
    const bySev = f.sortVideos(all, 'seviye');
    for (let i = 1; i < bySev.length; i++) ok(bySev[i - 1].lv[0] <= bySev[i].lv[0], 'seviye sırası bozuk');
    const byDil = f.sortVideos(all, 'dil');
    const firstEn = byDil.findIndex((v) => v.lang === 'en');
    ok(firstEn === -1 || byDil.slice(firstEn).every((v) => v.lang === 'en'), 'Türkçeler önce gelmeli');
    ok(JSON.stringify(f.sortVideos(all, 'konu').map((v) => v.id)) === JSON.stringify(f.sortVideos([...all].reverse(), 'konu').map((v) => v.id)), 'sıralama girdi sırasından bağımsız olmalı');
    ok(all.length === byKonu.length, 'sıralama video kaybetmemeli');
  });

  await test('Süzgeç: etkin süzgeç etiketleri, kaldırma ve gevşetme önerileri', async () => {
    const s = f.parseFilters('?konu=kalecilik&dil=en&seviye=1&q=zzzxqq');
    ok(f.filterVideos(index, s, ME).length === 0, 'örnek süzgeç boş dönmeli');
    const act = f.activeFilters(s);
    ok(act.length === 4 && act.every((a) => a.label.length > 3), 'etkin süzgeç sayısı');
    ok(act.some((a) => a.label.startsWith('Konu: ')) && act.some((a) => a.label.startsWith('Dil: ')), 'Türkçe etiketler');
    const hints = f.relaxSuggestions(index, s, ME);
    ok(hints.every((h) => h.count > 0), 'öneriler sonuç doğurmalı');
    const c = f.clearFilter(f.parseFilters('?konu=pas'), 'topic');
    ok(c.topic === 'all' && c.group === 'all', 'konu kaldırılınca grup da sıfırlanmalı');
    const one = f.relaxSuggestions(index, f.parseFilters('?dil=en&q=zzzxqq'), ME);
    ok(one.length === 0 || one.every((h) => h.key !== 'q' || h.count > 0), 'öneri tutarlı');
  });

  await test('Kişisel notlar: süre ayrıştırma/biçimleme, sınırlar ve sıralı ekleme/silme', async () => {
    ok(mo.parseTime('1:05') === 65 && mo.parseTime('65') === 65 && mo.parseTime('1:02:03') === 3723 && mo.parseTime('0:00') === 0, 'geçerli süreler');
    for (const bad of ['', 'abc', '1:75', '-5', '1:2:3:4', '99999999', '1.5']) ok(mo.parseTime(bad) === null, `geçersiz süre kabul edildi: ${bad}`);
    ok(mo.fmtTime(65) === '1:05' && mo.fmtTime(3723) === '1:02:03' && mo.fmtTime(0) === '0:00' && mo.fmtTime(-3) === '0:00', 'biçim');
    for (const s of [0, 5, 59, 60, 61, 599, 3599, 3600, 7322]) ok(mo.parseTime(mo.fmtTime(s)) === s, `gidiş dönüş ${s}`);
    let all = {};
    all = mo.withMoment(all, 'abcdefghijk', 90, 'ikinci', '2026-01-01T10:00:00.000Z');
    all = mo.withMoment(all, 'abcdefghijk', 12, 'birinci', '2026-01-01T10:01:00.000Z');
    ok(all.abcdefghijk.map((m) => m.text).join() === 'birinci,ikinci', 'zamana göre sıralı olmalı');
    ok(mo.withMoment(all, 'abcdefghijk', 5, '   ', 'x') === all, 'boş metin eklenmemeli');
    ok(mo.withMoment(all, 'abcdefghijk', -1, 'a', 'x') === all && mo.withMoment(all, 'ab', 1, 'a', 'x') === all, 'geçersiz süre/kimlik');
    ok(mo.withMoment({}, 'abcdefghijk', 1, 'x'.repeat(999), '2026-01-01T00:00:00.000Z').abcdefghijk[0].text.length === mo.MAX_MOMENT_TEXT, 'metin sınırı');
    let cap = {};
    for (let i = 0; i < mo.MAX_MOMENTS_PER_VIDEO + 5; i++) cap = mo.withMoment(cap, 'abcdefghijk', i, `n${i}`, '2026-01-01T00:00:00.000Z');
    ok(cap.abcdefghijk.length === mo.MAX_MOMENTS_PER_VIDEO, 'video başına not sınırı');
    const m0 = all.abcdefghijk[0];
    const after = mo.withoutMoment(all, 'abcdefghijk', m0);
    ok(after.abcdefghijk.length === 1 && all.abcdefghijk.length === 2, 'silme saf olmalı');
    ok(!('abcdefghijk' in mo.withoutMoment(after, 'abcdefghijk', after.abcdefghijk[0])), 'son not silinince anahtar kalkmalı');
  });

  await test('Kişisel notlar: bozuk/eski yedek yüklenince çökmez; yedek geri yüklemede notlar korunur', async () => {
    ok(JSON.stringify(mo.sanitizeMoments(undefined)) === '{}' && JSON.stringify(mo.sanitizeMoments([1, 2])) === '{}' && JSON.stringify(mo.sanitizeMoments('x')) === '{}', 'eski yedek ya da bozuk alan');
    const dirty = mo.sanitizeMoments({ 'abcdefghijk': [{ t: '12', text: ' a  b ', at: 'bozuk' }, { t: 1e12, text: 'x' }, { t: 3, text: '' }, null], '<script>': [{ t: 1, text: 'x' }], 'abcdefghijl': 'nope' });
    ok(Object.keys(dirty).length === 1 && dirty.abcdefghijk.length === 1 && dirty.abcdefghijk[0].t === 12 && dirty.abcdefghijk[0].text === 'a b' && dirty.abcdefghijk[0].at === '', JSON.stringify(dirty));
    ok(store.SCHEMA_VERSION === 2, 'şema sürümü değişmemeli (yeni alan isteğe bağlı)');
    const old = store.makeDefault();
    delete old.videoMoments;
    ok(JSON.stringify(store.sanitize(JSON.parse(JSON.stringify(old))).videoMoments) === '{}', 'alansız eski yedek {} olmalı');
    const withM = { ...store.makeDefault(), videoMoments: { abcdefghijk: [{ t: 85, text: 'ilk dokunuş', at: '2026-01-01T00:00:00.000Z' }] } };
    const round = store.sanitize(JSON.parse(JSON.stringify(withM)));
    ok(round.videoMoments.abcdefghijk[0].t === 85 && round.videoMoments.abcdefghijk[0].text === 'ilk dokunuş', 'yedekten geri yükleme notları korumalı');
  });

  await test('Dürüstlük rozetleri: Türkçe altyazı yalnızca veri destekliyorsa söylenir', async () => {
    const fake = (lang, sub) => ({ lang, sub, verifiedAt: '2026-10-16' });
    const labels = (v) => hon.videoBadges(v).map((b) => b.label).join(' | ');
    ok(!/altyazı/i.test(labels(fake('tr', 'tr-anlatim'))), 'Türkçe videoda altyazı iddiası olmamalı');
    ok(/Türkçe özet var; Türkçe altyazı doğrulanamadı/.test(labels(fake('en', 'tr-yok'))), 'doğrulanamayan altyazı açıkça yazılmalı');
    ok(!/otomatik çeviri/.test(labels(fake('en', 'tr-yok'))), 'tr-yok için çeviri iddiası olmamalı');
    ok(/otomatik çeviriyle açılabilir/.test(labels(fake('en', 'tr-ceviri'))), 'tr-ceviri rozeti');
    ok(!/doğrulanamadı/.test(labels(fake('en', 'tr-ceviri'))), 'tr-ceviri için doğrulanamadı denmemeli');
    ok(/16\.10\.2026/.test(labels(fake('tr', 'tr-anlatim'))) && hon.trDate('bozuk') === '', 'tarih biçimi');
    for (const v of VIDEOS) {
      const b = hon.videoBadges(v);
      ok(b.some((x) => x.id === 'lang') && b.some((x) => x.id === 'embed'), `${v.id} rozetleri`);
      ok(v.lang === 'tr' || b.some((x) => x.id === 'sub'), `${v.id} İngilizce videoda altyazı durumu yazılmalı`);
      ok(b.every((x) => !/izledik|izlendi/i.test(x.label + (x.hint ?? ''))), `${v.id} izlendiği iddiası`);
    }
  });

  await test('Arayüz tercihleri: ayrı anahtar, bozuk değerde varsayılan, dış görsel varsayılanı açık', async () => {
    ok(ui.UI_KEY === 'libero:ui' && ui.UI_KEY !== store.STORAGE_KEY, 'kritik depodan ayrı anahtar');
    ok(ui.sanitizeUi(null).ytThumbs === true && ui.sanitizeUi({ ytThumbs: 'evet' }).ytThumbs === true && ui.sanitizeUi({ ytThumbs: false }).ytThumbs === false, 'sanitize');
    ok(Object.keys(ui.sanitizeUi({ ytThumbs: false, x: 1 })).join() === 'ytThumbs', 'bilinmeyen alanlar atılmalı');
  });

  await test('YouTube hata kodları doğru sınıflanır', async () => {
    ok(yt.ytErrorKind(150) === 'embed-off' && yt.ytErrorKind(101) === 'embed-off' && yt.ytErrorKind(100) === 'missing' && yt.ytErrorKind(5) === 'other' && yt.ytErrorKind(2) === 'other', 'hata sınıfları');
  });
};
