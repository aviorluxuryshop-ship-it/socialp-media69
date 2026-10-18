// Teknik hareketler: bağımsız denetimde (birleştirme sonrası) bulunan kusurların kalıcı denetimleri.
// Kayıtlı HER hareket için çalışır; yeni bir hareket eklendiğinde otomatik kapsanır.
//   • Sert ayak: vuruş penceresinde vuran ayağın ön ayağı bükülmez (IK yürüyüş ayağı, parmak ucu aşağı bakan vuruşta çarpık krampon çizer).
//   • Fizik tutarlılığı: topun çıkış hızı, temas noktasının yer hızıyla uyumlu (top ayaktan 1,75 kattan hızlı çıkmaz, ayak topu geçmez).
//   • Temas noktası hızı temasa yakın en yüksek değerlerindedir (vuruş "durmuş ayakla" olmaz).
//   • Basma ayağı topun hemen yanında, ama topun ilerisinde değil; vuran ayak taban eğmesi 62° içinde.
export const include = [
  'lib/motion/timeline.ts',
  'lib/motion/rig.ts',
  'lib/motion/check.ts',
  'data/technique-motion/index.ts',
];

export default async ({ ok, test, load }) => {
  const tl = await load('lib/motion/timeline.js');
  const rig = await load('lib/motion/rig.js');
  const reg = await load('data/technique-motion/index.js');
  const MOTIONS = Object.values(reg.MOTIONS);
  const isFoot = (m) => m.contact !== 'alin';
  const launches = (m) => isFoot(m) && !m.carry; // ilk temasta top ayağa yapışık kalır (amorti), diğerlerinde top çıkar

  /** temas noktasının (zone merkezi) dünya hızı, m/sn */
  const contactSpeed = (m, c, t) => {
    const g = rig.ZONE_GEOM[m.contact].c;
    const P = (tt) => {
      const f = tl.frameAt(m, tt, c);
      return rig.footPoint(f.sk.near.foot, g[0], g[1], g[2]);
    };
    const e = 0.01;
    const a = P(t - e);
    const z = P(t + e);
    return Math.hypot(z[0] - a[0], z[1] - a[1], z[2] - a[2]) / (2 * e);
  };
  const ballSpeed = (m, c, t0, t1) => {
    const a = tl.frameAt(m, t0, c).ball;
    const z = tl.frameAt(m, t1, c).ball;
    return Math.hypot(z.x - a.x, z.y - a.y) / (t1 - t0);
  };

  await test('Hareket denetimi: temas penceresinde vuran ayak sert (ön ayak bükülmesi yok), taban eğme ≤ 62°, sırt eğme ≤ 40°', async () => {
    for (const m of MOTIONS.filter(isFoot)) {
      const c = tl.compileMotion(m);
      const [w0, w1] = tl.windowOf(m);
      for (let t = Math.max(0, m.tc - w0 - 0.1); t <= Math.min(m.dur, m.tc + w1 + 0.1); t += 1 / 60) {
        const leg = tl.frameAt(m, t, c).sk.near;
        ok(leg.foot.toe <= 3, `${m.id}: t=${t.toFixed(2)} vuran ayağın ön ayağı bükülü (${leg.foot.toe.toFixed(0)}°): parmak ucu aşağı bakan vuruşta bacak FK (nearIkToFk) olmalı`);
        const plantar = leg.shank - leg.foot.pitch;
        ok(plantar <= 62 && plantar >= -40, `${m.id}: t=${t.toFixed(2)} vuran ayak bileği aralık dışı (${plantar.toFixed(0)}°)`);
      }
    }
  });

  await test('Hareket denetimi: topun çıkış hızı temas noktasının hızıyla tutarlı (≤ 1,75 kat), ayak topu geçmez, temasa yakın ayak hızı tepe yapar', async () => {
    let n = 0;
    for (const m of MOTIONS.filter(launches)) {
      n++;
      const c = tl.compileMotion(m);
      const vf = contactSpeed(m, c, m.tc);
      const vb = ballSpeed(m, c, m.tc + 0.01, m.tc + 0.05);
      ok(vf > 1.2, `${m.id}: temas anında ayak neredeyse duruyor (${vf.toFixed(2)} m/sn)`);
      ok(vb <= vf * 1.75, `${m.id}: top ayaktan çok hızlı çıkıyor (ayak ${vf.toFixed(2)}, top ${vb.toFixed(2)} m/sn)`);
      ok(vb >= vf * 0.8, `${m.id}: top ayaktan çok yavaş çıkıyor (ayak ${vf.toFixed(2)}, top ${vb.toFixed(2)} m/sn)`);
      let peak = 0;
      for (let t = m.tc - 0.15; t <= m.tc + 0.02; t += 0.01) peak = Math.max(peak, contactSpeed(m, c, t));
      ok(vf >= 0.65 * peak, `${m.id}: ayak hızı temasa yakın tepe yapmıyor (temas ${vf.toFixed(2)}, tepe ${peak.toFixed(2)} m/sn)`);
      for (let t = m.tc + 0.03; t <= m.tc + 0.12; t += 0.01) {
        const f = contactSpeed(m, c, t);
        const b = ballSpeed(m, c, t - 0.01, t + 0.01);
        ok(f <= b * 1.1, `${m.id}: t=${t.toFixed(2)} ayak (${f.toFixed(2)}) topu (${b.toFixed(2)}) geçiyor`);
      }
    }
    ok(n >= 4, `hız denetimi yalnızca ${n} harekette çalıştı`);
  });

  await test('Hareket denetimi: basma ayağı temas anında topun hemen yanında (ayak orta noktası topun hizasından ≤ 0,3 m geride, burnu topun merkezini geçmez)', async () => {
    for (const m of MOTIONS.filter(launches)) {
      const c = tl.compileMotion(m);
      const f = tl.frameAt(m, m.tc, c);
      const far = f.sk.far.foot;
      const toe = rig.footPoint(far, 0.234, -0.03, 0)[0];
      const heel = rig.footPoint(far, -0.088, -0.03, 0)[0];
      const bx = f.ball.x;
      ok(toe <= bx + 0.02, `${m.id}: basma ayağının burnu (${toe.toFixed(2)}) topun merkezini (${bx.toFixed(2)}) geçmiş`);
      ok((toe + heel) / 2 >= bx - 0.35, `${m.id}: basma ayağı topun çok gerisinde (${((toe + heel) / 2).toFixed(2)} / top ${bx.toFixed(2)})`);
    }
  });
};
