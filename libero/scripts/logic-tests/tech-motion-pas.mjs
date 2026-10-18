// Pas hareketleri (yerden iç yüz pas, iç yüzle kavisli pas, trivela pası) ve ortak yardımcıları (nearIkToFk, flightKeys, groundYRigid):
// bölge ↔ teknik uyumu, iç yüz ↔ dış yüz ayrımı, kavis yönü, ayak açısı farkı, top uçuşu, ayak bileği aralığı.
// Genel denetimler (kinematik, temas anı, süre vb.) tech-motion.mjs içinde kayıt defteri üzerinden otomatik çalışır; burada yalnızca
// bu üç hareketin ayrımına ve yeni yardımcılara bakılır.
export const include = [
  'lib/motion/timeline.ts',
  'lib/motion/author.ts',
  'lib/motion/author-fk.ts',
  'lib/motion/flight.ts',
  'data/technique-motion/index.ts',
  'data/technique-motion/validate.ts',
  'lib/boot.ts',
  'data/index.ts',
];

const INSIDE = ['ic', 'ustIc'];
const OUTSIDE = ['ustDis', 'dis'];

export default async ({ ok, test, load }) => {
  const tl = await load('lib/motion/timeline.js');
  const rig = await load('lib/motion/rig.js');
  const author = await load('lib/motion/author.js');
  const afk = await load('lib/motion/author-fk.js');
  const flight = await load('lib/motion/flight.js');
  const reg = await load('data/technique-motion/index.js');
  const boot = await load('lib/boot.js');
  const data = await load('data/index.js');
  const { MOTIONS } = reg;
  const { TECH_BY_ID } = data;
  const PAS = ['yerden-ic-yuz-pas', 'kavisli-pas', 'trivela-pasi'];
  const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const sortedSet = (a) => [...new Set(a)].sort().join(',');
  const contactBall = (m) => {
    const c = tl.compileMotion(m);
    const f = tl.frameAt(m, m.tc, c);
    const raw = rig.ballAt(c.ball, m.tc);
    return { c, f, ball: [raw.x, raw.y, raw.z] };
  };

  await test('Pas hareketleri: üçü de kayıtlı; bölgeler tekniğin foot[] kümesidir ve BootMap adlarıyla gösterilir', async () => {
    for (const id of PAS) {
      const m = MOTIONS[id];
      ok(m, `${id}: hareket kayıtlı değil`);
      ok(m.id === id && TECH_BY_ID[id], `${id}: kimlik/teknik`);
      ok(sortedSet(m.zones) === sortedSet(TECH_BY_ID[id].foot), `${id}: zones ${sortedSet(m.zones)} ≠ foot[] ${sortedSet(TECH_BY_ID[id].foot)}`);
      ok(m.zones.includes(m.contact), `${id}: temas bölgesi zones içinde değil`);
      for (const z of m.zones) ok(boot.ZONES[z]?.label, `${id}: ${z} için BootMap adı yok`);
    }
    ok(sortedSet(MOTIONS['yerden-ic-yuz-pas'].zones) === 'ic', 'yerden iç yüz pas yalnızca iç yüz');
    ok(sortedSet(MOTIONS['kavisli-pas'].zones) === 'ic,ustIc', 'kavisli pas: iç yüz + üst iç');
    ok(sortedSet(MOTIONS['trivela-pasi'].zones) === 'ustDis', 'trivela: yalnızca üst dış');
    ok(boot.ZONES.ustDis.label.includes('trivela'), 'BootMap üst dış adı trivela yüzeyini söylemeli');
  });

  await test('Pas hareketleri: iç yüz ↔ dış yüz karışmaz — kavisli pas dış bölgeye, trivela iç bölgeye hiç değmez/vurgulanmaz', async () => {
    const kv = MOTIONS['kavisli-pas'];
    const tr = MOTIONS['trivela-pasi'];
    const pas = MOTIONS['yerden-ic-yuz-pas'];
    ok(kv.zones.every((z) => INSIDE.includes(z)) && !kv.zones.some((z) => OUTSIDE.includes(z)), 'kavisli pas bölgeleri iç yüz/üst iç olmalı');
    ok(tr.zones.every((z) => OUTSIDE.includes(z)) && !tr.zones.some((z) => INSIDE.includes(z)), 'trivela bölgeleri dış olmalı');
    ok(pas.zones.every((z) => INSIDE.includes(z)), 'yerden iç yüz pas iç yüz olmalı');
    ok(INSIDE.includes(kv.contact) && OUTSIDE.includes(tr.contact) && INSIDE.includes(pas.contact), 'temas bölgeleri');
    ok(kv.curve === 'sol' && tr.curve === 'sag' && !pas.curve, `kavis yönü: kavisli ${kv.curve}, trivela ${tr.curve}, pas ${pas.curve}`);
    ok(kv.contact !== tr.contact && kv.zones.every((z) => !tr.zones.includes(z)), 'kavisli ve trivela hiçbir bölgeyi paylaşmaz');
    // top, ters taraftaki bölgelere belirgin biçimde uzaktır (temas anında)
    for (const [m, wrong] of [[kv, ['dis', 'ustDis']], [tr, ['ic', 'ustIc']]]) {
      const { f, ball } = contactBall(m);
      const own = rig.zoneContact(f.sk.near.foot, m.contact);
      const dOwn = dist3(ball, [own.ball[0], own.ball[1], own.bz]);
      ok(dOwn <= 0.02, `${m.id}: top temas bölgesinden ${dOwn.toFixed(3)} m uzakta`);
      for (const z of wrong) {
        const k = rig.zoneContact(f.sk.near.foot, z);
        const d = dist3(ball, [k.ball[0], k.ball[1], k.bz]);
        ok(d > 0.08, `${m.id}: top ters taraftaki ${z} bölgesine ${d.toFixed(3)} m yakın`);
      }
    }
    // metin: açıklamalar doğru yüzeyi söyler, ters yüzeyi temas yüzeyi diye anmaz
    ok(kv.caps.join(' ').includes('iç yüz') && /iç bölümü/.test(kv.caps.join(' ')), 'kavisli açıklaması iç yüz/iç bölümü söylemeli');
    ok(/dış bölümü/.test(tr.caps.join(' ')) && !/iç yüz/.test(tr.caps.join(' ')), 'trivela açıklaması dış bölümü söylemeli, iç yüz demeli');
  });

  await test('Kavis hareketleri: top yolu (üstten bakış) kavis yönüne uyar — sola kavis sağa açılıp sola döner, sağa kavis tersi', async () => {
    const withCurve = Object.values(MOTIONS).filter((m) => m.curve);
    ok(withCurve.length >= 2, 'kavisli hareket yok');
    for (const m of withCurve) {
      const c = tl.compileMotion(m);
      const pts = [];
      for (let t = m.tc + 0.05; t <= m.dur; t += 0.05) {
        const b = rig.ballAt(c.ball, t);
        pts.push([b.x, b.z]);
      }
      const z0 = rig.ballAt(c.ball, m.tc).z;
      const head = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI; // + sağa
      const first = head(pts[0], pts[3]);
      const last = head(pts[pts.length - 4], pts[pts.length - 1]);
      const dev = pts.map((p) => p[1] - z0);
      if (m.curve === 'sol') {
        ok(Math.max(...dev) > 0.4, `${m.id}: sola kavis önce sağa açılmalı (en çok ${Math.max(...dev).toFixed(2)} m)`);
        ok(last < first - 25, `${m.id}: sola kavis yön açısı azalmalı (${first.toFixed(1)}° → ${last.toFixed(1)}°)`);
        ok(Math.min(...dev) > -0.25, `${m.id}: sola kavis hedef çizgisinin soluna çok kaçmamalı`);
      } else {
        ok(Math.min(...dev) < -0.4, `${m.id}: sağa kavis önce sola açılmalı (en az ${Math.min(...dev).toFixed(2)} m)`);
        ok(last > first + 25, `${m.id}: sağa kavis yön açısı artmalı (${first.toFixed(1)}° → ${last.toFixed(1)}°)`);
        ok(Math.max(...dev) < 0.25, `${m.id}: sağa kavis hedef çizgisinin sağına çok kaçmamalı`);
      }
      ok(tl.hasPlan(m), `${m.id}: kavisli harekette üstten bakış kutusu açık olmalı`);
      // rakip, topun düz yolu üzerinde ve topun kavisli yolu rakibin kavis tarafından geçer
      // rakip işareti: kavisli pas ve trivela (PAS kümesi) için zorunlu; havadan giden uzun pas gibi diğer kavisli hareketlerde isteğe bağlıdır
      const press = m.plan?.press;
      if (PAS.includes(m.id)) ok(press, `${m.id}: kavisli harekette pas yolundaki rakip işareti olmalı`);
      if (press) {
        ok(Math.abs(press[1] - z0) < 0.05 && press[0] > m.ball[0].x + 1, `${m.id}: rakip topun düz yolunda olmalı`);
        let zAtPress = null;
        for (let i = 1; i < pts.length; i++) if (pts[i - 1][0] <= press[0] && pts[i][0] >= press[0]) zAtPress = pts[i][1];
        ok(zAtPress !== null, `${m.id}: top rakibin hizasına ulaşmıyor`);
        ok(m.curve === 'sol' ? zAtPress - press[1] > 0.3 : press[1] - zAtPress > 0.3, `${m.id}: top rakibin dışından geçmeli (${(zAtPress - press[1]).toFixed(2)} m)`);
      }
    }
    // iki kavis aynalıdır
    const zEnd = (id) => {
      const m = MOTIONS[id];
      const c = tl.compileMotion(m);
      let ext = 0;
      for (let t = m.tc; t <= m.dur; t += 0.05) {
        const d = rig.ballAt(c.ball, t).z - rig.ballAt(c.ball, m.tc).z;
        if (Math.abs(d) > Math.abs(ext)) ext = d;
      }
      return ext;
    };
    ok(zEnd('kavisli-pas') > 0.4 && zEnd('trivela-pasi') < -0.4, 'kavisli sağa, trivela sola şişkin yol çizmeli (aynalı)');
    ok(Math.abs(Math.abs(zEnd('kavisli-pas')) - Math.abs(zEnd('trivela-pasi'))) < 0.15, 'iki kavisin büyüklüğü benzer olmalı');
  });

  await test('Kavisli ↔ trivela: vuran ayağın açısı (ny) belirgin farklıdır — kavisli ayak dışa, trivela içe/düz; ikisi de parmak ucu aşağı', async () => {
    const kv = MOTIONS['kavisli-pas'];
    const tr = MOTIONS['trivela-pasi'];
    const pas = MOTIONS['yerden-ic-yuz-pas'];
    const ny = (m, t) => rig.poseAt(tl.compileMotion(m).pose, t).ny;
    const pitchAt = (m, t) => tl.frameAt(m, t).sk.near.foot.pitch;
    ok(ny(kv, kv.tc) - ny(tr, tr.tc) >= 50, `temasta ny farkı ${ny(kv, kv.tc).toFixed(1)} − ${ny(tr, tr.tc).toFixed(1)}`);
    ok(ny(kv, kv.tc) >= 40, `kavisli: ayak dışa dönük olmalı (ny=${ny(kv, kv.tc).toFixed(1)})`);
    ok(ny(tr, tr.tc) <= -10, `trivela: ayak ucu içe dönük olmalı (ny=${ny(tr, tr.tc).toFixed(1)})`);
    ok(ny(pas, pas.tc) >= 55, `yerden iç yüz pas: ayak ucu dışarı (ny=${ny(pas, pas.tc).toFixed(1)})`);
    // trivela ve kavisli pasta ayak ucu aşağıdadır; düz iç yüz pasta ayak düz
    ok(pitchAt(kv, kv.tc) <= -70 && pitchAt(tr, tr.tc) <= -70, `parmak ucu aşağı: kavisli ${pitchAt(kv, kv.tc).toFixed(0)}°, trivela ${pitchAt(tr, tr.tc).toFixed(0)}°`);
    ok(Math.abs(pitchAt(pas, pas.tc)) < 15, 'düz iç yüz pasta ayak yere paralel olmalı');
    // hazırlıkta ayak, temasa doğru dönmeye başlar: kavisli dışa, trivela içe doğru artan fark
    ok(ny(kv, kv.tc - 0.1) > ny(kv, 0.9) + 30, 'kavisli: ayak temasa doğru dışa dönmeli');
    ok(ny(tr, tr.tc - 0.1) < ny(tr, 0.9) - 15, 'trivela: ayak temasa doğru içe dönmeli');
    // ayak bileği: eklem aralığı doğal (taban eğme ≤ 62°, yük taşıyan ayakta sırt eğme ≤ 40°); tüm kayıtlı hareketler için
    for (const m of Object.values(MOTIONS)) {
      const c = tl.compileMotion(m);
      for (let t = 0; t <= m.dur; t += 1 / 30) {
        const sk = tl.frameAt(m, t, c).sk;
        for (const [nm, leg] of [['yakın', sk.near], ['uzak', sk.far]]) {
          const plantar = leg.shank - leg.foot.pitch;
          ok(plantar <= 62 && plantar >= -40, `${m.id}: t=${t.toFixed(2)} ${nm} ayak bileği aralık dışı (${plantar.toFixed(1)}°)`);
        }
      }
    }
  });

  await test('Pas hareketleri: top uçuşu — yerden pas yerde kalır; kavisli ve trivela pasta top yükselir, ileri gider, yere batmaz', async () => {
    const run = (id) => {
      const m = MOTIONS[id];
      const c = tl.compileMotion(m);
      const pts = [];
      for (let t = 0; t <= m.dur + 1e-9; t += 1 / 60) {
        const b = rig.ballAt(c.ball, t);
        pts.push({ t, x: b.x, y: b.y, z: b.z });
      }
      return { m, pts };
    };
    const g = run('yerden-ic-yuz-pas');
    ok(g.pts.every((p) => p.y > 0.1 && p.y < 0.125), 'yerden pasta top yerde kalmalı');
    ok(g.pts.at(-1).x > g.pts[0].x + 2, 'yerden pasta top en az 2 m ilerlemeli');
    for (const id of ['kavisli-pas', 'trivela-pasi']) {
      const { m, pts } = run(id);
      const after = pts.filter((p) => p.t >= m.tc);
      const apex = Math.max(...after.map((p) => p.y));
      ok(apex > 0.5 && apex < 1.6, `${id}: tepe noktası ${apex.toFixed(2)} m (0,5–1,6 m beklenir)`);
      ok(pts.filter((p) => p.t <= m.tc).every((p) => Math.abs(p.y - 0.11) < 0.005 && Math.abs(p.x - pts[0].x) < 0.005), `${id}: top temasa kadar yerde durmalı`);
      ok(after.every((p, i) => i === 0 || p.x >= after[i - 1].x - 1e-6), `${id}: top ileri gitmeli (x azalmamalı)`);
      ok(pts.every((p) => p.y >= 0.11 - 0.012), `${id}: top yerin altına iniyor`);
      const leave = after.find((p) => p.y > 0.2);
      ok(leave && leave.t - m.tc < 0.25, `${id}: top vuruştan sonra çabuk yükselmeli`);
      ok(after.at(-1).x - after[0].x > 3, `${id}: top en az 3 m ilerlemeli`);
    }
  });

  await test('Yardımcılar: nearIkToFk bileği milimetre altı hatayla izler, erişilemeyen hedefi reddeder; groundYRigid sert ayağı yere oturtur; flightKeys kavis üretir', async () => {
    const ik = author.poseKeys([
      { t: 0, px: 0, py: 0.93, n0: 0.1, n1: 0.099, n2: 0, ny: 8 },
      { t: 0.5, px: 0.3, n0: 0.35, n1: 0.25, n2: -60, ny: -15 },
      { t: 1.0, px: 0.55, n0: 0.7, n1: 0.3, n2: -85, ny: 20 },
      { t: 1.5, px: 0.7, n0: 0.8, n1: 0.15, n2: -10, ny: 8 },
    ]);
    const fk = afk.nearIkToFk(ik);
    ok(fk.length > ik.length * 5 && fk[0].t === 0 && fk.at(-1).t === 1.5 && fk.every((k, i) => i === 0 || k.t > fk[i - 1].t), 'FK anahtarları sıralı ve sık olmalı');
    const tIk = rig.compilePose(ik);
    const tFk = rig.compilePose(fk);
    let worst = 0;
    for (let t = 0; t <= 1.5; t += 0.01) {
      const a = rig.solve(rig.poseAt(tIk, t), ['ik', 'ik']).near;
      const b = rig.solve(rig.poseAt(tFk, t), ['fk', 'ik']).near;
      worst = Math.max(worst, Math.hypot(a.ankle[0] - b.ankle[0], a.ankle[1] - b.ankle[1]), Math.abs(a.foot.pitch - b.foot.pitch) / 100);
    }
    ok(worst < 0.002, `FK çevirisi IK yolundan ${worst.toFixed(4)} m sapıyor`);
    let threw = false;
    try {
      afk.nearIkToFk(author.poseKeys([{ t: 0, px: 0, py: 0.93, n0: 0.1 }, { t: 1, px: 0, n0: 1.5, n1: 0.1 }]));
    } catch {
      threw = true;
    }
    ok(threw, 'erişilemeyen vuran bilek reddedilmeli');
    // sert ayak: bilek yüksekliği, en alçak noktayı tam yere getirir
    for (const p of [-85, -60, -25, 0, 15]) {
      const y = afk.groundYRigid(p);
      const leg = rig.solveLegFK([0, 1], 0, 0, -p, 0, 1);
      const foot = leg.foot;
      const moved = { ...foot, ankle: [0, y] };
      ok(Math.abs(rig.footLowest(moved)) < 0.0015, `groundYRigid(${p}) ayağı yere oturtmuyor (${rig.footLowest(moved).toFixed(4)})`);
    }
    ok(Math.abs(afk.groundYRigid(0) - 0.099) < 0.001, 'düz ayakta bilek 0,099 m');
    // uçuş: sol kavis (bend > 0) önce sağa açılır; çıkış anahtarı cut ve hız taşır; son anahtar z0'a döner
    const base = { t0: 1, x0: 1, y0: 0.11, z0: 0.05, vx: 3, vy: 2, g: 3.4, tEnd: 2.5 };
    const left = flight.flightKeys({ ...base, bend: 0.8 });
    const right = flight.flightKeys({ ...base, bend: -0.8 });
    ok(left[0].cut === true && left[0].vx === 3 && left[0].vy === 2 && left[0].t === 1, 'çıkış anahtarı cut ve hız taşımalı');
    ok(Math.abs(left.at(-1).t - 2.5) < 1e-6 && Math.abs(left.at(-1).z - 0.05) < 1e-9, 'son anahtar hedef çizgisine dönmeli');
    ok(Math.max(...left.map((k) => k.z)) > 0.05 + 0.7 && Math.min(...right.map((k) => k.z)) < 0.05 - 0.7, 'bend işareti yönü belirler');
    ok(left.every((k) => k.y >= 0.11 && k.x >= 1) && Math.max(...left.map((k) => k.y)) > 0.5, 'uçuş yükselir ve yere inmez');
  });
};
