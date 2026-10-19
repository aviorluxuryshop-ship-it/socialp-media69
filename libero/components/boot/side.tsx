import type { FootZone } from '@/data/types';
import { GEO, SIDE_UPPER, SIDE_SOLE } from '@/lib/boot-shapes';
import { Ball } from './ball';
import { C, id, ref } from './defs';
import { Stitch, ZoneLayer } from './parts';

// Yan görünüm (burun solda). İç yüz ve dış yüz aynı gövdeyi paylaşır.
// Sağ ayağın dış yüzü bu çizimin yatay aynasıdır (BootStage çevirir).

// Bağcık hattı: boğazdan dile doğru
const A = { x: 254, y: 186 };
const B = { x: 370, y: 119 };
const dx = B.x - A.x;
const dy = B.y - A.y;
const len = Math.hypot(dx, dy);
const ux = dx / len;
const uy = dy / len;
// bağcık hattına dik, yukarı-dışa
const nx = uy;
const ny = -ux;

const EYELETS = [0.04, 0.2, 0.36, 0.52, 0.68, 0.84, 0.98].map((t) => ({ x: A.x + dx * t, y: A.y + dy * t }));

const f1 = (n: number) => Math.round(n * 10) / 10;
/** Bağcık hattı boyunca şerit çokgeni: up = üst kenar uzaklığı, down = alt kenar uzaklığı. */
function band(up: number, down: number, ext = 0, close = true): string {
  const ax = A.x - ux * ext;
  const ay = A.y - uy * ext;
  const bx = B.x + ux * ext;
  const by = B.y + uy * ext;
  return `M${f1(ax + nx * up)} ${f1(ay + ny * up)}L${f1(bx + nx * up)} ${f1(by + ny * up)}L${f1(bx - nx * down)} ${f1(by - ny * down)}L${f1(ax - nx * down)} ${f1(ay - ny * down)}${close ? 'Z' : ''}`;
}

// kramponun alt gövdesinde yer alan çiviler (yakın taraf, tabana göre x)
const STUDS_NEAR = [88, 156, 228, 300, 462, 532, 584];
const STUDS_FAR = [122, 192, 264, 336, 498, 560];
const PLATE_BOTTOM = 324;

function Stud({ u, x, h, far }: { u: string; x: number; h: number; far?: boolean }) {
  const top = PLATE_BOTTOM;
  const w0 = far ? 11 : 15;
  const w1 = far ? 7 : 9.5;
  const y1 = top + h;
  return (
    <g opacity={far ? 0.78 : 1}>
      {!far && <ellipse cx={x + 6} cy={y1 + 3} rx={w1 + 7} ry="3" fill="#000" opacity=".45" filter={ref(u, 'blur3')} />}
      <path d={`M${x - w0} ${top - 1}L${x - w1} ${y1 - 4}Q${x - w1 + 1} ${y1 + 2} ${x} ${y1 + 2}Q${x + w1 - 1} ${y1 + 2} ${x + w1} ${y1 - 4}L${x + w0} ${top - 1}Z`} fill={far ? '#171b19' : ref(u, 'studV')} stroke="#050706" strokeWidth="1" strokeLinejoin="round" />
      {!far && (
        <>
          <ellipse cx={x} cy={top + 1} rx={w0 + 1.5} ry="3.2" fill="#0b0e0d" opacity=".7" />
          <path d={`M${x - w0 + 4} ${top + 4}L${x - w1 + 1.4} ${y1 - 6}`} stroke="#fff" strokeOpacity=".2" strokeWidth="1.8" strokeLinecap="round" />
          <path d={`M${x - w1 + 2} ${y1 - 2}Q${x} ${y1 + 1.4} ${x + w1 - 2} ${y1 - 2}`} stroke="#fff" strokeOpacity=".16" strokeWidth="1.2" fill="none" />
        </>
      )}
    </g>
  );
}

export function SideBoot({ u, kind, active, flip, showBall, ballZone }: { u: string; kind: 'ic' | 'dis'; active: ReadonlySet<FootZone>; flip: boolean; showBall: boolean; ballZone: FootZone | null }) {
  const view = kind;
  const g = GEO[view];
  const ball = ballZone ? g.zones[ballZone]?.ball : undefined;
  const cid = id(u, 'sclip');
  const eyestay = band(21, 19, 12);
  return (
    <g transform={`translate(${g.ox} ${g.oy})`} className={`boot-art boot-art--${view}`}>
      <defs>
        <clipPath id={cid}>
          <path d={SIDE_UPPER} />
        </clipPath>
      </defs>

      {/* zemin gölgesi */}
      <ellipse cx="330" cy="358" rx="305" ry="13" fill="#000" opacity=".6" filter={ref(u, 'blur6')} />
      <ellipse cx="330" cy="355" rx="255" ry="6" fill="#000" opacity=".55" filter={ref(u, 'blur3')} />

      {/* uzak taraf çivileri */}
      {STUDS_FAR.map((x) => (
        <Stud key={`f${x}`} u={u} x={x} h={x > 400 ? 23 : 26} far />
      ))}

      {/* taban plakası */}
      <path d={SIDE_SOLE} fill={ref(u, 'plate')} stroke="#0a0d0c" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M46 318C60 322 90 322 130 322L470 322C520 322 566 322 596 316" stroke="#000" strokeOpacity=".3" strokeWidth="3" fill="none" />
      <path d="M48 300H610" stroke="#fff" strokeOpacity=".75" strokeWidth="1.4" />
      <path d="M44 307C48 314 58 317 72 318M520 318C560 318 590 312 604 304" stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" fill="none" />
      {/* bükülme oluğu */}
      <path d="M232 297V323M388 297V323" stroke="#000" strokeOpacity=".24" strokeWidth="2" />
      {STUDS_NEAR.map((x) => (
        <Stud key={x} u={u} x={x} h={x > 400 ? 25 : 28} />
      ))}

      {/* üst gövde */}
      <path d={SIDE_UPPER} fill={ref(u, 'upperV')} />
      <g clipPath={`url(#${cid})`}>
        <rect x="0" y="60" width="660" height="260" fill={ref(u, 'tex')} />

        {/* burun kapağı */}
        <path d="M30 300C24 270 34 240 70 226C112 214 140 224 150 236C160 250 164 276 156 300Z" fill="#fff" fillOpacity=".055" />
        <path d="M150 236C162 252 164 276 156 300" stroke="#000" strokeOpacity=".5" strokeWidth="3" fill="none" />
        <Stitch d="M146 236C158 252 160 276 152 298" />
        <path d="M150 236C162 252 164 276 156 300" stroke="#efeadc" strokeOpacity=".14" strokeWidth="1" fill="none" transform="translate(2 -1)" />

        {/* ön yan panel: bağcık altından taban kenarına süzülen dikiş */}
        <path d="M302 300C292 270 300 236 330 208" stroke="#000" strokeOpacity=".34" strokeWidth="2.6" fill="none" />
        <Stitch d="M298 300C288 270 296 236 326 208" op={0.22} w={1} />

        {/* topuk koruyucusu */}
        <path d="M606 300L610 160C602 146 580 150 560 164C528 186 500 214 494 252C490 276 494 292 500 300Z" fill="#161a18" />
        <path d="M606 300L610 160C602 146 580 150 560 164C528 186 500 214 494 252C490 276 494 292 500 300Z" fill={ref(u, 'tex')} />
        <path d="M560 164C528 186 500 214 494 252C490 276 494 292 500 300" stroke="#000" strokeOpacity=".6" strokeWidth="3.4" fill="none" />
        <path d="M566 170C536 190 508 216 503 252C500 274 504 290 509 298" stroke="#efeadc" strokeOpacity=".3" strokeWidth="1.2" strokeDasharray="5 4" fill="none" />
        <path d="M560 164C528 186 500 214 494 252C490 276 494 292 500 300" stroke="#efeadc" strokeOpacity=".16" strokeWidth="1" fill="none" transform="translate(-2 0)" />

        {/* yaka içi (uzak tarafın iç astarı görünür) */}
        <path d="M434 108C446 130 462 152 486 164C514 176 542 152 566 130L560 124C540 142 516 160 490 154C466 148 450 128 440 94Z" fill={ref(u, 'liner')} />
        <path d="M432 104C444 130 462 154 486 166C514 178 542 154 566 132" stroke="#313835" strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M432 104C444 130 462 154 486 166C514 178 542 154 566 132" stroke="#fff" strokeOpacity=".12" strokeWidth="2" fill="none" transform="translate(0 -3)" />
        <path d="M434 113C446 136 463 158 487 170C516 182 544 158 568 136" stroke="#efeadc" strokeOpacity=".3" strokeWidth="1.1" strokeDasharray="5 4" fill="none" />

        {/* topuk bandı (fildişi) */}
        <path d="M566 130C580 121 594 124 600 138C606 156 608 176 609 192C598 176 584 164 566 160Z" fill={ref(u, 'trim')} />
        <path d="M566 130C580 121 594 124 600 138C606 156 608 176 609 192" stroke="#000" strokeOpacity=".35" strokeWidth="1.2" fill="none" />
        <path d="M570 142C580 138 590 142 594 152" stroke="#fff" strokeOpacity=".7" strokeWidth="1.4" fill="none" />

        {/* dil: yastıklı, dikişli; üstte fildişi tutma şeridi */}
        <path d="M236 170C296 142 342 114 372 92C384 76 400 70 416 74C430 78 436 90 432 104L402 152L280 212Z" fill={ref(u, 'tongue')} />
        <path d="M236 170C296 142 342 114 372 92C384 76 400 70 416 74C430 78 436 90 432 104" stroke="#000" strokeOpacity=".6" strokeWidth="2.6" fill="none" />
        <path d="M378 94C386 80 400 74 414 78" stroke="#fff" strokeOpacity=".18" strokeWidth="2.4" fill="none" />
        <path d="M380 99C388 87 402 82 416 86C426 90 428 98 426 106" stroke="#efeadc" strokeOpacity=".3" strokeWidth="1.1" strokeDasharray="5 4" fill="none" />
        <path d="M396 80C406 74 418 76 424 84L422 94C416 88 408 86 400 90Z" fill={ref(u, 'trim')} stroke="#000" strokeOpacity=".4" strokeWidth="1" />

        {/* gözlük bandı */}
        <path d={eyestay} fill="#000" fillOpacity=".5" transform="translate(0 3)" filter={ref(u, 'blur3')} />
        <path d={eyestay} fill={ref(u, 'eyestay')} stroke="#0a0d0c" strokeWidth="1.2" strokeLinejoin="round" />
        <path d={band(20, -4, 10)} fill="#fff" fillOpacity=".07" />
        <path d={band(14, 14, 4, false)} fill="none" stroke="#efeadc" strokeOpacity=".28" strokeWidth="1.2" strokeDasharray="5 4" />

        {/* hacim: üstten ışık, alta ve kenarlara doğru koyulaşma */}
        <rect x="0" y="66" width="660" height="240" fill={ref(u, 'sheen')} />
        <path d={SIDE_UPPER} fill="none" stroke="#000" strokeOpacity=".45" strokeWidth="26" filter={ref(u, 'blur6')} />
        <ellipse cx="148" cy="236" rx="56" ry="13" fill="#fff" fillOpacity=".11" filter={ref(u, 'blur6')} transform="rotate(-18 148 236)" />
        <ellipse cx="318" cy="196" rx="70" ry="9" fill="#fff" fillOpacity=".06" filter={ref(u, 'blur6')} transform="rotate(-30 318 196)" />
        <path d={SIDE_UPPER} fill="none" stroke="#efeadc" strokeOpacity=".22" strokeWidth="2.2" transform="translate(0 2.4)" />
        {/* üst gövde–taban birleşiminde gölge */}
        <rect x="0" y="286" width="660" height="14" fill="#000" fillOpacity=".3" filter={ref(u, 'blur3')} />

        {/* temas bölgeleri */}
        <ZoneLayer u={u} zones={g.zones} active={active} />
      </g>
      <path d={SIDE_UPPER} fill="none" stroke="#050706" strokeOpacity=".85" strokeWidth="1.6" strokeLinejoin="round" />

      {/* bağcık çubukları: gözlükten dilin üstüne geçer */}
      {EYELETS.map((e, i) => {
        const x2 = e.x + nx * 31 - ux * 11;
        const y2 = e.y + ny * 31 - uy * 11;
        const mx = (e.x + x2) / 2 + nx * 2.5;
        const my = (e.y + y2) / 2 + ny * 2.5;
        const d = `M${e.x} ${e.y}Q${mx} ${my} ${x2} ${y2}`;
        return (
          <g key={i}>
            <path d={d} stroke="#000" strokeOpacity=".6" strokeWidth="10" strokeLinecap="round" fill="none" transform="translate(0 2)" />
            <path d={d} stroke="#e7e2d1" strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d={d} stroke="#9c9886" strokeWidth="2" strokeLinecap="round" fill="none" transform="translate(1 2)" />
            <path d={d} stroke="#fff" strokeOpacity=".85" strokeWidth="1.5" strokeLinecap="round" fill="none" transform="translate(-1 -1.4)" />
          </g>
        );
      })}
      {EYELETS.map((e, i) => (
        <g key={`ee${i}`}>
          <circle cx={e.x} cy={e.y} r="6.2" fill="#050706" />
          <circle cx={e.x} cy={e.y} r="6.2" fill="none" stroke={C.iv3} strokeWidth="1.9" />
          <circle cx={e.x - 1} cy={e.y - 1.2} r="6.2" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth=".9" strokeDasharray="6 30" />
        </g>
      ))}

      {showBall && ball && <Ball u={u} x={ball.x} y={ball.y} r={ball.r} shadow={!ball.air} shadowDx={flip ? -8 : 8} />}
    </g>
  );
}
