// "Hareketi izle": sert şut, alından kafa vuruşu ve uzun pas hareketlerine özgü doğrulamalar (kayıtlı tüm hareketler için
// genel denetimler scripts/logic-tests/tech-motion.mjs içindedir). Burada her hareketin tekniğin yazılı içeriğiyle uyumu,
// topun gerçekten o bölgeye değmesi ve biyomekanik olarak makul duruşlar (basma ayağı, gövde, bakış, takip) sınanır.
export const include = [
  'lib/motion/timeline.ts',
  'lib/motion/check.ts',
  'lib/motion/author.ts',
  'lib/motion/author-limbs.ts',
  'lib/motion/player.ts',
  'data/technique-motion/index.ts',
  'data/technique-motion/validate.ts',
  'lib/boot.ts',
  'data/index.ts',
];

const ALL_ZONES = ['ic', 'dis', 'ustTam', 'ustDis', 'ustIc', 'uc', 'topuk', 'taban'];
const IDS = ['sert-sut', 'alin-kafa', 'uzun-pas'];
const DEG = Math.PI / 180;

export default async ({ ok, test, load }) => {
  const tl = await load('lib/motion/timeline.js');
  const rig = await load('lib/motion/rig.js');
  const check = await load('lib/motion/check.js');
  const lk = await load('lib/motion/author-limbs.js');
  const reg = await load('data/technique-motion/index.js');
  const val = await load('data/technique-motion/validate.js');
  const boot = await load('lib/boot.js');
  const data = await load('data/index.js');
  const { MOTIONS } = reg;
  const { TECH_BY_ID } = data;
  const comp = {};
  for (const id of IDS) comp[id] = MOTIONS[id] ? tl.compileMotion(MOTIONS[id]) : null;
  const at = (id, t) => tl.frameAt(MOTIONS[id], t, comp[id]);
  const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const rawBall = (id, t) => rig.ballAt(comp[id].ball, t);
  const norm2 = (x, y) => {
    const l = Math.hypot(x, y) || 1;
    return [x / l, y / l];
  };

  /** Bir ayağın yerde durduğu (en alçak nokta ≤ 4 mm, bilek 2 mm'den az oynar) aralıkları: [{ from, to, x }] */
  function stances(id, which) {
    const m = MOTIONS[id];
    const out = [];
    let cur = null;
    const dt = 1 / 60;
    let prevX = null;
    for (let t = 0; t <= m.dur + 1e-9; t += dt) {
      const f = at(id, Math.min(t, m.dur));
      const leg = f.sk[which];
      const low = rig.footLowest(leg.foot);
      const still = prevX !== null && Math.abs(leg.ankle[0] - prevX) < 0.0025;
      prevX = leg.ankle[0];
      if (low <= 0.004 && still) {
        if (!cur) cur = { from: t, to: t, xs: [] };
        cur.to = t;
        cur.xs.push(leg.ankle[0]);
      } else if (cur) {
        out.push(cur);
        cur = null;
      }
    }
    if (cur) out.push(cur);
    return out.filter((s) => s.to - s.from >= 0.08).map((s) => ({ from: s.from, to: s.to, x: s.xs.reduce((a, b) => a + b, 0) / s.xs.length }));
  }

  await test('Hareket B: üç hareket kayıtlı, kimlik ve bölgeler tekniğin foot[] listesiyle aynı; hata veren doğrulayıcı yok', async () => {
    for (const id of IDS) {
      ok(MOTIONS[id] && MOTIONS[id].id === id, `${id}: kayıt defterinde yok`);
      ok(TECH_BY_ID[id], `${id}: teknik yok`);
    }
    ok(val.validateMotions(MOTIONS, TECH_BY_ID).length === 0, val.validateMotions(MOTIONS, TECH_BY_ID).join(' | '));
    const foot = (id) => [...new Set(TECH_BY_ID[id].foot ?? [])].sort().join(',');
    const zones = (id) => [...new Set(MOTIONS[id].zones)].sort().join(',');
    ok(zones('sert-sut') === foot('sert-sut') && zones('sert-sut') === 'ustTam', `sert-sut bölgeleri ${zones('sert-sut')} ≠ ${foot('sert-sut')}`);
    ok(zones('uzun-pas') === foot('uzun-pas') && zones('uzun-pas') === 'ic,ustIc', `uzun-pas bölgeleri ${zones('uzun-pas')} ≠ ${foot('uzun-pas')}`);
    ok(MOTIONS['alin-kafa'].zones === 'alin' && MOTIONS['alin-kafa'].contact === 'alin' && TECH_BY_ID['alin-kafa'].cat === 'kafa', 'alin-kafa: alın bölgesi');
    // BootMap adları (oynatıcı çipleri bu adları yazar)
    ok(boot.ZONES.ustTam.label === 'Ayak üstü (bağcık)', `ustTam adı: ${boot.ZONES.ustTam.label}`);
    ok(boot.ZONES.ic.label.startsWith('İç yüz') && boot.ZONES.ustIc.label.startsWith('Üst iç'), 'uzun-pas bölge adları');
  });

  await test('Hareket B: iç yüz ↔ dış yüz karışmaz — uzun pas iç ayak üstüyle (sola kavis), sert şut bağcıkla; hiçbiri dış yüzey kullanmaz', async () => {
    const up = MOTIONS['uzun-pas'];
    ok(['ic', 'ustIc'].includes(up.contact) && up.contact === 'ustIc', `uzun-pas teması ${up.contact}`);
    ok(up.curve === 'sol', 'iç ayak üstü sağ ayakta topu oyuncunun soluna kavisler (curve: sol)');
    ok(MOTIONS['sert-sut'].contact === 'ustTam' && !MOTIONS['sert-sut'].curve, 'sert şut düz vuruştur, kavis yok');
    for (const id of IDS) {
      const m = MOTIONS[id];
      const zs = m.zones === 'alin' ? [] : m.zones;
      ok(!zs.some((z) => ['dis', 'ustDis'].includes(z)) && !['dis', 'ustDis'].includes(m.contact), `${id}: dış yüzey karışmış`);
    }
    // uzun pasta topun kavis yönü: temas sonrası z yolu önce sağa (+), hedefe doğru sola döner; zıt yön yok
    const f = at('uzun-pas', up.tc);
    const k = rig.zoneContact(f.sk.near.foot, 'ustIc');
    const zs = [];
    for (let t = up.tc; t <= up.dur; t += 0.05) zs.push(rawBall('uzun-pas', t).z);
    const peak = Math.max(...zs);
    ok(peak > k.bz + 0.5, `top yolu yana açılmıyor (tepe ${peak.toFixed(2)})`);
    ok(zs.indexOf(peak) < zs.length - 1 && zs[zs.length - 1] < peak - 0.5, 'top yolu kavisle geri dönmüyor (sola)');
    ok(Math.min(...zs) > -0.2, 'top oyuncunun soluna doğru zıt yönde açılıyor');
  });

  await test('Hareket B: temas anında top bildirilen yüzeye değer ve başka bölgeye daha yakın değildir (üç hareket)', async () => {
    for (const id of ['sert-sut', 'uzun-pas']) {
      const m = MOTIONS[id];
      const f = at(id, m.tc);
      const raw = rawBall(id, m.tc);
      const ball = [raw.x, raw.y, raw.z];
      const own = rig.zoneContact(f.sk.near.foot, m.contact);
      const dOwn = dist3(ball, [own.ball[0], own.ball[1], own.bz]);
      ok(dOwn <= 0.03, `${id}: top ${m.contact} bölgesinden ${dOwn.toFixed(3)} m uzak`);
      for (const z of ALL_ZONES) {
        if (z === m.contact) continue;
        const k = rig.zoneContact(f.sk.near.foot, z);
        ok(dist3(ball, [k.ball[0], k.ball[1], k.bz]) > dOwn + 0.012, `${id}: top ${z} bölgesine ${m.contact}'dan daha yakın`);
      }
      // top yerde (merkez y = 0,11) ve ayak yerin altına girmez
      ok(Math.abs(raw.y - 0.11) < 0.005, `${id}: top temasta yerde olmalı (${raw.y})`);
      ok(rig.footLowest(f.sk.near.foot) >= -0.006, `${id}: temasta ayak yere batıyor`);
    }
    const m = MOTIONS['alin-kafa'];
    const f = at('alin-kafa', m.tc);
    const k = rig.foreheadContact(f.sk);
    const raw = rawBall('alin-kafa', m.tc);
    ok(dist3([raw.x, raw.y, raw.z], [k.ball[0], k.ball[1], k.bz]) <= 0.03, 'alın: top alın noktasından uzak');
    // alın noktası başın ön-üst yüzündedir (kaşların üstü): normal başın önüne 15–50° yukarı bakar
    const elev = Math.atan2(k.n[1], k.n[0]) / DEG;
    ok(elev > 5 && elev < 55, `alın normali yukarı ${elev.toFixed(1)}° (topun geliş yönüyle uyumlu olmalı)`);
    ok(f.ball.y > 1.45 && f.ball.y < 2.1, `alın temas yüksekliği ${f.ball.y.toFixed(2)} m`);
  });

  await test('Sert şut: basma ayağı topun yanında düz ve sabit, ayak üstü topa dik, bilek kilitli (parmaklar aşağıda), gövde ve diz topun üzerinde', async () => {
    const id = 'sert-sut';
    const m = MOTIONS[id];
    const f = at(id, m.tc);
    const ball = rawBall(id, m.tc);
    // basma (sol) ayak: temas penceresinde düz (eğim 0), yerde ve kıpırdamaz; top, ayağın topuk–burun aralığında yanındadır
    const [w0, w1] = tl.windowOf(m);
    for (let t = m.tc - w0; t <= m.tc + w1 + 1e-9; t += 1 / 60) {
      const s = at(id, t).sk.far;
      ok(Math.abs(s.foot.pitch) < 0.5 && rig.footLowest(s.foot) <= 0.004 && Math.abs(s.ankle[0] - f.sk.far.ankle[0]) <= 0.008, `basma ayağı sabit değil t=${t.toFixed(2)}`);
    }
    const span = check.footSpan(f.sk.far);
    ok(ball.x > span[0] && ball.x < span[1], `top basma ayağının yanında değil (top ${ball.x.toFixed(2)}, ayak ${span.map((v) => v.toFixed(2))})`);
    // vuruş bacağı: ayak parmakları aşağıda (eğim ≤ −55°), bağcık normali topa doğru, yataya yakın
    const near = f.sk.near;
    ok(near.foot.pitch <= -55, `bilek kilitli parmak aşağıda olmalı (${near.foot.pitch.toFixed(0)}°)`);
    const kc = rig.zoneContact(near.foot, 'ustTam');
    ok(kc.n[0] > 0.95 && Math.abs(kc.n[1]) < 0.3, `bağcık normali topa dönük değil (${kc.n.map((v) => v.toFixed(2))})`);
    // gövde öne eğik (topun üzerinde), baş aşağıda (bakış topta); diz topun hizasında ya da üstünde
    ok(f.sk.trunkDeg >= 10 && f.sk.trunkDeg <= 25, `gövde eğimi ${f.sk.trunkDeg.toFixed(1)}°`);
    ok(f.sk.headDeg >= 30, `baş eğimi ${f.sk.headDeg.toFixed(1)}° (bakış topta olmalı)`);
    ok(Math.abs(near.knee[0] - ball.x) < 0.15 && near.knee[1] > ball.y + 0.25, `diz topun üstünde değil (diz ${near.knee.map((v) => v.toFixed(2))})`);
    // zıt (sol) kol açık ve ileride
    ok(f.sk.armF.hand[0] > f.sk.shoulder[0] + 0.15, 'zıt kol ileri uzanmıyor');
    // vuruş ayağı temasta en yüksek hızına yaklaşır (bilek hızı, m/sn): temastan önceki 0,06 sn'de hızlanır
    const sp = (t) => {
      const a = at(id, t - 0.02).sk.near.ankle;
      const b = at(id, t + 0.02).sk.near.ankle;
      return Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.04;
    };
    ok(sp(m.tc) > 2 && sp(m.tc) >= sp(m.tc - 0.12) - 0.3, `vuruş ayağı temasta hızlı değil (${sp(m.tc).toFixed(2)} m/sn)`);
    // top yere yakın, hızla gider ve ileridir; kaleyi geçecek yükselme yok
    let maxY = 0;
    for (let t = m.tc; t <= m.dur; t += 0.05) maxY = Math.max(maxY, rawBall(id, t).y);
    ok(maxY < 0.7, `sert şutta top çok yükseliyor (${maxY.toFixed(2)} m)`);
    const v = (rawBall(id, m.tc + 0.1).x - rawBall(id, m.tc + 0.02).x) / 0.08;
    ok(v > 6, `top yeterince hızlı değil (${v.toFixed(1)} m/sn)`);
  });

  await test('Sert şut: 3 adımlı koşu, son adım diğerlerinden uzun; basma ayağı vuruştan önce yere basar, takipte vuran ayağın üstüne inilir', async () => {
    const id = 'sert-sut';
    const m = MOTIONS[id];
    const S = [...stances(id, 'near').map((s) => ({ ...s, foot: 'near' })), ...stances(id, 'far').map((s) => ({ ...s, foot: 'far' }))].sort((a, b) => a.from - b.from);
    const strides = [];
    for (let i = 1; i < S.length; i++) if (S[i].foot !== S[i - 1].foot) strides.push({ len: S[i].x - S[i - 1].x, to: S[i] });
    // basma ayağının oturduğu adım: temastan önce başlayan, temas sonrasına uzanan duruş
    const plantIdx = strides.findIndex((s) => s.to.foot === 'far' && s.to.from < m.tc - 0.2 && s.to.to > m.tc + 0.1);
    ok(plantIdx >= 2, `basma adımı bulunamadı ya da yeterli yaklaşma adımı yok (${JSON.stringify(strides.map((s) => [s.to.foot, +s.len.toFixed(2)]))})`);
    const last = strides[plantIdx].len;
    const prev = strides[plantIdx - 1].len;
    ok(last >= prev * 1.15, `son adım (${last.toFixed(2)} m) önceki adımdan (${prev.toFixed(2)} m) uzun olmalı`);
    ok(strides[plantIdx].to.from < m.tc - 0.2, 'basma ayağı vuruştan önce yere oturmalı');
    // takip: vuran ayak temastan sonra yere iner ve oyuncu onun üstünde durur
    const land = S.find((s) => s.foot === 'near' && s.from > m.tc + 0.3);
    ok(land, 'vuran ayak takipte yere inmiyor');
    const fl = at(id, land.from + 0.05);
    ok(Math.abs(fl.sk.pelvis[0] - land.x) < 0.45 && fl.sk.pelvis[0] > at(id, m.tc).sk.pelvis[0] + 0.3, 'oyuncu vuruş ayağının üstüne ilerlemiyor');
  });

  await test('Alından kafa vuruşu: ayaklar yerde ve sabit, gövde önce geriye gerilir sonra öne atılır, boyun sert, bakış topta, top karşıdan gelip öne yönlendirilir', async () => {
    const id = 'alin-kafa';
    const m = MOTIONS[id];
    ok(!m.airborne, 'ayakta kafa vuruşu: sıçrama yok');
    const f = at(id, m.tc);
    // her iki ayak temas çevresinde yerde (topuk kalkık olabilir); basma (sol) ayak düz ve sabit
    for (let t = m.tc - 0.4; t <= m.tc + 0.3 + 1e-9; t += 1 / 60) {
      const s = at(id, t).sk;
      ok(rig.footLowest(s.near.foot) <= 0.006 && rig.footLowest(s.far.foot) <= 0.004, `ayaklar yerde değil t=${t.toFixed(2)}`);
      ok(Math.abs(s.far.ankle[0] - f.sk.far.ankle[0]) <= 0.008 && Math.abs(s.far.foot.pitch) < 0.5, `sol ayak kayıyor/dönüyor t=${t.toFixed(2)}`);
    }
    // gövde: temastan 0,15–0,45 sn önce en geride (≤ −8°), temasta öne doğru geçmiş (≥ 0°) ve takipte daha da öne (≥ 12°)
    let minTr = 99;
    let tMin = 0;
    for (let t = 0.6; t <= m.tc; t += 1 / 60) {
      const tr = at(id, t).sk.trunkDeg;
      if (tr < minTr) {
        minTr = tr;
        tMin = t;
      }
    }
    ok(minTr <= -8 && tMin < m.tc - 0.12 && tMin > m.tc - 0.6, `gövde yeterince geriye gerilmiyor (en geri ${minTr.toFixed(1)}° t=${tMin.toFixed(2)})`);
    ok(f.sk.trunkDeg >= 0, `temasta gövde öne atılmış olmalı (${f.sk.trunkDeg.toFixed(1)}°)`);
    ok(at(id, m.tc + 0.18).sk.trunkDeg >= 12, 'takipte gövde öne devam etmiyor');
    let mono = true;
    for (let t = tMin; t < m.tc; t += 1 / 30) mono = mono && at(id, t + 1 / 30).sk.trunkDeg >= at(id, t).sk.trunkDeg - 0.01;
    ok(mono, 'gövde geriden öne sürekli ilerlemeli (kesintisiz atılma)');
    // boyun sert: başın gövdeye göre eğimi atılma sırasında 12°'den fazla değişmez
    const hds = [];
    for (let t = tMin; t <= m.tc + 0.1; t += 1 / 30) hds.push(at(id, t).sk.headDeg - at(id, t).sk.trunkDeg);
    ok(Math.max(...hds) - Math.min(...hds) <= 12, `boyun gevşek görünüyor (baş-gövde açısı ${Math.max(...hds) - Math.min(...hds)}°)`);
    // bakış: temastan 0,6 sn öncesinden başlayarak baş topa ≤ 60° dönük
    for (let t = m.tc - 0.6; t <= m.tc + 0.1; t += 0.05) {
      const g = at(id, t);
      const a = g.sk.headDeg * DEG;
      const fw = [Math.cos(a), -Math.sin(a)];
      const to = norm2(g.ball.x - g.sk.head[0], g.ball.y - g.sk.head[1]);
      const ang = Math.acos(Math.max(-1, Math.min(1, fw[0] * to[0] + fw[1] * to[1]))) / DEG;
      ok(ang <= check.LIMITS.gaze, `bakış topta değil t=${t.toFixed(2)} (${ang.toFixed(0)}°)`);
    }
    // top: temastan önce oyuncuya doğru (vx < 0) ve aşağı iner, sonra öne (vx > 2) yönlendirilir
    const b0 = rawBall(id, m.tc - 0.05);
    const b1 = rawBall(id, m.tc - 0.01);
    const b2 = rawBall(id, m.tc + 0.03);
    const b3 = rawBall(id, m.tc + 0.07);
    ok(b1.x < b0.x && b1.y < b0.y, 'top temastan önce oyuncuya doğru inmiyor');
    ok((b3.x - b2.x) / 0.04 > 2, 'top temastan sonra öne yönlendirilmiyor');
    ok(f.ball.y > 1.45, 'top alın hizasında değil');
    // sayfa güvenlik notuna yönlendirir (çocuk ve ergenler için sınırlama)
    ok(TECH_BY_ID[id].safety && /Güvenlik/.test(m.note ?? ''), 'çocuk güvenliği notu hareket notunda yok');
  });

  await test('Uzun pas: basma ayağı topun hafif gerisinde, ayak dışa dönük ve parmaklar aşağıda, vücut hafif arkada, top yüksek açıyla geri dönüşlü çıkar, takip yüksek', async () => {
    const id = 'uzun-pas';
    const m = MOTIONS[id];
    const f = at(id, m.tc);
    const ball = rawBall(id, m.tc);
    // basma ayağı: düz ve sabit, burnu topun merkezinin gerisinde (hafif geride), top onun 0,3 m ilerisinde değil
    const [w0, w1] = tl.windowOf(m);
    for (let t = m.tc - w0; t <= m.tc + w1 + 1e-9; t += 1 / 60) {
      const s = at(id, t).sk.far;
      ok(Math.abs(s.foot.pitch) < 0.5 && rig.footLowest(s.foot) <= 0.004 && Math.abs(s.ankle[0] - f.sk.far.ankle[0]) <= 0.008, `basma ayağı sabit değil t=${t.toFixed(2)}`);
    }
    const span = check.footSpan(f.sk.far);
    ok(span[1] < ball.x && ball.x - span[1] < 0.3, `basma ayağı topun hafif gerisinde olmalı (ayak burnu ${span[1].toFixed(2)}, top ${ball.x.toFixed(2)})`);
    // vuran ayak: dışa dönük (yaw ≥ 35°), parmaklar aşağıda; iç ayak üstü topa bakar
    const near = f.sk.near;
    ok(near.foot.pitch <= -60, `parmaklar aşağıda olmalı (${near.foot.pitch.toFixed(0)}°)`);
    const nyaw = Math.atan2(near.foot.U[2], near.foot.U[0]) / DEG;
    ok(nyaw >= 25, `ayak dışa dönük olmalı (${nyaw.toFixed(0)}°)`);
    const kc = rig.zoneContact(near.foot, 'ustIc');
    ok(kc.n[0] > 0.9, `iç ayak üstü topa dönük değil (${kc.n.map((v) => v.toFixed(2))})`);
    // vücut hafif arkada: gövde dikeyden geriye (< 0°) ama doğal sınırda; baş aşağıda (bakış topta)
    ok(f.sk.trunkDeg < 0 && f.sk.trunkDeg >= -12, `gövde hafif geride olmalı (${f.sk.trunkDeg.toFixed(1)}°)`);
    ok(f.sk.headDeg >= 15, `bakış topta olmalı (baş ${f.sk.headDeg.toFixed(1)}°)`);
    // son adım uzun: basma adımı önceki adımdan en az %15 uzun
    const S = [...stances(id, 'near').map((s) => ({ ...s, foot: 'near' })), ...stances(id, 'far').map((s) => ({ ...s, foot: 'far' }))].sort((a, b) => a.from - b.from);
    const strides = [];
    for (let i = 1; i < S.length; i++) if (S[i].foot !== S[i - 1].foot) strides.push({ len: S[i].x - S[i - 1].x, to: S[i] });
    const pi = strides.findIndex((s) => s.to.foot === 'far' && s.to.from < m.tc - 0.2 && s.to.to > m.tc + 0.1);
    ok(pi >= 2 && strides[pi].len >= strides[pi - 1].len * 1.15, `son adım uzun değil: ${JSON.stringify(strides.map((s) => +s.len.toFixed(2)))}`);
    // top: yüksek açıyla çıkar (≥ 30°), 1,5 m'yi aşar, geri dönüşlü (r artar = saat yönünün tersi) döner
    const b1 = rawBall(id, m.tc + 0.03);
    const b2 = rawBall(id, m.tc + 0.09);
    const ang = Math.atan2(b2.y - b1.y, b2.x - b1.x) / DEG;
    ok(ang >= 30 && ang <= 65, `çıkış açısı ${ang.toFixed(0)}°`);
    let maxY = 0;
    for (let t = m.tc; t <= m.dur; t += 0.05) maxY = Math.max(maxY, rawBall(id, t).y);
    ok(maxY > 1.5, `top yeterince yükselmiyor (${maxY.toFixed(2)} m)`);
    ok(rawBall(id, m.tc + 0.5).r > rawBall(id, m.tc).r + 50, 'top geri dönüşlü dönmüyor');
    // takip yüksek: vuran bilek temastan sonra kalça hizasına yaklaşır (≥ 0,75 m) ve hedefe uzanır
    let maxA = 0;
    let maxX = 0;
    for (let t = m.tc; t <= m.tc + 0.5; t += 1 / 60) {
      const a = at(id, t).sk.near.ankle;
      maxA = Math.max(maxA, a[1]);
      maxX = Math.max(maxX, a[0]);
    }
    ok(maxA >= 0.75 && maxX > near.ankle[0] + 0.5, `takip yüksek/uzun değil (bilek ${maxA.toFixed(2)} m, ilerleme ${(maxX - near.ankle[0]).toFixed(2)} m)`);
    // karşılaştırma: uzun pasın çıkışı sert şuttan çok daha diktir
    const s = MOTIONS['sert-sut'];
    const sb1 = rawBall('sert-sut', s.tc + 0.03);
    const sb2 = rawBall('sert-sut', s.tc + 0.09);
    const sang = Math.atan2(sb2.y - sb1.y, sb2.x - sb1.x) / DEG;
    ok(ang - sang >= 20, `uzun pas (${ang.toFixed(0)}°) sert şuttan (${sang.toFixed(0)}°) çok daha yüksek çıkmalı`);
  });

  await test('Hareket B: açıklamalar tekniğin yazılı içeriğiyle aynı çizgide (bölge adı, adım, yüzey) ve Türkçe karakterli; yasak ifade yok', async () => {
    const need = {
      'sert-sut': [/ayak üstü/i, /bağcık/i, /basma ayağ/i, /ortas/i, /uzun/i],
      'uzun-pas': [/iç ayak üstü/i, /alt yarı|altına|altından/i, /basma ayağ/i, /hafif geri/i, /uzun/i, /yukarı/i],
      'alin-kafa': [/aln|alın/i, /boyn/i, /göz/i, /gövde/i, /ağzınız kapalı/i],
    };
    for (const id of IDS) {
      const m = MOTIONS[id];
      const all = m.caps.join(' ');
      for (const re of need[id]) ok(re.test(all), `${id}: açıklamalarda ${re} yok`);
      ok(/[ğüşıöçİ]/.test(all), `${id}: Türkçe karakter yok`);
      // Temas açıklaması asıl yüzeyi adıyla söyler
      const key = { 'sert-sut': /ayak üstü/i, 'uzun-pas': /iç ayak üstü/i, 'alin-kafa': /aln|alın/i }[id];
      ok(key.test(m.caps[1]), `${id}: Temas açıklaması yüzeyi anmıyor`);
      ok(!/garanti|kesinlikle|%\s?\d|tedavi|iyileştir|ağrıyı|sakatlığı önler|beyin|sarsıntı/i.test(m.caps.join(' ') + (m.note ?? '') + m.label), `${id}: yasak ifade`);
      for (const c of m.caps) ok(c.length >= 30 && c.length <= 260, `${id}: açıklama uzunluğu ${c.length}`);
    }
    // yanlış tekniğe ait ifade yok: sert şutta "iç yüz"/"trivela", uzun pasta "dış"/"trivela" geçmez
    ok(!/iç yüz|trivela|dış/i.test(MOTIONS['sert-sut'].caps.join(' ')), 'sert şut açıklaması başka tekniğin yüzeyini anıyor');
    ok(!/dış|trivela|bağcık/i.test(MOTIONS['uzun-pas'].caps.join(' ')), 'uzun pas açıklaması başka tekniğin yüzeyini anıyor');
  });

  await test('Hareket B: zaman çizelgesi — temas evresi temas penceresiyle çakışır, üç sabit kare farklı, vurgu temasta tepe yapar', async () => {
    for (const id of IDS) {
      const m = MOTIONS[id];
      const [b0, b1, b2, b3] = tl.phaseBounds(m);
      ok(b0 === 0 && b1 < m.tc && m.tc < b2 && b3 === m.dur, `${id}: evre sınırları`);
      ok(b2 - b1 >= 0.18 && b2 - b1 <= 0.5, `${id}: Temas evresi ${(b2 - b1).toFixed(2)} sn`);
      ok(tl.glowAt(m, m.tc) > 0.99 && tl.glowAt(m, 0) === 0 && tl.glowAt(m, m.dur) === 0, `${id}: vurgu`);
      const st = tl.stripTimes(m);
      const imgs = st.map((t) => JSON.stringify(at(id, t).sk.near.ankle.concat(at(id, t).sk.pelvis)));
      ok(new Set(imgs).size === 3, `${id}: üç sabit kare aynı`);
      ok(m.dur >= 1.8 && m.dur <= 3.5, `${id}: süre ${m.dur}`);
    }
  });

  await test('Uzuv anahtarları: limbKeys her kanalı kendi zamanında yumuşak sürer, bekleyen kanal sabit kalır, süre sonunda biter', async () => {
    const keys = lk.limbKeys(
      {
        body: [{ t: 0, px: 0 }, { t: 1, px: 1 }, { t: 2, px: 1.5 }],
        near: [{ t: 0, n0: 0.2 }, { t: 0.5 }, { t: 1.5, n0: 0.8 }],
        far: [{ t: 0.4, f0: 0.4 }, { t: 1.2, f0: 0.4 }],
      },
      2,
    );
    ok(keys[0].t === 0 && keys[keys.length - 1].t === 2, 'başlangıç ve bitiş anahtarı');
    ok(keys.every((k, i) => i === 0 || k.t > keys[i - 1].t), 'anahtar zamanları artmıyor');
    const v = (t, c) => keys.find((k) => Math.abs(k.t - t) < 1e-9).p[c];
    ok(Math.abs(v(1, 'px') - 1) < 1e-9 && Math.abs(v(2, 'px') - 1.5) < 1e-9, 'pelvis anahtar değerleri korunmalı');
    ok(Math.abs(v(0.5, 'n0') - 0.2) < 1e-9, 'bekleyen kanal (n0) 0,5 sn\'de 0,2 kalmalı');
    ok(Math.abs(v(0.4, 'f0') - 0.4) < 1e-9 && Math.abs(v(1.2, 'f0') - 0.4) < 1e-9, 'uzak bacak sabit (basma)');
    // sabit ayak: iki eşit anahtar arasındaki tüm örnekler aynı
    ok(keys.filter((k) => k.t >= 0.4 && k.t <= 1.2).every((k) => Math.abs(k.p.f0 - 0.4) < 1e-9), 'iki eşit anahtar arasında değer kıpırdamamalı');
    // yazılmayan grup STAND'de kalır
    ok(keys.every((k) => k.p.bs === -6 && k.p.as === 6), 'yazılmayan kollar STAND değerinde kalmalı');
    // son anahtar tam PoseKey (16 kanal)
    ok(Object.keys(keys[0].p).length === 16, 'her anahtar 16 kanal içermeli');
  });
};
