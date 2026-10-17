import { useId } from 'react';
import { ballGeometry } from '@/lib/boot-ball';
import { DEG, SEG, bootShape, footPoint, zonePatch, type Arm, type Foot, type Leg, type Skeleton, type Vec2 } from '@/lib/motion/rig';
import { contactAt, type Frame, type TechMotion } from '@/lib/motion/timeline';
import type { BallState } from '@/lib/motion/rig';
import { GY, SC, VH, VW, capsule, f1, f2, poly, smoothClosed, toPx } from './draw';

// Hareket sahnesi: bir kareyi (Frame) yandan görünümde çizen saf SVG bileşeni. Durum yok; oynatıcı ve statik şerit aynı bileşeni kullanır.
// Işık sol üstten gelir. Yazı yok (SVG ölçeklenince okunmaz); etiketler HTML tarafında.

/** Oyuncu donanımı: nötr "manken" gövde, fildişi forma, koyu şort; krampon BootMap ile aynı grafit/fildişi paleti. */
const K = {
  limbHi: '#e6ece6',
  limbLo: '#9eaca5',
  farHi: '#8b9993',
  farLo: '#56635e',
  shirtHi: '#f4f2e6',
  shirtLo: '#bdbbab',
  shirtFar: '#8d8c80',
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
  up1: '#48504b',
  up2: '#2c3330',
  up3: '#151a18',
  farUp: '#1b211f',
  iv1: '#f3eedf',
  iv2: '#cdc8b6',
  iv3: '#98948a',
  studs: '#0b0e0d',
};

const px = (cam: number, p: Vec2) => toPx(cam, p);
const rp = (m: number) => m * SC;
const lerp2 = (a: Vec2, b: Vec2, t: number): Vec2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

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
    band: capsule(lerp2(knee, ank, 0.4), rp(0.054), lerp2(knee, ank, 0.5), rp(0.051)),
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
      <path d={smoothClosed(plus, 0.5)} fill={far ? K.farUp : g('up')} stroke={K.line} strokeWidth="1.1" strokeLinejoin="round" />
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
      <path d={capsule(sh, rp(0.044), el, rp(0.036))} fill={skin} />
      <path d={capsule(el, rp(0.036), wr, rp(0.027))} fill={skin} />
      <circle cx={f1(hd[0])} cy={f1(hd[1])} r={rp(0.03)} fill={skin} />
      <path d={capsule(sh, rp(0.056), lerp2(sh, el, 0.55), rp(0.05))} fill={far ? K.shirtFar : `url(#${uid}-shirt)`} />
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
  const footMidZ = footPoint(sk.near.foot, 0.07, 0, 0)[2];
  const ballBehind = ball.z < footMidZ - 0.01;

  // temas bölgeleri
  const zones = m.zones === 'alin' ? [] : m.zones;
  const contactZone = m.contact === 'alin' ? null : m.contact;
  const k = contactAt(m, sk);
  const kc = P(k.p);
  const patches = zones.map((z) => ({ z, ...zonePatch(sk.near.foot, z) }));

  const trailPts = (trail ?? []).map((b) => P([b.x, b.y]));
  const shadowK = Math.max(0, 1 - (ball.y - SEG.ball) * 2.2);
  const g = (n: string) => `url(#${uid}-${n})`;

  return (
    <svg className={className ?? 'tm-svg'} viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={label} data-phase={frame.phase} focusable="false" xmlns="http://www.w3.org/2000/svg">
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
        <circle key={i} cx={f1(q[0])} cy={f1(q[1])} r={rp(SEG.ball) * (0.35 + 0.4 * (i / Math.max(1, trailPts.length)))} fill="#f3f0e5" opacity={f2(0.04 + 0.16 * (i / Math.max(1, trailPts.length)))} />
      ))}

      {/* uzak taraf: kol, bacak */}
      <ArmGfx cam={cam} arm={sk.armF} far uid={uid} />
      <g>
        <path d={far.thigh} fill={g('skinf')} />
        <path d={far.shank} fill={g('skinf')} />
        <path d={far.sock} fill={K.sockFar} />
        <path d={far.shorts} fill={K.shortsFar} />
        <Boot cam={cam} foot={sk.far.foot} far uid={uid} />
      </g>

      {ballBehind && <BallGfx cam={cam} b={ball} uid={uid} />}

      {/* gövde ve baş */}
      <g>
        <circle cx={f1(pel[0])} cy={f1(pel[1])} r={rp(0.112)} fill={g('shorts')} />
        <path d={torso} fill={g('shirt')} stroke={K.line} strokeOpacity=".5" strokeWidth="0.8" strokeLinejoin="round" />
        <path d={capsule(neckTop, rp(0.047), sho, rp(0.05))} fill={g('skin')} />
        <circle cx={f1(head[0])} cy={f1(head[1])} r={rp(SEG.headR)} fill={g('skin')} />
        <path d={hairPath(cam, sk)} fill={K.hair} />
        <circle cx={f1(P(headPt(sk, 12, 0.5))[0])} cy={f1(P(headPt(sk, 12, 0.5))[1])} r="1.7" fill={K.line} />
      </g>

      {/* yakın taraf: bacak */}
      <g>
        <path d={near.thigh} fill={g('skin')} />
        <path d={near.shank} fill={g('skin')} />
        <path d={near.sock} fill={g('sock')} />
        <path d={near.band} fill={K.accent} />
        <path d={near.shorts} fill={g('shorts')} />
        <Boot cam={cam} foot={sk.near.foot} far={false} uid={uid} />
      </g>

      {!ballBehind && <BallGfx cam={cam} b={ball} uid={uid} />}

      {/* yakın kol */}
      <ArmGfx cam={cam} arm={sk.armN} far={false} uid={uid} />

      {/* temas bölgeleri: yalnızca tekniğin foot[] listesindeki bölgeler; temas anında parlar */}
      <g className="tm-zones">
        {patches.map(({ z, poly: pp, facing }) => {
          const active = z === contactZone;
          const a = active ? 0.2 + 0.7 * glow : 0.16;
          const back = facing < -0.15;
          const d = poly(pp.map(P));
          return (
            <g key={z} data-zone={z} data-active={active && glow > 0.05 ? 'true' : 'false'}>
              {active && glow > 0.02 && <path d={d} fill={K.accent} opacity={f2(0.75 * glow)} filter={g('blur')} />}
              <path d={d} fill={K.accent} fillOpacity={f2(a)} stroke={K.accentHi} strokeOpacity={f2(active ? 0.45 + 0.5 * glow : 0.45)} strokeWidth={active ? 1.4 : 1} strokeDasharray={back ? '3 2.4' : undefined} strokeLinejoin="round" />
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
    </svg>
  );
}
