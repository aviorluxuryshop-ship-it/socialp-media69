// Teknik hareket gösterimleri ("Hareketi izle"): kinematik değişmezler, temas bölgesi uyumu, zaman çizelgesi, oynatıcı mantığı.
// Her kayıtlı hareket (data/technique-motion/index.ts) için otomatik çalışır; yeni hareket eklemek testi de kapsar.
export const include = [
  'lib/motion/timeline.ts',
  'lib/motion/check.ts',
  'lib/motion/author.ts',
  'lib/motion/player.ts',
  'data/technique-motion/index.ts',
  'data/technique-motion/validate.ts',
  'lib/boot.ts',
  'data/index.ts',
];

const ALL_ZONES = ['ic', 'dis', 'ustTam', 'ustDis', 'ustIc', 'uc', 'topuk', 'taban'];
const INSIDE = ['ic', 'ustIc'];
const OUTSIDE = ['ustDis', 'dis'];

export default async ({ ok, test, load }) => {
  const tl = await load('lib/motion/timeline.js');
  const rig = await load('lib/motion/rig.js');
  const check = await load('lib/motion/check.js');
  const player = await load('lib/motion/player.js');
  const author = await load('lib/motion/author.js');
  const reg = await load('data/technique-motion/index.js');
  const val = await load('data/technique-motion/validate.js');
  const boot = await load('lib/boot.js');
  const data = await load('data/index.js');
  const { MOTIONS } = reg;
  const { TECH_BY_ID } = data;
  const ids = Object.keys(MOTIONS);
  const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const mut = (m, patch) => ({ ...m, ...patch });

  await test('Hareket: kayıt defteri dolu, anahtarlar gerçek tekniklerdir ve doğrulayıcı hatasızdır', async () => {
    ok(ids.includes('ilk-temas'), 'ilk-temas hareketi kayıtlı değil');
    for (const id of ids) {
      ok(TECH_BY_ID[id], `${id}: data/techniques içinde yok`);
      ok(MOTIONS[id].id === id, `${id}: id uyuşmuyor`);
    }
    const problems = val.validateMotions(MOTIONS, TECH_BY_ID);
    ok(problems.length === 0, problems.join(' | '));
    val.assertMotions(MOTIONS, TECH_BY_ID);
  });

  await test('Hareket: vurgulanan bölgeler tekniğin foot[] listesiyle aynı kümedir; temas bölgesi onlardan biridir', async () => {
    for (const id of ids) {
      const m = MOTIONS[id];
      const t = TECH_BY_ID[id];
      if (m.zones === 'alin') {
        ok(t.cat === 'kafa' && m.contact === 'alin', `${id}: alın hareketi kafa tekniği olmalı`);
        continue;
      }
      const foot = [...new Set(t.foot ?? [])].sort().join(',');
      const zs = [...new Set(m.zones)].sort().join(',');
      ok(foot.length > 0 && zs === foot, `${id}: zones (${zs}) ≠ foot[] (${foot})`);
      ok(m.zones.length === new Set(m.zones).size, `${id}: zones yinelenen bölge içeriyor`);
      ok(m.zones.includes(m.contact), `${id}: temas bölgesi ${m.contact} zones içinde değil`);
      for (const z of m.zones) ok(boot.ZONES[z]?.label, `${id}: ${z} için BootMap bölge adı yok`);
    }
  });

  await test('Hareket: iç yüz ↔ dış yüz karışmaz (kavis yönü temas yüzeyiyle uyumlu)', async () => {
    for (const id of ids) {
      const m = MOTIONS[id];
      if (m.curve === 'sol') ok(INSIDE.includes(m.contact), `${id}: sola kavis iç yüz/iç ayak üstüyle yapılır, temas ${m.contact}`);
      if (m.curve === 'sag') ok(OUTSIDE.includes(m.contact), `${id}: sağa kavis dış yüz/üst dışla (trivela) yapılır, temas ${m.contact}`);
      if (INSIDE.includes(m.contact) && m.curve) ok(m.curve === 'sol', `${id}: iç yüz temasında kavis sola olmalı`);
      if (OUTSIDE.includes(m.contact) && m.curve) ok(m.curve === 'sag', `${id}: dış yüz temasında kavis sağa olmalı`);
    }
  });

  await test('Hareket: temas anında top, bildirilen bölgeye en yakın yüzeydedir (başka bölgeye değil)', async () => {
    for (const id of ids) {
      const m = MOTIONS[id];
      if (m.contact === 'alin') continue;
      const c = tl.compileMotion(m);
      const f = tl.frameAt(m, m.tc, c);
      const raw = rig.ballAt(c.ball, m.tc);
      const ball = [raw.x, raw.y, raw.z];
      const own = rig.zoneContact(f.sk.near.foot, m.contact);
      const dOwn = dist3(ball, [own.ball[0], own.ball[1], own.bz]);
      ok(dOwn <= 0.03, `${id}: top temas bölgesinden ${dOwn.toFixed(3)} m uzakta`);
      for (const z of ALL_ZONES) {
        if (z === m.contact) continue;
        const k = rig.zoneContact(f.sk.near.foot, z);
        const d = dist3(ball, [k.ball[0], k.ball[1], k.bz]);
        ok(d > dOwn + 0.012, `${id}: top ${m.contact} yerine ${z} bölgesine daha yakın ya da eşit (${dOwn.toFixed(3)} / ${d.toFixed(3)})`);
      }
    }
  });

  await test('Hareket: süre 1,8–3,5 sn, evreler sıralı, temas Temas evresinde; vurgu temasta tepe yapar, uçlarda sönük', async () => {
    for (const id of ids) {
      const m = MOTIONS[id];
      ok(m.dur >= 1.8 && m.dur <= 3.5, `${id}: süre ${m.dur}`);
      const [b0, b1, b2, b3] = tl.phaseBounds(m);
      ok(b0 === 0 && b0 < b1 && b1 < m.tc && m.tc < b2 && b2 < b3 && b3 === m.dur, `${id}: evre sınırları sıralı değil (${[b0, b1, b2, b3]})`);
      ok(tl.phaseAt(m, 0) === 'hazirlik' && tl.phaseAt(m, m.tc) === 'temas' && tl.phaseAt(m, m.dur) === 'takip', `${id}: evre eşlemesi`);
      let last = 0;
      const order = { hazirlik: 0, temas: 1, takip: 2 };
      for (let t = 0; t <= m.dur; t += 0.02) {
        const o = order[tl.phaseAt(m, t)];
        ok(o >= last, `${id}: evre geri gitti t=${t}`);
        last = o;
      }
      ok(tl.glowAt(m, m.tc) > 0.99, `${id}: temasta vurgu tam değil (${tl.glowAt(m, m.tc)})`);
      ok(tl.glowAt(m, 0) === 0 && tl.glowAt(m, m.dur) === 0, `${id}: vurgu başta/sonda sönük olmalı`);
      const [w0, w1] = tl.windowOf(m);
      ok(tl.glowAt(m, m.tc - w0 - 0.05) === 0 && tl.glowAt(m, m.tc + w1 + 0.2) === 0, `${id}: vurgu temas penceresi dışında yanıyor`);
      const st = tl.stripTimes(m);
      ok(st.length === 3 && st[0] === 0 && st[1] === m.tc && st[2] > st[1] && st[2] < m.dur, `${id}: sabit şerit zamanları ${st}`);
    }
  });

  await test('Hareket: segment uzunlukları sabit, diz ters bükülmez, ayak yerin altına inmez, basma ayağı yerde ve kaymaz', async () => {
    for (const id of ids) {
      const m = MOTIONS[id];
      const c = tl.compileMotion(m);
      let maxLen = 0;
      let minFlex = 99;
      let minLow = 99;
      let supportHover = 0;
      let supportSlide = 0;
      const ref = tl.frameAt(m, m.tc, c).sk.far.ankle[0];
      const [w0, w1] = tl.windowOf(m);
      for (let t = 0; t <= m.dur + 1e-9; t += 1 / 60) {
        const f = tl.frameAt(m, Math.min(t, m.dur), c);
        for (const leg of [f.sk.near, f.sk.far]) {
          maxLen = Math.max(maxLen, Math.abs(Math.hypot(leg.knee[0] - leg.hip[0], leg.knee[1] - leg.hip[1]) - rig.SEG.thigh), Math.abs(Math.hypot(leg.ankle[0] - leg.knee[0], leg.ankle[1] - leg.knee[1]) - rig.SEG.shank));
          minFlex = Math.min(minFlex, leg.flex);
          minLow = Math.min(minLow, rig.footLowest(leg.foot));
          ok(leg.over <= 0.004, `${id}: t=${t.toFixed(2)} bacak erişemiyor (${leg.over})`);
        }
        const a = f.sk.armN;
        maxLen = Math.max(maxLen, Math.abs(Math.hypot(a.elbow[0] - a.shoulder[0], a.elbow[1] - a.shoulder[1]) - rig.SEG.upper));
        if (!m.airborne && t >= m.tc - w0 && t <= m.tc + w1) {
          supportHover = Math.max(supportHover, rig.footLowest(f.sk.far.foot));
          supportSlide = Math.max(supportSlide, Math.abs(f.sk.far.ankle[0] - ref));
        }
      }
      ok(maxLen < 1e-6, `${id}: segment uzunluğu değişiyor (${maxLen})`);
      ok(minFlex >= -0.5, `${id}: diz ters bükülüyor (${minFlex}°)`);
      ok(minLow >= -0.006, `${id}: ayak yerin altına iniyor (${minLow} m)`);
      ok(supportHover <= 0.004, `${id}: basma ayağı havada (${supportHover} m)`);
      ok(supportSlide <= 0.008, `${id}: basma ayağı kayıyor (${supportSlide} m)`);
    }
  });

  await test('Hareket: sayısal değerler sonlu (NaN yok), top yerin altına inmez, gövde eğimi ve denge doğal, baş topu izler', async () => {
    for (const id of ids) {
      const m = MOTIONS[id];
      const probs = check.checkMotion(m);
      ok(probs.length === 0, probs.join(' | '));
      const c = tl.compileMotion(m);
      for (let t = 0; t <= m.dur + 1e-9; t += 0.05) {
        const f = tl.frameAt(m, Math.min(t, m.dur), c);
        ok(Number.isFinite(f.ball.x + f.ball.y + f.ball.z + f.ball.r + f.sk.head[0] + f.sk.head[1]), `${id}: t=${t} NaN`);
        ok(f.ball.y >= rig.SEG.ball - 0.012, `${id}: top yerin altında t=${t}`);
        ok(f.sk.trunkDeg >= -12 && f.sk.trunkDeg <= 40, `${id}: gövde eğimi ${f.sk.trunkDeg}°`);
      }
    }
  });

  await test('Hareket: kare hesabı deterministik; t aralık dışında kenara sıkışır', async () => {
    for (const id of ids) {
      const m = MOTIONS[id];
      const a = tl.frameAt(m, 1.234);
      const b = tl.frameAt(m, 1.234);
      ok(JSON.stringify(a) === JSON.stringify(b), `${id}: aynı t farklı kare`);
      ok(tl.frameAt(m, -5).t === 0 && tl.frameAt(m, m.dur + 5).t === m.dur, `${id}: t sıkıştırılmıyor`);
    }
  });

  await test('Hareket: açıklamalar üç evre için Türkçe, boş değil ve garanti/tıbbi iddia içermez', async () => {
    for (const id of ids) {
      const m = MOTIONS[id];
      ok(m.caps.length === 3 && m.caps.every((s) => s.trim().length >= 30), `${id}: caps eksik`);
      ok(/[ğüşıöçİ]/.test(m.caps.join(' ')), `${id}: açıklamalarda Türkçe karakter yok`);
      for (const s of [...m.caps, m.label, m.note ?? '']) {
        ok(!/garanti|kesinlikle|%\s?\d|tedavi|iyileştir|ağrıyı|sakatlığı önler/i.test(s), `${id}: yasak ifade: ${s}`);
      }
    }
  });

  await test('İlk temas: iç yüz amortisi — ayak temasta geri çekilir, top yapışık kalır, sonra oyuncunun önüne bırakılır', async () => {
    const m = MOTIONS['ilk-temas'];
    ok(m.zones.length === 3 && m.contact === 'ic', 'ilk-temas: zones/contact');
    const c = tl.compileMotion(m);
    const at = (t) => tl.frameAt(m, t, c);
    // amorti: ayak, temastan 0,14 sn sonra temas anındakinden en az 4 cm geridedir ve topla birlikte hareket eder (carry)
    const a0 = at(m.tc).sk.near.ankle[0];
    const a1 = at(m.tc + 0.14).sk.near.ankle[0];
    ok(a0 - a1 >= 0.04, `ayak geri çekilmiyor (${(a0 - a1).toFixed(3)} m)`);
    ok(m.carry && m.carry[0] <= m.tc + 1e-9 && m.carry[1] - m.carry[0] >= 0.25, 'carry aralığı temas anından başlamalı');
    for (let t = m.carry[0]; t <= m.carry[1]; t += 0.02) {
      const f = at(t);
      const k = rig.zoneContact(f.sk.near.foot, 'ic');
      ok(Math.abs(f.ball.x - k.ball[0]) < 0.005 && Math.abs(f.ball.y - k.ball[1]) < 0.005, `top t=${t.toFixed(2)} iç yüze yapışık değil`);
      ok(f.ball.y > 0.1 && f.ball.y < 0.125, `top yerden kopuyor/batıyor t=${t.toFixed(2)} (${f.ball.y.toFixed(3)})`);
    }
    // top yerde ve yavaşlayarak gelir
    const speed = (t) => Math.abs(at(t + 0.02).ball.x - at(t - 0.02).ball.x) / 0.04;
    ok(at(0.4).ball.x > at(1.0).ball.x && at(1.0).ball.x > at(m.tc - 0.05).ball.x, 'top oyuncuya doğru gelmiyor');
    ok(speed(m.tc - 0.1) < speed(0.3), 'gelen top yavaşlamıyor');
    // bırakıştan sonra top oyuncunun önüne (≈ 1–2 adım) gider, ayaklardan her an ileridedir ve soluna (z < 0) kayar
    const end = at(m.dur);
    const ahead = end.ball.x - end.sk.pelvis[0];
    ok(ahead > 0.5 && ahead < 2, `top oyuncunun ${ahead.toFixed(2)} m önünde (0,5–2 m beklenir)`);
    ok(end.ball.z < -0.5, `top oyuncunun soluna (baskının tersine) gitmiyor (z=${end.ball.z.toFixed(2)})`);
    const press = m.plan?.press;
    ok(press && press[1] > 0 && end.ball.z < 0, 'baskı oyuncunun sağında, top solunda olmalı');
    for (let t = m.carry[1] + 0.25; t <= m.dur; t += 0.05) {
      const f = at(t);
      const toeTip = Math.max(...[f.sk.near, f.sk.far].map((l) => rig.footPoint(l.foot, 0.234, -0.03, 0)[0]));
      ok(f.ball.x - rig.SEG.ball > toeTip - 0.02, `top ayağın önünde değil t=${t.toFixed(2)} (top sol kenarı ${(f.ball.x - 0.11).toFixed(2)}, burun ${toeTip.toFixed(2)})`);
    }
    // top yuvarlanırken döner: sola yuvarlanan top saat yönünün tersine (r artar), bırakıştan sonra ileri giden top saat yönünde (r azalır)
    ok(c.ball && rig.ballAt(c.ball, 1.0).r > rig.ballAt(c.ball, 0).r + 100, 'gelen top yuvarlanırken dönmüyor');
    ok(rig.ballAt(c.ball, m.dur).r < rig.ballAt(c.ball, m.carry[1] + 0.01).r - 50, 'bırakılan top ileri yuvarlanırken dönmüyor');
    // baş: temasa doğru topa bakar, takipte kalkar
    ok(at(m.tc).sk.headDeg > at(m.dur - 0.3).sk.headDeg + 15, 'baş takipte kalkmıyor');
  });

  await test('Hareket: kavis yönü — sola kavis saat yönünün tersi, sağa kavis saat yönü (sağ ayak), z yolu buna uyar', async () => {
    const base = MOTIONS['ilk-temas'];
    // ilk-temas'ı bir pas gibi kullanmadan, yalnızca kavis üretecini sınamak için ileri giden bir top yolu
    const flat = {
      ...base,
      plan: undefined,
      carry: undefined,
      ball: [
        { t: 0, x: 1.3, y: 0.11 },
        { t: base.tc, x: 1.23, y: 0.11 },
        { t: base.tc + 0.05, x: 1.4, y: 0.11, cut: true },
        { t: base.tc + 0.8, x: 4.4, y: 0.11 },
        { t: base.dur, x: 7.4, y: 0.11 },
      ],
    };
    const heading = (m) => {
      const c = tl.compileMotion(m);
      const pts = [];
      for (let t = m.tc + 0.1; t <= m.dur; t += 0.05) {
        const b = rig.ballAt(c.ball, t);
        pts.push([b.x, b.z]);
      }
      const psi = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI; // + sağa
      return { first: psi(pts[0], pts[2]), last: psi(pts[pts.length - 3], pts[pts.length - 1]), maxZ: Math.max(...pts.map((p) => p[1])), minZ: Math.min(...pts.map((p) => p[1])) };
    };
    const left = heading({ ...flat, curve: 'sol' });
    const right = heading({ ...flat, curve: 'sag' });
    ok(left.last < left.first - 3, `sol kavis yön açısı azalmıyor (${left.first.toFixed(1)} → ${left.last.toFixed(1)})`);
    ok(right.last > right.first + 3, `sağ kavis yön açısı artmıyor (${right.first.toFixed(1)} → ${right.last.toFixed(1)})`);
    ok(left.maxZ > 0.1 && right.minZ < -0.1, 'kavis önce ters yöne açılmalı (sol: sağa, sağ: sola)');
    ok(tl.hasPlan({ ...flat, curve: 'sol' }) && !tl.hasPlan({ ...flat, ball: flat.ball }), 'üstten bakış yalnız curve/plan/z varken açılır');
  });

  await test('Doğrulayıcı: bozuk hareketi reddeder (bölge uyumsuzluğu, süre, NaN, diz, yer, kayma, top, bilinmeyen teknik)', async () => {
    const m = MOTIONS['ilk-temas'];
    const t = TECH_BY_ID['ilk-temas'];
    const bad = (patch, re, tech = t) => {
      const p = val.validateMotion('ilk-temas', mut(m, patch), tech);
      ok(p.some((x) => re.test(x)), `beklenen hata ${re} yok: ${p.join(' | ') || '(hiç)'}`);
    };
    ok(val.validateMotion('ilk-temas', m, t).length === 0, 'geçerli veri reddedildi');
    bad({ zones: ['ic'] }, /foot\[\]/);
    bad({ zones: ['ic', 'dis', 'ustDis'] }, /foot\[\]/);
    bad({ contact: 'ustDis' }, /contact/);
    bad({ dur: 5 }, /süre/);
    bad({ dur: 1.2 }, /süre/);
    bad({ tc: 0.2 }, /tc/);
    bad({ caps: ['a', 'b', 'c'] }, /caps/);
    bad({ id: 'baska' }, /id farklı/);
    ok(val.validateMotion('yok-boyle-teknik', mut(m, { id: 'yok-boyle-teknik' }), undefined).some((x) => /böyle bir teknik yok/.test(x)), 'bilinmeyen teknik kabul edildi');
    ok(val.validateMotion('ilk-temas', mut(m, { zones: 'alin', contact: 'alin' }), t).some((x) => /kafa/.test(x)), 'alın hareketi kafa dışı teknikte kabul edildi');
    // kinematik bozulmalar
    const nan = mut(m, { keys: m.keys.map((k, i) => (i === 5 ? { ...k, p: { ...k.p, px: NaN } } : k)) });
    ok(check.checkMotion(nan).some((x) => /NaN/.test(x)), 'NaN yakalanmadı');
    const sink = mut(m, { keys: m.keys.map((k) => ({ ...k, p: { ...k.p, f1: 0.05 } })) });
    ok(check.checkMotion(sink).some((x) => /yerin altına/.test(x)), 'yere batma yakalanmadı');
    const far = mut(m, { keys: m.keys.map((k) => ({ ...k, p: { ...k.p, f0: k.p.px + 0.9 } })) });
    ok(check.checkMotion(far).some((x) => /erişemeyeceği/.test(x)), 'erişilemeyen hedef yakalanmadı');
    const slide = mut(m, { keys: m.keys.map((k) => (k.t >= 1.3 && k.t <= 1.8 ? { ...k, p: { ...k.p, f0: 0.8 + (k.t - 1.3) * 0.2 } } : k)) });
    ok(check.checkMotion(slide).some((x) => /kayıyor/.test(x)), 'kayan basma ayağı yakalanmadı');
    const hover = mut(m, { keys: m.keys.map((k) => (k.t >= 1.3 && k.t <= 1.8 ? { ...k, p: { ...k.p, f1: 0.15 } } : k)) });
    ok(check.checkMotion(hover).some((x) => /yerden kopuk/.test(x)), 'havadaki basma ayağı yakalanmadı');
    const ballOff = mut(m, { ball: m.ball.map((k) => (k.t === 1.5 ? { ...k, x: k.x + 0.2 } : k)) });
    ok(check.checkMotion(ballOff).some((x) => /temas bölgesinden/.test(x)), 'temas bölgesinden kopuk top yakalanmadı');
    const under = mut(m, { ball: m.ball.map((k) => (k.t === 2.5 ? { ...k, y: 0.0 } : k)) });
    ok(check.checkMotion(under).some((x) => /yerin altına/.test(x)), 'yere batan top yakalanmadı');
    const lean = mut(m, { keys: m.keys.map((k) => (k.t === 1.5 ? { ...k, p: { ...k.p, tr: 70 } } : k)) });
    ok(check.checkMotion(lean).some((x) => /gövde eğimi/.test(x)), 'aşırı gövde eğimi yakalanmadı');
    const gaze = mut(m, { keys: m.keys.map((k) => (k.t >= 1.2 && k.t <= 1.6 ? { ...k, p: { ...k.p, hd: -60 } } : k)) });
    ok(check.checkMotion(gaze).some((x) => /baş topa dönük/.test(x)), 'topa bakmayan baş yakalanmadı');
    // basma ayağı doğrulaması havada olan harekette (airborne) uygulanmaz
    ok(!check.checkMotion(mut(hover, { airborne: true })).some((x) => /yerden kopuk/.test(x)), 'airborne hareket basma ayağından muaf olmalı');
  });

  await test('Oynatıcı mantığı: zaman ilerler, hızla ölçeklenir, bitişte bekler ve başa sarar; biçimler Türkçe', async () => {
    const dur = 3.2;
    let c = { t: 0, hold: 0 };
    c = player.advance(c, 0.5, 1, dur);
    ok(Math.abs(c.t - 0.5) < 1e-9, '1× ilerleme');
    c = player.advance({ t: 0, hold: 0 }, 0.5, 0.5, dur);
    ok(Math.abs(c.t - 0.25) < 1e-9, '0,5× ilerleme');
    c = player.advance({ t: 3.1, hold: 0 }, 0.3, 1, dur);
    ok(c.t === dur && c.hold === player.HOLD_SEC, 'bitişte son karede bekleme başlamalı');
    c = player.advance(c, player.HOLD_SEC - 0.1, 1, dur);
    ok(c.t === dur && c.hold > 0, 'bekleme sürerken zaman ilerlememeli');
    c = player.advance(c, 0.2, 1, dur);
    ok(c.t === 0 && c.hold === 0, 'bekleme bitince başa sarmalı');
    ok(player.fmtSec(1.5) === '1,50' && player.fmtSec(0) === '0,00' && player.fmtSec(3.2, 1) === '3,2', 'Türkçe ondalık biçim');
    for (const id of ids) {
      const m = MOTIONS[id];
      const bar = player.barModel(m);
      ok(bar.segs.length === 3 && bar.segs[0].from === 0 && Math.abs(bar.segs[2].to - 1) < 1e-9, `${id}: evre çubuğu`);
      ok(bar.segs.every((s, i) => s.to > s.from && (i === 0 || Math.abs(s.from - bar.segs[i - 1].to) < 1e-9)), `${id}: evre çubuğu bölmeleri bitişik değil`);
      ok(bar.tc > bar.segs[1].from && bar.tc < bar.segs[1].to, `${id}: temas anı Temas bölmesinde değil`);
      const sf = player.stripFrames(m);
      ok(sf.map((s) => s.phase).join() === 'hazirlik,temas,takip' && sf.every((s) => s.t >= 0 && s.t <= m.dur), `${id}: şerit kareleri`);
    }
  });

  await test('Yazım yardımcısı: kısmi anahtarlar önceki değeri korur; groundY topuk kalkışında ayağı yere oturtur', async () => {
    const keys = author.poseKeys([{ t: 0, px: 1 }, { t: 1, py: 0.9 }, { t: 2, tr: 7 }]);
    ok(keys.length === 3 && keys[2].p.px === 1 && keys[2].p.py === 0.9 && keys[1].p.tr === author.STAND.tr, 'carry-forward çalışmıyor');
    ok(author.groundY(0) === 0.099, 'düz ayak bileği 0,099 olmalı');
    ok(author.groundY(-24) > 0.14 && author.groundY(15) > 0.1 && author.groundY(15) < 0.115, 'groundY değerleri');
    // bu bilek yüksekliğinde ayağın en alçak noktası ≈ 0
    const leg = rig.solveLegIK([0, 0.95], 0.1, author.groundY(-24), -24, 8, 1);
    ok(Math.abs(rig.footLowest(leg.foot)) < 0.004, `groundY(-24) ayağı yere oturtmuyor (${rig.footLowest(leg.foot)})`);
  });
};
