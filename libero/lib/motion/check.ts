// Teknik hareket verisi için kinematik tutarlılık denetimi (React yok, DOM yok).
// Hem derleme sırasında veri doğrulayıcısı (data/technique-motion/validate.ts) hem mantık testleri bu eşikleri kullanır.
// Amaç: anatomik olarak mümkün olmayan ya da yanlış görünen kareleri (diz ters bükülmesi, yerin altına inen ayak,
// kayan basma ayağı, havada asılı kalan top, temas bölgesinden kopuk top) yazarın görmesi.
import { DEG, SEG, ballAt, footLowest, footPoint, zoneContact, type Leg, type Skeleton, type Vec2 } from './rig';
import { compileMotion, contactAt, frameAt, windowOf, type TechMotion } from './timeline';

export const LIMITS = {
  /** yere batma toleransı (m): çivi çimde en çok bu kadar gömülür */
  sink: 0.006,
  /** basma ayağı havada asılı kalma toleransı (m) */
  hover: 0.004,
  /** temas penceresinde basma ayağı bileğinin yatay kayma toleransı (m) */
  slide: 0.008,
  /** IK hedefi ulaşılamaz (m) */
  over: 0.004,
  /** diz ters bükülmesi toleransı (derece) */
  hyper: 0.5,
  /** top temas yüzeyinden en çok bu kadar uzakta olabilir (m) */
  contactGap: 0.03,
  /** top karelerarası en yüksek hız (m/sn) */
  ballSpeed: 45,
  /** pelvis en yüksek hız (m/sn) */
  pelvisSpeed: 5,
  /** gövde eğimi aralığı (derece) */
  trunk: [-12, 40] as const,
  /** süre aralığı (sn) */
  dur: [1.8, 3.5] as const,
  /** başın topa dönük olması: baş yönü ile topa doğru yön arasındaki en büyük açı (derece) */
  gaze: 60,
};

const near0 = (x: number, y: number, tol: number) => Math.abs(x - y) <= tol;
const fin = (...v: number[]) => v.every((x) => Number.isFinite(x));
const f3 = (x: number) => (Math.round(x * 1000) / 1000).toString();

function legLen(leg: Leg): [number, number] {
  return [Math.hypot(leg.knee[0] - leg.hip[0], leg.knee[1] - leg.hip[1]), Math.hypot(leg.ankle[0] - leg.knee[0], leg.ankle[1] - leg.knee[1])];
}
function dist(a: Vec2, b: Vec2) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** Ayağın yere değen kısmının x aralığı (basma poligonu): topuk – burun, dünya x. */
export function footSpan(leg: Leg): [number, number] {
  const f = leg.foot;
  const xs = [footPoint(f, -0.088, -0.085, 0)[0], footPoint(f, 0.234, -0.06, 0)[0]];
  return [Math.min(...xs), Math.max(...xs)];
}

/** Gövde kütle merkezinin yaklaşık yatay konumu: pelvis + gövdenin yarısı. */
export function comX(sk: Skeleton): number {
  return (sk.pelvis[0] * 1 + (sk.pelvis[0] + sk.shoulder[0]) / 2 * 1 + sk.head[0] * 0.3) / 2.3;
}

/** Tüm kinematik denetimleri çalıştırır; sorun yoksa boş liste döner. */
export function checkMotion(m: TechMotion): string[] {
  const out: string[] = [];
  const id = m.id;
  const c = compileMotion(m);
  const [w0, w1] = windowOf(m);
  const dt = 1 / 60;
  const n = Math.ceil(m.dur / dt);
  let prev: ReturnType<typeof frameAt> | null = null;
  const reported = new Set<string>();
  const once = (key: string, msg: string) => {
    if (reported.has(key)) return;
    reported.add(key);
    out.push(`${id}: ${msg}`);
  };

  for (let i = 0; i <= n; i++) {
    const t = Math.min(m.dur, i * dt);
    const f = frameAt(m, t, c);
    const { sk, ball } = f;
    const nums = [sk.pelvis[0], sk.pelvis[1], sk.shoulder[0], sk.shoulder[1], sk.head[0], sk.head[1], ball.x, ball.y, ball.z, ball.r, sk.near.knee[0], sk.near.knee[1], sk.near.ankle[0], sk.near.ankle[1], sk.far.knee[0], sk.far.knee[1], sk.far.ankle[0], sk.far.ankle[1], sk.armN.hand[0], sk.armN.hand[1], sk.armF.hand[0], sk.armF.hand[1], f.glow];
    if (!fin(...nums)) {
      once('nan', `t=${f3(t)} sayısal değer geçersiz (NaN/∞)`);
      continue;
    }
    // sabit segment uzunlukları
    for (const [nm, leg] of [['yakın', sk.near], ['uzak', sk.far]] as const) {
      const [th, sh] = legLen(leg);
      if (!near0(th, SEG.thigh, 1e-6) || !near0(sh, SEG.shank, 1e-6)) once(`len-${nm}`, `t=${f3(t)} ${nm} bacak segment uzunluğu değişti (${f3(th)}, ${f3(sh)})`);
      if (leg.flex < -LIMITS.hyper) once(`hyper-${nm}`, `t=${f3(t)} ${nm} dizde ters bükülme (${f3(leg.flex)}°)`);
      if (leg.over > LIMITS.over) once(`over-${nm}`, `t=${f3(t)} ${nm} ayak hedefi bacağın erişemeyeceği kadar uzak (${f3(leg.over)} m)`);
      const lo = footLowest(leg.foot);
      if (lo < -LIMITS.sink) once(`sink-${nm}`, `t=${f3(t)} ${nm} ayak yerin altına iniyor (${f3(lo)} m)`);
    }
    const armLen = (a: Skeleton['armN']) => [dist(a.shoulder, a.elbow), dist(a.elbow, a.wrist)];
    for (const a of [sk.armN, sk.armF]) {
      const [u, fo] = armLen(a);
      if (!near0(u, SEG.upper, 1e-6) || !near0(fo, SEG.fore, 1e-6)) once('arm-len', `t=${f3(t)} kol segment uzunluğu değişti`);
    }
    if (!near0(dist(sk.pelvis, sk.shoulder), SEG.trunk, 1e-6)) once('trunk-len', `t=${f3(t)} gövde uzunluğu değişti`);
    if (sk.trunkDeg < LIMITS.trunk[0] || sk.trunkDeg > LIMITS.trunk[1]) once('trunk', `t=${f3(t)} gövde eğimi doğal aralığın dışında (${f3(sk.trunkDeg)}°)`);
    // kol/dirsek doğal aralığı (poz kanallarından)
    // top yerin altına inemez, havada sıçrama dışında ayakta durması beklenir
    if (ball.y < SEG.ball - 0.012) once('ball-sink', `t=${f3(t)} top yerin altına iniyor (merkez y=${f3(ball.y)})`);
    if (ball.y > 8) once('ball-high', `t=${f3(t)} top gerçekçi olmayan yükseklikte`);
    if (prev) {
      const v = dist([ball.x, ball.y], [prev.ball.x, prev.ball.y]) / dt;
      if (v > LIMITS.ballSpeed) once('ball-jump', `t=${f3(t)} top karelerarasında ışınlanıyor (${f3(v)} m/sn)`);
      const pv = dist(sk.pelvis, prev.sk.pelvis) / dt;
      if (pv > LIMITS.pelvisSpeed) once('pelvis-jump', `t=${f3(t)} pelvis çok hızlı hareket ediyor (${f3(pv)} m/sn)`);
    }
    // basma ayağı: temas penceresinde yerde, düz ve sabit; kütle merkezi ayağın çevresinde
    if (!m.airborne && t >= m.tc - w0 && t <= m.tc + w1) {
      const lo = footLowest(sk.far.foot);
      if (lo > LIMITS.hover) once('hover', `t=${f3(t)} basma ayağı yerden kopuk (${f3(lo)} m)`);
      const ref = frameAt(m, m.tc, c).sk.far.ankle[0];
      if (Math.abs(sk.far.ankle[0] - ref) > LIMITS.slide) once('slide', `t=${f3(t)} basma ayağı kayıyor (${f3(sk.far.ankle[0] - ref)} m)`);
      const [x0, x1] = footSpan(sk.far);
      const cx = comX(sk);
      if (cx < x0 - 0.18 || cx > x1 + 0.18) once('balance', `t=${f3(t)} denge: kütle merkezi basma ayağından çok uzak (${f3(cx - (x0 + x1) / 2)} m)`);
    }
    prev = f;
  }

  // baş topu izler: hazırlık ve temas öncesi
  for (let t = Math.max(0, m.tc - 0.3); t <= m.tc + 0.1; t += 0.05) {
    const f = frameAt(m, t, c);
    const a = f.sk.headDeg * DEG;
    const fw: Vec2 = [Math.cos(a), -Math.sin(a)];
    const to: Vec2 = [f.ball.x - f.sk.head[0], f.ball.y - f.sk.head[1]];
    const l = Math.hypot(to[0], to[1]) || 1;
    const ang = Math.acos(Math.max(-1, Math.min(1, (fw[0] * to[0] + fw[1] * to[1]) / l))) / DEG;
    if (ang > LIMITS.gaze) {
      once('gaze', `t=${f3(t)} baş topa dönük değil (${f3(ang)}°)`);
      break;
    }
  }

  // temas: top, temas bölgesinin üzerinde
  {
    const f = frameAt(m, m.tc, c);
    const k = contactAt(m, f.sk);
    const raw = ballAt(c.ball, m.tc);
    const gap = Math.hypot(raw.x - k.ball[0], raw.y - k.ball[1], raw.z - k.bz);
    if (gap > LIMITS.contactGap) once('contact', `temas anında top (${f3(raw.x)}, ${f3(raw.y)}, ${f3(raw.z)}) temas bölgesinden ${f3(gap)} m uzakta (hedef ${f3(k.ball[0])}, ${f3(k.ball[1])}, ${f3(k.bz)})`);
  }
  // yapışık (carry) aralığının uçlarında top zıplamaz
  if (m.carry) {
    const [c0, c1] = m.carry;
    const e = 0.0005;
    for (const [tt, nm] of [[c0, 'başında'], [c1, 'sonunda']] as const) {
      const sk = frameAt(m, tt, c).sk;
      const k = m.contact === 'alin' ? contactAt(m, sk) : zoneContact(sk.near.foot, m.contact);
      const raw = ballAt(c.ball, nm === 'başında' ? tt - e : tt + e);
      const gap = Math.hypot(raw.x - k.ball[0], raw.y - k.ball[1], raw.z - k.bz);
      if (gap > LIMITS.contactGap) once(`carry-${nm}`, `yapışma aralığının ${nm} top ${f3(gap)} m sıçrıyor`);
    }
  }
  return out;
}
