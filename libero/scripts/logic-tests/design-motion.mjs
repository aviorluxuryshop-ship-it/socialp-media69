// Hareket sistemi saf yardımcıları ve "Bugün ne çalışayım?" akıllı girişi (DOM'suz).
export const include = ['lib/motion.ts', 'lib/today.ts'];

export default async ({ ok, test, load }) => {
  const m = await load('lib/motion.js');
  const t = await load('lib/today.js');

  await test('Hareket: easing ve sayaç sınırları (0 → başlangıç, 1 → hedef, azalmayan)', async () => {
    ok(m.easeOutCubic(0) === 0 && m.easeOutCubic(1) === 1, 'cubic uçları');
    ok(m.easeOutExpo(0) === 0 && m.easeOutExpo(1) === 1, 'expo uçları');
    ok(m.easeOutCubic(-5) === 0 && m.easeOutCubic(9) === 1, 'sınır dışı değerler kırpılmalı');
    ok(m.countValue(0, 127) === 0 && m.countValue(1, 127) === 127 && m.countValue(0, 90, 10) === 10, 'sayaç uçları');
    let prev = -1;
    for (let i = 0; i <= 100; i++) {
      const v = m.countValue(i / 100, 127);
      ok(v >= prev && v <= 127 && Number.isInteger(v), `sayaç ${i}%: ${v}`);
      prev = v;
    }
  });

  await test('Hareket: sayaç hedefi ayrıştırma bozuk girişte null döner', async () => {
    ok(m.parseCountTarget('127') === 127 && m.parseCountTarget(' 9 ') === 9 && m.parseCountTarget('0') === 0, 'geçerli sayılar');
    for (const bad of [null, undefined, '', 'abc', '-3', 'NaN', '1e12', 'Infinity']) ok(m.parseCountTarget(bad) === null, `bozuk giriş kabul edildi: ${bad}`);
    ok(m.formatCount(1234).replace(/\D/g, '') === '1234', 'biçimlenmiş sayı rakamları korunmalı');
  });

  await test('Hareket: kademe gecikmeleri üst sınırlıdır; görünme kararı hızlı kaydırmayı da kapsar', async () => {
    const d = m.staggerDelays(20, 70, 6);
    ok(d.length === 20 && d[0] === 0 && d[6] === 420 && d[19] === 420, 'kademe sınırı');
    ok(m.staggerDelays(0).length === 0, 'boş liste');
    ok(m.shouldRevealNow({ top: -900, bottom: -100 }, 800) === true, 'üstte kalan öğe açılmalı (hızlı kaydırma)');
    ok(m.shouldRevealNow({ top: 100, bottom: 400 }, 800) === true, 'görünür öğe açılmalı');
    ok(m.shouldRevealNow({ top: 790, bottom: 1100 }, 800) === false, 'tam sınırdaki öğe henüz beklemeli');
    ok(m.shouldRevealNow({ top: 2000, bottom: 2300 }, 800) === false, 'uzaktaki öğe beklemeli');
  });

  await test('Top planı: WebGL yok / düşük güç → SVG; güçlü cihaz → WebGL; hareket azaltma → sabit kare', async () => {
    const base = { reducedMotion: false, webgl: true, coarsePointer: false, width: 1440, deviceMemory: 8, hardwareConcurrency: 8 };
    const hi = m.chooseBallMode(base);
    ok(hi.mode === 'webgl' && hi.texture === 'high' && hi.animate === true, 'güçlü masaüstü: ' + JSON.stringify(hi));
    ok(m.chooseBallMode({ ...base, webgl: false }).mode === 'svg', 'WebGL yok');
    ok(m.chooseBallMode({ ...base, webgl: false }).reason === 'no-webgl', 'neden: webgl yok');
    ok(m.chooseBallMode({ ...base, coarsePointer: true, width: 390 }).mode === 'svg', 'dar dokunmatik');
    ok(m.chooseBallMode({ ...base, deviceMemory: 2 }).mode === 'svg', 'düşük bellek');
    ok(m.chooseBallMode({ ...base, hardwareConcurrency: 2 }).mode === 'svg', 'az çekirdek');
    ok(m.chooseBallMode({ ...base, saveData: true }).mode === 'svg', 'veri tasarrufu');
    ok(m.chooseBallMode({ ...base, coarsePointer: true, width: 1024 }).mode === 'webgl', 'geniş tablet WebGL kullanabilir');
    ok(m.chooseBallMode({ ...base, coarsePointer: true, width: 1024 }).texture === 'low', 'tablet düşük doku');
    ok(m.chooseBallMode({ ...base, width: 900 }).texture === 'low', 'orta genişlik düşük doku');
    const rm = m.chooseBallMode({ ...base, reducedMotion: true });
    ok(rm.mode === 'webgl' && rm.animate === false, 'hareket azaltma: sabit kare');
    ok(m.chooseBallMode({ ...base, webgl: false, reducedMotion: true }).animate === false, 'SVG de durağan');
    ok(m.chooseBallMode({ ...base, deviceMemory: undefined, hardwareConcurrency: undefined }).mode === 'webgl', 'bilinmeyen donanım engellenmez');
  });

  await test('Paralaks yalnızca ince imleç + geniş ekran + hareket azaltma kapalıyken', async () => {
    ok(m.parallaxEnabled({ reducedMotion: false, coarsePointer: false, width: 1280 }), 'masaüstü açık');
    ok(!m.parallaxEnabled({ reducedMotion: true, coarsePointer: false, width: 1280 }), 'hareket azaltma kapalı');
    ok(!m.parallaxEnabled({ reducedMotion: false, coarsePointer: true, width: 1280 }), 'dokunmatik kapalı');
    ok(!m.parallaxEnabled({ reducedMotion: false, coarsePointer: false, width: 800 }), 'dar ekran kapalı');
  });

  /* ── Bugün ne çalışayım? ───────────────────────────────── */
  const techs = [
    { id: 'a', name: 'Ayak içi pas', cat: 'Pas', lv: 1, pos: ['bek', 'stoper'] },
    { id: 'b', name: 'Sert şut', cat: 'Şut', lv: 2, pos: ['santrfor'] },
    { id: 'c', name: 'İlk temas', cat: 'Kontrol', lv: 2, pos: ['kanat', 'santrfor'] },
    { id: 'd', name: 'Çalım', cat: 'Çalım', lv: 3, pos: ['kanat'] },
    { id: 'e', name: 'Plase', cat: 'Şut', lv: 3, pos: ['santrfor', 'on-numara'] },
    { id: 'f', name: 'Uzak teknik', cat: 'Kafa', lv: 5, pos: [] },
  ];
  const empty = { level: 2, positions: [], program: null, logs: [], lastVisit: null, practiced: {}, dayIndex: 1, dateKey: '2026-10-17', techs };

  await test('Bugün: boş durumda seviyeye (±1) uygun, güne göre sabit bir teknik önerir', async () => {
    const a = t.pickToday(empty);
    ok(a.kind === 'technique' && a.href.startsWith('/teknikler/') && a.href.endsWith('/'), 'teknik önerisi: ' + JSON.stringify(a));
    const id = a.href.split('/')[2];
    ok(['a', 'b', 'c', 'd'].includes(id), 'seviye 2 için lv 1–3 dışı öneri: ' + id);
    ok(id !== 'f', 'lv 5 teknik seviye 2 için önerilmemeli');
    ok(JSON.stringify(t.pickToday(empty)) === JSON.stringify(a), 'aynı gün aynı öneri');
    const ids = new Set();
    for (let d = 1; d <= 28; d++) ids.add(t.pickToday({ ...empty, dateKey: `2026-11-${String(d).padStart(2, '0')}` }).href);
    ok(ids.size >= 2, 'günler arasında çeşitlilik olmalı');
    ok(a.chips.length >= 1 && a.chips.every((c) => typeof c === 'string' && c), 'etiketler');
  });

  await test('Bugün: seviye değişince havuz değişir; pozisyon (≥3 eşleşme) önceliklidir; en az çalışılan seçilir', async () => {
    const lv5 = t.pickToday({ ...empty, level: 5 });
    ok(lv5.href === '/teknikler/f/', 'seviye 5 → yalnızca lv 4–5: ' + lv5.href);
    const lv1 = t.pickToday({ ...empty, level: 1 });
    ok(['a', 'b', 'c'].includes(lv1.href.split('/')[2]), 'seviye 1 → lv 1–2');
    const many = [
      ...techs,
      { id: 'g', name: 'Gol vuruşu', cat: 'Şut', lv: 2, pos: ['santrfor'] },
      { id: 'h', name: 'Dönüş', cat: 'Çalım', lv: 3, pos: ['santrfor'] },
    ];
    for (let d = 1; d <= 20; d++) {
      const p = t.pickToday({ ...empty, techs: many, positions: ['santrfor'], dateKey: `2026-12-${String(d).padStart(2, '0')}` });
      ok(['b', 'c', 'e', 'g', 'h'].includes(p.href.split('/')[2]), 'santrfor dışı öneri: ' + p.href);
    }
    const practiced = { a: { count: 5, last: '2026-10-01' }, b: { count: 3 }, c: { count: 2 } };
    const p = t.pickToday({ ...empty, practiced });
    ok(p.href === '/teknikler/d/', 'hiç çalışılmayan öne çıkmalı: ' + p.href);
  });

  await test('Bugün: yarım kalan antrenman her şeyden önce gelir ve ilerleme oranını gösterir', async () => {
    const logs = [
      { id: 'x', status: 'done', title: 'Eski', startedAt: '2026-10-10T10:00:00Z', items: [], progress: {} },
      { id: 'y', status: 'active', title: 'Sürat günü', startedAt: '2026-10-17T09:00:00Z', items: [{ key: 'k1', sets: 4 }, { key: 'k2', sets: 4 }], progress: { k1: 4, k2: 1 } },
    ];
    const p = t.pickToday({ ...empty, logs, lastVisit: { path: '/teknikler/a/', title: 'X', at: '' } });
    ok(p.kind === 'continue-session' && p.title === 'Sürat günü', 'yarım kalan: ' + JSON.stringify(p));
    ok(Math.abs(p.progress - 5 / 8) < 1e-9, 'ilerleme oranı ' + p.progress);
    ok(/5\/8/.test(p.detail), 'ayrıntıda set sayısı yazmalı');
    const over = t.pickToday({ ...empty, logs: [{ status: 'active', title: 'T', startedAt: 'z', items: [{ key: 'k', sets: 3 }], progress: { k: 99 } }] });
    ok(over.progress === 1, 'taşan ilerleme 1 ile sınırlanmalı');
  });

  await test('Bugün: program varsa bugünün oturumu, bitince sıradaki; günü olmayan program atlanır', async () => {
    const program = {
      sessions: [
        { id: 's1', title: 'Alt vücut', focus: 'alt-vucut', env: 'salon', minutes: 55, day: 1 },
        { id: 's2', title: 'Sürat', focus: 'hiz-ceviklik', env: 'saha', minutes: 40, day: 3 },
      ],
    };
    const p1 = t.pickToday({ ...empty, program, dayIndex: 1 });
    ok(p1.kind === 'todays-session' && p1.title === 'Alt vücut' && p1.chips.includes('55 dk'), 'bugünün oturumu: ' + JSON.stringify(p1));
    const done = [{ sessionId: 's1', status: 'done', date: '2026-10-17', title: 'Alt vücut', startedAt: 'a', items: [], progress: {} }];
    const p2 = t.pickToday({ ...empty, program, logs: done, dayIndex: 1 });
    ok(p2.kind === 'next-session' && p2.title === 'Sürat' && p2.chips.includes('Perşembe'), 'bitince sıradaki: ' + JSON.stringify(p2));
    const p3 = t.pickToday({ ...empty, program, dayIndex: 2 });
    ok(p3.kind === 'next-session' && p3.title === 'Sürat', 'araya giren gün');
    const p4 = t.pickToday({ ...empty, program, dayIndex: 4 });
    ok(p4.kind === 'next-session' && p4.title === 'Alt vücut', 'hafta sonu sarar: ' + p4.title);
    const noDays = t.pickToday({ ...empty, program: { sessions: [{ id: 'z', title: 'Günsüz', focus: 'teknik', env: 'ev', minutes: 30, day: null }] } });
    ok(noDays.kind === 'technique', 'günü olmayan program teknik önerisine düşer');
  });

  await test('Bugün: son ziyaret yalnızca geçerli iç yol ise önerilir; ana sayfa ve bozuk yol atlanır', async () => {
    const p = t.pickToday({ ...empty, lastVisit: { path: '/taktik/pres/', title: 'Pres', at: '2026-10-16T10:00:00Z' } });
    ok(p.kind === 'continue-visit' && p.href === '/taktik/pres/' && p.title === 'Pres', 'devam et: ' + JSON.stringify(p));
    for (const bad of [{ path: '/', title: 'Ana' }, { path: 'http://x.example/', title: 'Dış' }, { path: '/a/', title: '' }, { path: 5, title: 'x' }, 'str', 7, [], null]) {
      ok(t.pickToday({ ...empty, lastVisit: bad }).kind === 'technique', 'geçersiz son ziyaret kabul edildi: ' + JSON.stringify(bad));
    }
  });

  await test('Bugün: bozuk/yarım veriyle asla istisna fırlatmaz ve her zaman geçerli bir öneri döner', async () => {
    const junk = [undefined, null, 0, 'x', [], {}, { sessions: 'z' }, { sessions: [null, 3, { id: 1 }, { id: 'a', title: 'T', day: 'Pzt' }] }, [null, 4, 'x', { status: 'active', items: 'q', progress: 3 }]];
    for (const program of junk) {
      for (const logs of junk) {
        for (const practiced of [undefined, 5, [], { a: 'x' }, { a: { count: -4 } }]) {
          const p = t.pickToday({ level: 'abc', positions: 12, program, logs, lastVisit: program, practiced, dayIndex: 99, dateKey: '', techs });
          ok(p && typeof p.title === 'string' && p.title && typeof p.href === 'string' && p.href.startsWith('/') && Array.isArray(p.chips), 'geçersiz sonuç: ' + JSON.stringify(p));
        }
      }
    }
    const none = t.pickToday({ ...empty, techs: [] });
    ok(none.kind === 'start' && none.href === '/teknikler/', 'teknik yoksa başlangıç önerisi');
    ok(t.safeLevel('x') === 2 && t.safeLevel(99) === 5 && t.safeLevel(-3) === 1 && t.safeLevel(3.4) === 3, 'seviye sınırlama');
    ok(t.mondayIndex(0) === 6 && t.mondayIndex(1) === 0 && t.mondayIndex(6) === 5, 'pazartesi indeksi');
  });
};
