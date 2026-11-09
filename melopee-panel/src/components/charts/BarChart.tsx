"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { moneyShort } from "@/lib/format";

export interface BarDatum {
  key: string;
  label: string;
  /** Uzun etiket (ipucu ve tablo için). */
  title?: string;
  values: number[];
}

export interface Series {
  name: string;
  color: string;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e!.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nf * exp;
}

/** Üstü 4px yuvarlatılmış, tabana oturan çubuk yolu. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/**
 * Gruplanmış dikey çubuk grafik. Tek eksen; ≥2 seride lejant her zaman görünür; üzerine gelince
 * (ya da odaklanıp ok tuşlarıyla) ipucu; "Tablo" ile aynı veri tablo olarak okunur.
 */
export function BarChart({
  data,
  series,
  height = 240,
  format = moneyShort,
  formatFull,
  ariaLabel,
}: {
  data: BarDatum[];
  series: Series[];
  height?: number;
  format?: (n: number) => string;
  formatFull?: (n: number) => string;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const full = formatFull ?? format;

  const M = { top: 12, right: 8, bottom: 28, left: 54 };
  const innerW = Math.max(0, width - M.left - M.right);
  const innerH = height - M.top - M.bottom;
  const max = useMemo(() => niceMax(Math.max(0, ...data.flatMap((d) => d.values))), [data]);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const band = data.length ? innerW / data.length : 0;
  const groupW = Math.min(band * 0.74, series.length * 28);
  const gap = 2;
  const barW = series.length ? Math.max(1, (groupW - gap * (series.length - 1)) / series.length) : 0;
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(innerW / 44))));
  const y = (v: number) => innerH - (v / max) * innerH;
  const empty = data.every((d) => d.values.every((v) => !v));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {series.length > 1 ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] font-semibold text-ink-2" aria-label="Lejant">
            {series.map((s) => (
              <li key={s.name} className="flex items-center gap-1.5">
                <span aria-hidden className="inline-block size-2.5 rounded-[3px]" style={{ background: s.color }} />
                {s.name}
              </li>
            ))}
          </ul>
        ) : (
          <span />
        )}
        <button type="button" className="btn btn-ghost btn-sm no-print" onClick={() => setTable((v) => !v)} aria-pressed={table}>
          {table ? "Grafik" : "Tablo"}
        </button>
      </div>

      {table ? (
        <div className="max-h-[320px] overflow-auto rounded-xl border border-line">
          <table className="table">
            <thead>
              <tr>
                <th>Dönem</th>
                {series.map((s) => (
                  <th key={s.name} className="!text-right">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.key}>
                  <td>{d.title ?? d.label}</td>
                  {d.values.map((v, i) => (
                    <td key={i} className="num text-right">
                      {full(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={ref} className="relative" style={{ height }}>
          {empty && <p className="absolute inset-0 grid place-items-center text-[13.5px] text-ink-3">Bu dönemde veri yok.</p>}
          {width > 0 && (
            <svg
              width={width}
              height={height}
              role="img"
              aria-label={ariaLabel}
              tabIndex={0}
              className="overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-rose/40 rounded-lg"
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") setActive((a) => Math.min(data.length - 1, (a ?? -1) + 1));
                else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? data.length) - 1));
                else if (e.key === "Escape") setActive(null);
              }}
              onBlur={() => setActive(null)}
              onMouseLeave={() => setActive(null)}
            >
              <g transform={`translate(${M.left},${M.top})`}>
                {ticks.map((t) => (
                  <g key={t} transform={`translate(0,${y(t)})`}>
                    <line x1={0} x2={innerW} stroke={t === 0 ? "#dcd1c7" : "#efe8e2"} strokeWidth={1} />
                    {/* Veri yokken ölçek anlamsız (0–1); yalnızca taban etiketi kalır. */}
                    {(!empty || t === 0) && (
                      <text x={-8} dy="0.32em" textAnchor="end" className="num fill-ink-3 text-[11px]">
                        {format(t)}
                      </text>
                    )}
                  </g>
                ))}
                {data.map((d, i) => {
                  const x0 = i * band + (band - groupW) / 2;
                  return (
                    <g key={d.key}>
                      {active === i && <rect x={i * band + 1} y={0} width={band - 2} height={innerH} rx={6} fill="#f5f0eb" />}
                      {d.values.map((v, k) =>
                        v > 0 ? <path key={k} d={barPath(x0 + k * (barW + gap), y(v), barW, innerH - y(v))} fill={series[k]?.color} opacity={active === null || active === i ? 1 : 0.55} /> : null,
                      )}
                      {i % labelEvery === 0 && (
                        <text x={i * band + band / 2} y={innerH + 18} textAnchor="middle" className="num fill-ink-3 text-[11px]">
                          {d.label}
                        </text>
                      )}
                      <rect x={i * band} y={0} width={band} height={innerH} fill="transparent" onMouseEnter={() => setActive(i)} />
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
          {active !== null && data[active] && (
            <div
              className="pointer-events-none absolute z-10 min-w-[150px] rounded-xl border border-line bg-surface px-3 py-2 text-[12.5px] shadow-[var(--shadow-pop)]"
              style={{
                left: Math.min(Math.max(0, M.left + active * band + band / 2 - 80), Math.max(0, width - 170)),
                top: 0,
              }}
              role="status"
            >
              <p className="mb-1 font-bold text-ink">{data[active].title ?? data[active].label}</p>
              {series.map((s, k) => (
                <p key={s.name} className="flex items-center justify-between gap-3 text-ink-2">
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden className="inline-block size-2 rounded-[2px]" style={{ background: s.color }} />
                    {s.name}
                  </span>
                  <span className="num font-semibold text-ink">{full(data[active]!.values[k] ?? 0)}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Sıralı yatay çubuk listesi: değerler doğrudan yazılır, renk tek seri. */
export function RankBars({ rows, color = "#b84c36", format, sub, limit = 8 }: { rows: { id: string; label: string; value: number; count?: number }[]; color?: string; format: (n: number) => string; sub?: (r: { count?: number }) => string; limit?: number }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const shown = rows.slice(0, limit);
  const rest = rows.slice(limit);
  const restSum = rest.reduce((s, r) => s + r.value, 0);
  if (!rows.length) return <p className="py-6 text-center text-[13.5px] text-ink-3">Bu dönemde veri yok.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {[...shown, ...(rest.length ? [{ id: "_other", label: `Diğer (${rest.length})`, value: restSum, count: rest.reduce((s, r) => s + (r.count ?? 0), 0) }] : [])].map((r) => (
        <li key={r.id}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13.5px]">
            <span className="truncate font-semibold text-ink">{r.label}</span>
            <span className="num shrink-0 font-semibold text-ink">
              {format(r.value)}
              {sub && <span className="ml-1.5 font-normal text-ink-3">{sub(r)}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sunk">
            <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: r.id === "_other" ? "#b5a9ad" : color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Tek değerli ilerleme göstergesi (doluluk vb.). */
export function Meter({ value, color = "#b84c36", label }: { value: number; color?: string; label: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div role="meter" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-sunk">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
