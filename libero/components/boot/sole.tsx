import type { FootZone } from '@/data/types';
import { BOOT_OUT, GEO, SOLE_STUDS } from '@/lib/boot-shapes';
import { Ball } from './ball';
import { id, ref } from './defs';
import { ZoneLayer } from './parts';

// Alttan görünüm: taban plakası ve çiviler. Çizim sol kramponun tabanıdır (iç yan solda);
// sağ ayak için BootMap yatayda çevirir.

function Stud({ u, x, y, r }: { u: string; x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={x + 3.5} cy={y + 5} r={r + 1} fill="#000" opacity=".5" filter={ref(u, 'blur3')} />
      <circle cx={x} cy={y} r={r + 3.2} fill="#8f8b7c" fillOpacity=".55" />
      <circle cx={x} cy={y} r={r} fill={ref(u, 'stud')} stroke="#050706" strokeWidth="1.4" />
      <circle cx={x} cy={y} r={r * 0.56} fill="#0c0f0e" fillOpacity=".55" />
      <circle cx={x - r * 0.12} cy={y - r * 0.14} r={r * 0.46} fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1.2" />
      <path d={`M${x - r * 0.72} ${y - r * 0.2}A${r * 0.76} ${r * 0.76} 0 0 1 ${x - r * 0.1} ${y - r * 0.74}`} stroke="#fff" strokeOpacity=".5" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  );
}

export function SoleBoot({ u, active, flip, showBall, ballZone }: { u: string; active: ReadonlySet<FootZone>; flip: boolean; showBall: boolean; ballZone: FootZone | null }) {
  const g = GEO.taban;
  const ball = ballZone ? g.zones[ballZone]?.ball : undefined;
  const cid = id(u, 'soclip');
  // sağ ayak için çizim aynalanır; ışık yönü ve gölge buna göre
  const sh = flip ? 1 : -1;
  return (
    <g transform={`translate(${g.ox} ${g.oy})`} className="boot-art boot-art--taban">
      <defs>
        <clipPath id={cid}>
          <path d={BOOT_OUT} />
        </clipPath>
      </defs>

      {/* zemin gölgesi */}
      <path d={BOOT_OUT} transform={`translate(${-16 * sh} 20)`} fill="#000" opacity=".55" filter={ref(u, 'blur12')} />
      <path d={BOOT_OUT} transform={`translate(${-5 * sh} 8)`} fill="#000" opacity=".5" filter={ref(u, 'blur6')} />

      {showBall && ball && <Ball u={u} x={ball.x} y={ball.y} r={ball.r} shadowDx={-8 * sh} />}

      {/* plaka kenarı */}
      <path d={BOOT_OUT} fill="none" stroke="#0b0d0c" strokeWidth="6" strokeLinejoin="round" />
      <path d={BOOT_OUT} fill={ref(u, 'sole')} />
      <g clipPath={`url(#${cid})`}>
        {/* gövde altı: plakanın içinde bir ton koyu çerçeve */}
        <path d={BOOT_OUT} fill="none" stroke="#000" strokeOpacity=".18" strokeWidth="30" filter={ref(u, 'blur6')} />
        <path d={BOOT_OUT} fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2" transform="translate(0 2.5)" />

        {/* plaka çerçevesi (iç kontur) */}
        <path d={BOOT_OUT} fill="none" stroke="#000" strokeOpacity=".26" strokeWidth="2.4" transform="translate(30 28.5) scale(.9)" />
        <path d={BOOT_OUT} fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.2" transform="translate(30 30.3) scale(.9)" />

        {/* ön ayak: bükülme oluğu */}
        <path d="M214 258C262 276 342 276 392 258" stroke="#000" strokeOpacity=".38" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M214 261C262 279 342 279 392 261" stroke="#fff" strokeOpacity=".5" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {/* topuk: plaka ayrımı */}
        <path d="M218 404C264 420 342 420 388 404" stroke="#000" strokeOpacity=".38" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M218 407C264 423 342 423 388 407" stroke="#fff" strokeOpacity=".5" strokeWidth="1.6" fill="none" strokeLinecap="round" />

        {/* orta ayak: omurga ve kaburgalar */}
        <path d="M262 288C282 300 322 300 342 288L336 392C322 400 282 400 268 392Z" fill="#000" fillOpacity=".14" />
        {[304, 322, 340, 358, 376].map((y) => (
          <path key={y} d={`M276 ${y}C292 ${y + 7} 312 ${y + 7} 328 ${y}`} stroke="#000" strokeOpacity=".34" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        ))}
        {[304, 322, 340, 358, 376].map((y) => (
          <path key={`h${y}`} d={`M276 ${y + 3}C292 ${y + 10} 312 ${y + 10} 328 ${y + 3}`} stroke="#fff" strokeOpacity=".5" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        ))}

        {/* ön ayak çiziği: çivi aralarında ince kaburga */}
        <path d="M262 98C282 108 322 108 342 98M244 168C282 182 330 182 368 168" stroke="#000" strokeOpacity=".2" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M262 100C282 110 322 110 342 100M244 170C282 184 330 184 368 170" stroke="#fff" strokeOpacity=".5" strokeWidth="1" fill="none" strokeLinecap="round" />

        {/* temas bölgeleri */}
        <ZoneLayer u={u} zones={g.zones} active={active} />

        {/* çiviler */}
        {SOLE_STUDS.map((s) => (
          <Stud key={`${s.x}-${s.y}`} u={u} x={s.x} y={s.y} r={s.r} />
        ))}

      </g>
      <path d={BOOT_OUT} fill="none" stroke="#050706" strokeOpacity=".85" strokeWidth="1.6" />
    </g>
  );
}
