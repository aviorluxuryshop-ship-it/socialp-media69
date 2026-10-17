import type { FootZone } from '@/data/types';
import { GEO, SIDE_UPPER, SIDE_SOLE } from '@/lib/boot-shapes';
import { Ball } from './ball';
import { C, id, ref } from './defs';
import { Stitch, ZoneLayer } from './parts';

// Yan görünüm (burun solda). İç yüz ve dış yüz aynı gövdeyi paylaşır; küçük ayrıntılar yüze göre değişir.
// Sağ ayağın dış yüzü bu çizimin yatay aynasıdır (BootMap çevirir).

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

// kramponun alt gövdesinde yer alan çiviler (yakın taraf, tabana göre x)
const STUDS_NEAR = [88, 156, 228, 300, 462, 532, 584];
const STUDS_FAR = [122, 192, 264, 336, 498, 560];

function Stud({ u, x, h, far }: { u: string; x: number; h: number; far?: boolean }) {
  const top = 324;
  const w0 = far ? 11 : 15;
  const w1 = far ? 7 : 9.5;
  const y1 = top + h;
  return (
    <g opacity={far ? 0.72 : 1}>
      <path d={`M${x - w0} ${top - 1}L${x - w1} ${y1 - 3}Q${x} ${y1 + 3} ${x + w1} ${y1 - 3}L${x + w0} ${top - 1}Z`} fill={far ? '#161a18' : ref(u, 'studV')} stroke="#050706" strokeWidth="1" strokeLinejoin="round" />
      {!far && <path d={`M${x - w0 + 3} ${top + 2}L${x - w1 + 1.4} ${y1 - 5}`} stroke="#fff" strokeOpacity=".16" strokeWidth="1.6" strokeLinecap="round" />}
    </g>
  );
}

export function SideBoot({ u, kind, active, flip, showBall, ballZone }: { u: string; kind: 'ic' | 'dis'; active: ReadonlySet<FootZone>; flip: boolean; showBall: boolean; ballZone: FootZone | null }) {
  const view = kind;
  const g = GEO[view];
  const ball = ballZone ? g.zones[ballZone]?.ball : undefined;
  const cid = id(u, 'sclip');
  return (
    <g className={`boot-art boot-art--${view}`}>
      <defs>
        <clipPath id={cid}>
          <path d={SIDE_UPPER} />
        </clipPath>
      </defs>

      {/* zemin gölgesi */}
      <ellipse cx="330" cy="356" rx="300" ry="13" fill="#000" opacity=".6" filter={ref(u, 'blur6')} />
      <ellipse cx="330" cy="354" rx="250" ry="6" fill="#000" opacity=".5" filter={ref(u, 'blur3')} />

      {/* uzak taraf çivileri */}
      {STUDS_FAR.map((x) => (
        <Stud key={`f${x}`} u={u} x={x} h={x > 400 ? 24 : 27} far />
      ))}

      {/* taban plakası */}
      <path d={SIDE_SOLE} fill={ref(u, 'sole')} stroke="#0a0d0c" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M46 318C60 322 90 322 130 322L470 322C520 322 566 322 596 316" stroke="#000" strokeOpacity=".28" strokeWidth="3" fill="none" />
      <path d="M48 300H610" stroke="#fff" strokeOpacity=".7" strokeWidth="1.4" />
      <path d="M44 307C48 314 58 317 72 318M520 318C560 318 590 312 604 304" stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" fill="none" />
      {/* bükülme oluğu */}
      <path d="M232 297V323M388 297V323" stroke="#000" strokeOpacity=".22" strokeWidth="2" />
      {STUDS_NEAR.map((x) => (
        <Stud key={x} u={u} x={x} h={x > 400 ? 26 : 29} />
      ))}

      {/* üst gövde */}
      <path d={SIDE_UPPER} fill={ref(u, 'upperV')} />
      <g clipPath={`url(#${cid})`}>
        <rect x="0" y="60" width="660" height="260" fill={ref(u, 'tex')} />

        {/* dil: bağcık altında yastıklı koyu bölge */}
        <path d="M236 170C296 142 342 114 372 92C384 76 400 70 416 74C430 78 436 90 432 104L402 152L280 212Z" fill="#0d100f" />
        <path d="M378 94C386 80 400 74 414 78" stroke="#fff" strokeOpacity=".14" strokeWidth="2.4" fill="none" />

        {/* burun kapağı */}
        <path d="M30 300C24 270 34 240 70 226C112 214 140 224 150 236C160 250 164 276 156 300Z" fill="#fff" fillOpacity=".05" />
        <path d="M150 236C162 252 164 276 156 300" stroke="#000" strokeOpacity=".5" strokeWidth="3" fill="none" />
        <Stitch d="M146 236C158 252 160 276 152 298" />
        <path d="M150 236C162 252 164 276 156 300" stroke="#efeadc" strokeOpacity=".14" strokeWidth="1" fill="none" transform="translate(2 -1)" />

        {/* ön yan panel çizgisi: bağcık altından taban kenarına süzülen dikiş */}
        <path d="M302 300C292 270 300 236 330 208" stroke="#000" strokeOpacity=".34" strokeWidth="2.6" fill="none" />
        <Stitch d="M298 300C288 270 296 236 326 208" op={0.22} w={1} />

        {/* topuk koruyucusu */}
        <path d="M606 300L610 160C602 146 580 150 560 164C528 186 500 214 494 252C490 276 494 292 500 300Z" fill="#171b19" />
        <path d="M606 300L610 160C602 146 580 150 560 164C528 186 500 214 494 252C490 276 494 292 500 300Z" fill={ref(u, 'tex')} />
        <path d="M560 164C528 186 500 214 494 252C490 276 494 292 500 300" stroke="#000" strokeOpacity=".6" strokeWidth="3.4" fill="none" />
        <path d="M566 170C536 190 508 216 503 252C500 274 504 290 509 298" stroke="#efeadc" strokeOpacity=".3" strokeWidth="1.2" strokeDasharray="5 4" fill="none" />
        <path d="M560 164C528 186 500 214 494 252C490 276 494 292 500 300" stroke="#efeadc" strokeOpacity=".14" strokeWidth="1" fill="none" transform="translate(-2 0)" />

        {/* yaka içi (uzak tarafın iç astarı görünür) */}
        <path d="M434 108C446 130 462 152 486 164C514 176 542 152 566 130L560 124C540 142 516 160 490 154C466 148 450 128 440 94Z" fill={ref(u, 'liner')} />
        <path d="M432 104C444 130 462 154 486 166C514 178 542 154 566 132" stroke="#2f3633" strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M432 104C444 130 462 154 486 166C514 178 542 154 566 132" stroke="#fff" strokeOpacity=".1" strokeWidth="2" fill="none" transform="translate(0 -3)" />
        <path d="M434 113C446 136 463 158 487 170C516 182 544 158 568 136" stroke="#efeadc" strokeOpacity=".3" strokeWidth="1.1" strokeDasharray="5 4" fill="none" />

        {/* topuk bandı (ivory) */}
        <path d="M566 130C580 121 594 124 600 138C606 156 608 176 609 192C598 176 584 164 566 160Z" fill={ref(u, 'trim')} />
        <path d="M566 130C580 121 594 124 600 138C606 156 608 176 609 192" stroke="#000" strokeOpacity=".35" strokeWidth="1.2" fill="none" />
        <path d="M570 142C580 138 590 142 594 152" stroke="#fff" strokeOpacity=".7" strokeWidth="1.4" fill="none" />

        {/* bağcık şeridi (gözlük bandı) */}
        <path d={`M${A.x - 6} ${A.y + 4}L${B.x + 8} ${B.y + 4}`} stroke="#000" strokeOpacity=".5" strokeWidth="38" strokeLinecap="round" />
        <path d={`M${A.x - 6} ${A.y + 4}L${B.x + 8} ${B.y + 4}`} stroke="#323936" strokeWidth="35" strokeLinecap="round" />
        <path d={`M${A.x - 6} ${A.y + 4}L${B.x + 8} ${B.y + 4}`} stroke="#fff" strokeOpacity=".06" strokeWidth="18" strokeLinecap="round" />
        <path d={`M${A.x - 6 + nx * 15} ${A.y + 4 + ny * 15}L${B.x + 8 + nx * 15} ${B.y + 4 + ny * 15}`} stroke="#efeadc" strokeOpacity=".3" strokeWidth="1.2" strokeDasharray="5 4" fill="none" />
        <path d={`M${A.x - 6 - nx * 15} ${A.y + 4 - ny * 15}L${B.x + 8 - nx * 15} ${B.y + 4 - ny * 15}`} stroke="#efeadc" strokeOpacity=".3" strokeWidth="1.2" strokeDasharray="5 4" fill="none" />

        {EYELETS.map((e, i) => (
          <g key={`e${i}`}>
            <circle cx={e.x} cy={e.y} r="5.8" fill="#050706" />
            <circle cx={e.x} cy={e.y} r="5.8" fill="none" stroke={C.iv3} strokeWidth="1.8" />
            <circle cx={e.x - 1} cy={e.y - 1.2} r="5.8" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth=".9" strokeDasharray="6 30" />
          </g>
        ))}

        {/* hacim: sol üstten ışık; alta ve kenarlara doğru koyulaşma */}
        <path d={SIDE_UPPER} fill="none" stroke="#000" strokeOpacity=".45" strokeWidth="28" filter={ref(u, 'blur6')} />
        <path d="M0 262H660V320H0Z" fill="#000" fillOpacity=".22" filter={ref(u, 'blur12')} />
        <ellipse cx="148" cy="236" rx="52" ry="14" fill="#fff" fillOpacity=".09" filter={ref(u, 'blur6')} transform="rotate(-18 148 236)" />
        <path d={SIDE_UPPER} fill="none" stroke="#efeadc" strokeOpacity=".2" strokeWidth="2.2" transform="translate(0 2.4)" />

        {/* temas bölgeleri */}
        <ZoneLayer u={u} zones={g.zones} active={active} />
      </g>
      <path d={SIDE_UPPER} fill="none" stroke="#050706" strokeOpacity=".85" strokeWidth="1.6" strokeLinejoin="round" />

      {/* bağcık çubukları: gözlükten dilin üstüne geçer */}
      {EYELETS.map((e, i) => {
        const x2 = e.x + nx * 30 - ux * 10;
        const y2 = e.y + ny * 30 - uy * 10;
        return (
          <g key={i}>
            <path d={`M${e.x} ${e.y}L${x2} ${y2}`} stroke="#000" strokeOpacity=".55" strokeWidth="9.5" strokeLinecap="round" transform="translate(0 1.8)" />
            <path d={`M${e.x} ${e.y}L${x2} ${y2}`} stroke="#e9e4d3" strokeWidth="6.6" strokeLinecap="round" />
            <path d={`M${e.x - nx * 0.6 - 1} ${e.y - ny * 0.6 - 1}L${x2 - 1} ${y2 - 1}`} stroke="#fff" strokeOpacity=".65" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        );
      })}
      {EYELETS.map((e, i) => (
        <g key={`ee${i}`}>
          <circle cx={e.x} cy={e.y} r="5.8" fill="#050706" />
          <circle cx={e.x} cy={e.y} r="5.8" fill="none" stroke={C.iv3} strokeWidth="1.8" />
          <circle cx={e.x - 1} cy={e.y - 1.2} r="5.8" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth=".9" strokeDasharray="6 30" />
        </g>
      ))}

      {showBall && ball && <Ball u={u} x={ball.x} y={ball.y} r={ball.r} shadow={!ball.air} shadowDx={flip ? -8 : 8} />}
    </g>
  );
}
