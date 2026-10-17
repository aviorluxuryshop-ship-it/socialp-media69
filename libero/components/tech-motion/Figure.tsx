import { useId } from 'react';
import { ballGeometry } from '@/lib/boot-ball';
import { ZONES } from '@/lib/boot';
import { DEG, SEG, bootShape, footPoint, zonePatch, type Arm, type Foot, type Leg, type Skeleton, type Vec2 } from '@/lib/motion/rig';
import { contactAt, type Frame, type TechMotion } from '@/lib/motion/timeline';
import type { BallState } from '@/lib/motion/rig';
import { GY, SC, VH, VW, capsule, f1, f2, poly, smoothClosed, toPx, viewBoxFor } from './draw';

// Hareket sahnesi: bir kareyi (Frame) yandan görünümde çizen saf SVG bileşeni. Durum yok; oynatıcı ve statik şerit aynı bileşeni kullanır.
// Işık sol üstten gelir. Yazı yok (SVG ölçeklenince okunmaz); etiketler HTML tarafında.

/** Oyuncu donanımı: nötr "manken" gövde, fildişi forma, koyu şort; krampon BootMap ile aynı grafit/fildişi paleti. */
const K = {
  limbHi: '#e6ece6',
  limbLo: '#9eaca5',
  farHi: '#8b9993',
  farLo: '#56635e',
  shirtHi: '#93d8ff',
  shirtLo: '#2f8bd0',
  shirtFar: '#1f6aa0',
  trim: '#f4f2e6',
  shortsHi: '#33433f',
  shortsLo: '#141c1a',
  shortsFar: '#0e1513',
  sockHi: '#f1eee1',
  sockLo: '#aeab9d',
  sockFar: '#7c7a70',
  hair: '#1a2220',
  accent: '#c2f53c',
  accentHi: '#dcff7d',
  line: '#050807',
  // krampon (BootMap ile aynı)
  up1: '#6a756f',
  up2: '#3b4440',
  up3: '#1c2220',
  farUp: '#232a27',
  iv1: '#f3eedf',
  iv2: '#cdc8b6',
  iv3: '#98948a',
  studs: '#0b0e0d',
};

const px = (cam: number, p: Vec2) => toPx(cam, p);
const rp = (m: number) => m * SC;
const lerp2 = (a: Vec2, b: Vec2, t: number): Vec2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** Uzvun eksenine dik ince şerit (forma/çorap bandı): a→b ekseninin t noktasında, yarıçap r, kalınlık w (px). */
function bandPath(a: Vec2, b: Vec2, t: number, r: number): string {
  const p = lerp2(a, b, t);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l;
  const ny = dx / l;
  return `M${f1(p[0] + nx * r)} ${f1(p[1] + ny * r)}L${f1(p[0] - nx * r)} ${f1(p[1] - ny * r)}`;
}

/** Gövdenin (formanın) dış çizgisi: pelvisten omuza, dünya metresi. */
function torsoPts(sk: Skeleton): Vec2[] {
  const a = sk.trunkDeg * DEG;
  const u: Vec2 = [Math.sin(a), Math.cos(a)];
  const f: Vec2 = [Math.cos(a), -Math.sin(a)];
  const at = (s: number, c: number): Vec2 => [sk.pelvis[0] + u[0] * s + f[0] * c, sk.pelvis[1] + u[1] * s + f[1] * c];
  return [at(0.1, -0.1), at(0.22, -0.088), at(0.34, -0.1), at(0.46, -0.09), at(0.54, -0.05), at(0.57, 0.0), at(0.53, 0.06), at(0.42, 0.108), at(0.28, 0.094), at(0.17, 0.088), at(0.1, 0.096)];
}

/** Baş çevresinde φ açısındaki (öne bakan yönden saat yönünün tersine) nokta. */
function headPt(sk: Skeleton, phi: number, k = 1): Vec2 {
  const a = sk.headDeg * DEG;
  const fw: Vec2 = [Math.cos(a), -Math.sin(a)];
  const up: Vec2 = [Math.sin(a), Math.cos(a)];
  const r = SEG.headR * k;
  const p = phi * DEG;
  return [sk.head[0] + r * (Math.cos(p) * fw[0] + Math.sin(p) * up[0]), sk.head[1] + r * (Math.cos(p) * fw[1] + Math.sin(p) * up[1])];
}

function hairPath(cam: number, sk: Skeleton): string {
  const pts: Vec2[] = [];
  for (let p = 20; p <= 210; p += 10) pts.push(px(cam, headPt(sk, p, 1.02))); // dış kenar: alından ensesine
  for (let p = 200; p >= 40; p -= 20) pts.push(px(cam, headPt(sk, p, 0.72))); // iç kenar: saç çizgisi
  return 'M' + pts.map((q) => `${f1(q[0])} ${f1(q[1])}`).join('L') + 'Z';
}

interface LegGfx {
  thigh: string;
  shorts: string;
  shank: string;
  sock: string;
  band: string;
}
function legGfx(cam: number, leg: Leg): LegGfx {
  const hip = px(cam, leg.hip);
  const knee = px(cam, leg.knee);
  const ank = px(cam, leg.ankle);
  return {
    thigh: capsule(hip, rp(0.084), knee, rp(0.06)),
    shorts: capsule(hip, rp(0.1), lerp2(hip, knee, 0.42), rp(0.088)),
    shank: capsule(knee, rp(0.057), ank, rp(0.04)),
    sock: capsule(lerp2(knee, ank, 0.4), rp(0.05), ank, rp(0.04)),
    band: bandPath(knee, ank, 0.46, rp(0.049)),
  };
}

function Boot({ cam, foot, far, uid }: { cam: number; foot: Foot; far: boolean; uid: string }) {
  const s = bootShape(foot);
  const tx = (v: readonly Vec2[]) => v.map((p) => px(cam, p));
  const plus = tx(s.plus);
  const minus = tx(s.minus);
  const sole = tx(s.sole);
  const soleM = tx(s.soleMinus);
  // bağcık: ayak üstü hattı boyunca kısa çubuklar
  const laces: string[] = [];
  for (const u of [0.07, 0.1, 0.13, 0.16, 0.19]) {
    const v = 0.0 + (u > 0.14 ? 0.026 : u > 0.09 ? 0.05 : 0.07);
    const a = px(cam, [footPoint(foot, u, v, -0.026)[0], footPoint(foot, u, v, -0.026)[1]]);
    const b = px(cam, [footPoint(foot, u, v, 0.026)[0], footPoint(foot, u, v, 0.026)[1]]);
    laces.push(`M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}`);
  }
  const g = (n: string) => `url(#${uid}-${n})`;
  return (
    <g className="tm-boot">
      {s.studs.map((q, i) => (
        <path key={i} d={poly(tx(q))} fill={K.studs} stroke={K.line} strokeWidth="0.6" strokeLinejoin="round" />
      ))}
      <path d={smoothClosed(minus, 0.5)} fill={far ? K.farUp : K.up3} stroke={K.line} strokeWidth="1" strokeLinejoin="round" />
      <path d={poly(soleM)} fill={far ? '#6d6a60' : K.iv3} stroke={K.line} strokeWidth="0.6" strokeLinejoin="round" />
      <path d={smoothClosed(plus, 0.5)} fill={far ? K.farUp : g('up')} stroke={far ? K.line : '#0a0d0c'} strokeWidth="1.1" strokeLinejoin="round" />
      <path d={smoothClosed(plus, 0.5)} fill="none" stroke="#e9e4d2" strokeOpacity={far ? 0.16 : 0.34} strokeWidth="0.8" strokeLinejoin="round" />
      <path d={poly(sole)} fill={far ? '#8a877b' : g('sole')} stroke={K.line} strokeWidth="0.7" strokeLinejoin="round" />
      {!far && <path d={laces.join('')} stroke={K.iv2} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.85" />}
      {!far && <path d={smoothClosed(plus, 0.5)} fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="1" transform="translate(-0.6 -0.9)" />}
    </g>
  );
}

function ArmGfx({ cam, arm, far, uid }: { cam: number; arm: Arm; far: boolean; uid: string }) {
  const sh = px(cam, arm.shoulder);
  const el = px(cam, arm.elbow);
  const wr = px(cam, arm.wrist);
  const hd = px(cam, arm.hand);
  const skin = `url(#${uid}-${far ? 'skinf' : 'skin'})`;
  return (
    <g>
      <path d={capsule(sh, rp(0.05), el, rp(0.04))} fill={skin} />
      <path d={capsule(el, rp(0.04), wr, rp(0.03))} fill={skin} />
      <circle cx={f1(hd[0])} cy={f1(hd[1])} r={rp(0.036)} fill={skin} />
      <path d={capsule(sh, rp(0.062), lerp2(sh, el, 0.55), rp(0.055))} fill={far ? K.shirtFar : `url(#${uid}-shirt)`} />
      <path d={bandPath(sh, el, 0.53, rp(0.056))} stroke={K.trim} strokeWidth="2.4" fill="none" opacity={far ? 0.5 : 0.95} />
    </g>
  );
}

export interface FigureProps {
  m: TechMotion;
  frame: Frame;
  /** topun son konumları (en eskiden yeniye) — hızlı hareketi okunur kılan soluk iz */
  trail?: readonly BallState[];
  /** erişilebilir ad (evre dahil) */
  label: string;
  className?: string;
}

/** Topun tek karedeki çizimi (desen `r` derece döner). */
function BallGfx({ cam, b, uid }: { cam: number; b: BallState; uid: string }) {
  const c = px(cam, [b.x, b.y]);
  const R = rp(SEG.ball);
  return (
    <g>
      <g transform={`translate(${f1(c[0])} ${f1(c[1])}) scale(${f2(R)})`}>
        <circle r="1" fill={`url(#${uid}-ballb)`} />
        <g clipPath={`url(#${uid}-ballc)`}>
          <g transform={`rotate(${f1(-b.r)})`}>
            <path d={BALL.seams} fill="none" stroke="#6f6e63" strokeOpacity=".75" strokeWidth=".05" strokeLinecap="round" />
            {BALL.patches.map((d, i) => (
              <path key={i} d={d} fill={`url(#${uid}-ballp)`} stroke="#0b0d0c" strokeWidth=".03" strokeLinejoin="round" />
            ))}
          </g>
          <circle r="1" fill={`url(#${uid}-balls)`} />
          <ellipse cx="-.36" cy="-.42" rx=".26" ry=".14" transform="rotate(-38 -.36 -.42)" fill="#fff" fillOpacity=".5" />
        </g>
        <circle r=".99" fill="none" stroke="#1b1e1c" strokeOpacity=".6" strokeWidth=".03" />
      </g>
    </g>
  );
}
const BALL = ballGeometry();
const LENS_R = 62;
const LENS_K = 2.7;
const sstep = (a: number, b: number, x: number) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

export function Figure({ m, frame, trail, label, className }: FigureProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { sk, ball, glow } = frame;
  const cam = m.cam;
  const P = (p: Vec2) => px(cam, p);
  const near = legGfx(cam, sk.near);
  const far = legGfx(cam, sk.far);
  const torso = smoothClosed(torsoPts(sk).map(P), 0.5);
  const pel = P(sk.pelvis);
  const sho = P(sk.shoulder);
  const head = P(sk.head);
  const neckTop = P(lerp2(sk.shoulder, sk.head, 0.78));
  const yShadow = GY + 3;

  // top, yakın ayağın önünde mi arkasında mı çizilsin: derinlik (z) karşılaştırması
  // (kalçaların yanal 0,09 m ofseti rig'de yok; sıralama için eklenir)
  const nearZ = footPoint(sk.near.foot, 0.07, 0, 0)[2] + 0.09;
  const farZ = footPoint(sk.far.foot, 0.07, 0, 0)[2] - 0.09;
  const ballBehind = ball.z < nearZ - 0.01; // yakın bacağın arkasında
  const ballFarBehind = ball.z < farZ - 0.02; // uzak bacağın da arkasında

  // temas bölgeleri
  const zones = m.zones === 'alin' ? [] : m.zones;
  const contactZone = m.contact === 'alin' ? null : m.contact;
  const k = contactAt(m, sk);
  const kc = P(k.p);
  const patches = zones.map((z) => ({ z, ...zonePatch(sk.near.foot, z) }));

  // yakın çekim: temas anında, sahnenin temas noktasından uzak yanında
  const vb = viewBoxFor(m.top);
  // sol üst köşe (üstten bakış kutusu sağ üsttedir); temas noktası solda ise sahnenin ortasına
  const lx = kc[0] >= 190 ? LENS_R + 22 : 300;
  const ly = vb.y0 + LENS_R + 14;
  const zoneTag = (m.contact === 'alin' ? 'Alın' : ZONES[m.contact].short).toLocaleUpperCase('tr-TR');
  const lensOp = sstep(0.03, 0.4, glow);
  const lensOn = lensOp > 0.001;

  const trailPts = (trail ?? []).map((b) => P([b.x, b.y]));
  const shadowK = Math.max(0, 1 - (ball.y - SEG.ball) * 2.2);
  const g = (n: string) => `url(#${uid}-${n})`;

  return (
    <svg className={className ?? 'tm-svg'} viewBox={vb.box} preserveAspectRatio="xMinYMax slice" role="img" aria-label={label} data-phase={frame.phase} focusable="false" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${uid}-skin`} gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="345">
          <stop offset="0" stopColor={K.limbHi} />
          <stop offset="1" stopColor={K.limbLo} />
        </linearGradient>
        <linearGradient id={`${uid}-skinf`} gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="345">
          <stop offset="0" stopColor={K.farHi} />
          <stop offset="1" stopColor={K.farLo} />
        </linearGradient>
        <linearGradient id={`${uid}-shirt`} gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="250">
          <stop offset="0" stopColor={K.shirtHi} />
          <stop offset="1" stopColor={K.shirtLo} />
        </linearGradient>
        <linearGradient id={`${uid}-shorts`} gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="260">
          <stop offset="0" stopColor={K.shortsHi} />
          <stop offset="1" stopColor={K.shortsLo} />
        </linearGradient>
        <linearGradient id={`${uid}-sock`} gradientUnits="userSpaceOnUse" x1="0" y1="250" x2="0" y2="345">
          <stop offset="0" stopColor={K.sockHi} />
          <stop offset="1" stopColor={K.sockLo} />
        </linearGradient>
        <linearGradient id={`${uid}-up`} gradientUnits="userSpaceOnUse" x1="0" y1="290" x2="0" y2="346">
          <stop offset="0" stopColor={K.up1} />
          <stop offset="0.55" stopColor={K.up2} />
          <stop offset="1" stopColor={K.up3} />
        </linearGradient>
        <linearGradient id={`${uid}-sole`} gradientUnits="userSpaceOnUse" x1="0" y1="318" x2="0" y2="346">
          <stop offset="0" stopColor="#e8e2d0" />
          <stop offset="1" stopColor="#9a968a" />
        </linearGradient>
        <linearGradient id={`${uid}-ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b3a31" />
          <stop offset="1" stopColor="#0c1715" />
        </linearGradient>
        <radialGradient id={`${uid}-ballb`} cx="0.36" cy="0.3" r="0.95">
          <stop offset="0" stopColor="#fffdf6" />
          <stop offset="0.55" stopColor="#ece7d8" />
          <stop offset="1" stopColor="#a9a698" />
        </radialGradient>
        <radialGradient id={`${uid}-balls`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#0a0c0b" stopOpacity="0.5" />
        </radialGradient>
        <linearGradient id={`${uid}-ballp`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a413d" />
          <stop offset="1" stopColor="#0f1210" />
        </linearGradient>
        <clipPath id={`${uid}-ballc`}>
          <circle r="1" />
        </clipPath>
        <radialGradient id={`${uid}-lensbg`} cx="0.5" cy="0.5" r="0.7">
          <stop offset="0" stopColor="#1d3631" />
          <stop offset="1" stopColor="#0c1715" />
        </radialGradient>
        <radialGradient id={`${uid}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={K.accentHi} stopOpacity="0.95" />
          <stop offset="0.5" stopColor={K.accent} stopOpacity="0.5" />
          <stop offset="1" stopColor={K.accent} stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <filter id={`${uid}-blur6`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <g id={`${uid}-fig`}>
      {/* zemin */}
      <rect x="0" y={GY} width={VW} height={VH - GY} fill={g('ground')} />
      <path d={`M0 ${GY}H${VW}`} stroke="#f3f0e5" strokeOpacity=".28" strokeWidth="1.2" />
      {Array.from({ length: 12 }, (_, i) => {
        const wx = Math.ceil(cam * 2) / 2 + i * 0.5;
        const x = (wx - cam) * SC;
        if (x < 0 || x > VW) return null;
        const major = Math.abs(wx - Math.round(wx)) < 1e-6;
        return <path key={i} d={`M${f1(x)} ${GY}V${GY + (major ? 12 : 7)}`} stroke="#f3f0e5" strokeOpacity={major ? 0.3 : 0.16} strokeWidth="1" />;
      })}

      {/* gölgeler */}
      <ellipse cx={f1(pel[0])} cy={yShadow} rx={rp(0.42)} ry="4.5" fill="#000" opacity=".4" filter={g('blur')} />
      <ellipse cx={f1(P([ball.x, 0])[0])} cy={yShadow} rx={rp(SEG.ball * 0.95)} ry="3.2" fill="#000" opacity={f2(0.5 * shadowK)} filter={g('blur')} />

      {/* ball izi */}
      {trailPts.map((q, i) => (
        <circle key={i} cx={f1(q[0])} cy={f1(q[1])} r={rp(SEG.ball) * (0.35 + 0.4 * (i / Math.max(1, trailPts.length)))} fill="#f3f0e5" opacity={f2(0.03 + 0.11 * (i / Math.max(1, trailPts.length)))} />
      ))}

      {ballFarBehind && <BallGfx cam={cam} b={ball} uid={uid} />}

      {/* uzak taraf: kol, bacak */}
      <ArmGfx cam={cam} arm={sk.armF} far uid={uid} />
      <g>
        <path d={far.thigh} fill={g('skinf')} />
        <path d={far.shank} fill={g('skinf')} />
        <path d={far.sock} fill={K.sockFar} />
        <path d={far.shorts} fill={K.shortsFar} />
        <Boot cam={cam} foot={sk.far.foot} far uid={uid} />
      </g>

      {ballBehind && !ballFarBehind && <BallGfx cam={cam} b={ball} uid={uid} />}

      {/* gövde ve baş */}
      <g>
        <circle cx={f1(pel[0])} cy={f1(pel[1])} r={rp(0.112)} fill={g('shorts')} />
        <path d={torso} fill={g('shirt')} stroke={K.line} strokeOpacity=".5" strokeWidth="0.8" strokeLinejoin="round" />
        <path d={capsule(neckTop, rp(0.047), sho, rp(0.05))} fill={g('skin')} />
        <circle cx={f1(head[0])} cy={f1(head[1])} r={rp(SEG.headR)} fill={g('skin')} />
        <path d={`M${P(headPt(sk, 14, 0.98)).map(f1).join(' ')}L${P(headPt(sk, -2, 1.3)).map(f1).join(' ')}L${P(headPt(sk, -16, 0.98)).map(f1).join(' ')}Z`} fill={g('skin')} />
        <path d={hairPath(cam, sk)} fill={K.hair} />
        <circle cx={f1(P(headPt(sk, 12, 0.5))[0])} cy={f1(P(headPt(sk, 12, 0.5))[1])} r="1.7" fill={K.line} />
      </g>

      {/* yakın taraf: bacak */}
      <g>
        <path d={near.thigh} fill={g('skin')} />
        <path d={near.shank} fill={g('skin')} />
        <path d={near.sock} fill={g('sock')} />
        <path d={near.band} stroke={K.shirtLo} strokeWidth="3.4" fill="none" />
        <path d={near.shorts} fill={g('shorts')} />
        <Boot cam={cam} foot={sk.near.foot} far={false} uid={uid} />
      </g>

      {!ballBehind && <BallGfx cam={cam} b={ball} uid={uid} />}

      {/* yakın kol */}
      <ArmGfx cam={cam} arm={sk.armN} far={false} uid={uid} />

      {/* temas bölgeleri: yalnızca tekniğin foot[] listesindeki bölgeler; temas anında parlar */}
      <g className="tm-zones">
        {patches.map(({ z, poly: pp, facing }) => {
          // yalnızca temas penceresinde görünür: asıl bölge parlar, foot[] listesindeki diğerleri sönük çizgiyle işaretlenir
          if (glow < 0.02) return null;
          const active = z === contactZone;
          const back = facing < -0.15;
          const a = active ? 0.15 + 0.75 * glow : 0.12 * glow;
          const d = poly(pp.map(P));
          return (
            <g key={z} data-zone={z} data-active={active && glow > 0.05 ? 'true' : 'false'}>
              {active && <path d={d} fill={K.accent} opacity={f2(0.75 * glow)} filter={g('blur')} />}
              <path d={d} fill={K.accent} fillOpacity={f2(a)} stroke={K.accentHi} strokeOpacity={f2((active ? 0.45 + 0.5 * glow : 0.5) * Math.min(1, glow * 1.6))} strokeWidth={active ? 1.4 : 1} strokeDasharray={back ? '3 2.4' : undefined} strokeLinejoin="round" />
            </g>
          );
        })}
        {m.contact !== 'alin' || glow > 0 ? (
          <g opacity={f2(glow)}>
            <circle cx={f1(kc[0])} cy={f1(kc[1])} r={f1(8 + 20 * (1 - glow))} fill="none" stroke={K.accentHi} strokeWidth="1.6" strokeOpacity=".9" />
            <circle cx={f1(kc[0])} cy={f1(kc[1])} r="16" fill={g('glow')} opacity=".7" />
          </g>
        ) : null}
      </g>
      </g>

      {/* yakın çekim: temas anında, değen yüzey ve top 2,7 kat büyütülerek gösterilir */}
      {lensOn && (
        <g opacity={f2(lensOp)} aria-hidden="true" data-lens>
          <path d={`M${f1(lx)} ${f1(ly)}L${f1(kc[0])} ${f1(kc[1])}`} stroke={K.accent} strokeOpacity=".45" strokeWidth="1.2" strokeDasharray="3 4" />
          <clipPath id={`${uid}-lens`}>
            <circle cx={f1(lx)} cy={f1(ly)} r={LENS_R} />
          </clipPath>
          <circle cx={f1(lx)} cy={f1(ly)} r={LENS_R + 4} fill="#050b0a" fillOpacity=".55" filter={g('blur')} />
          <g clipPath={`url(#${uid}-lens)`}>
            <rect x={lx - LENS_R} y={ly - LENS_R} width={2 * LENS_R} height={2 * LENS_R} fill={g('lensbg')} />
            <use href={`#${uid}-fig`} transform={`translate(${f1(lx - LENS_K * kc[0])} ${f1(ly - LENS_K * kc[1])}) scale(${LENS_K})`} />
          </g>
          <circle cx={f1(lx)} cy={f1(ly)} r={LENS_R} fill="none" stroke={K.accent} strokeWidth="2" strokeOpacity=".9" />
          {/* değen yüzeyin adı (BootMap ile aynı kısa ad) */}
          <g transform={`translate(${f1(lx)} ${f1(ly + LENS_R + 2)})`}>
            <rect x={-(zoneTag.length * 5.2 + 12)} y="-11" width={zoneTag.length * 10.4 + 24} height="22" rx="11" fill={K.accent} />
            <text textAnchor="middle" y="4.6" fontSize="12.5" fontWeight="700" letterSpacing=".06em" fill="#0a1403" style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>
              {zoneTag}
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}
