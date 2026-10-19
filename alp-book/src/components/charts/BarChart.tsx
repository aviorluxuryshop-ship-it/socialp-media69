"use client";

import { useState } from "react";

export interface Bar {
  label: string;
  /** Tooltip başlığı. */
  title: string;
  value: number | null;
  /** Tooltip alt satırı (ör. "42 değerlendirilen kayıt"). */
  sub?: string;
}

/** Dikey çubuk grafiği (0–max). Veri yoksa çubuk çizilmez ("—"), sıfır gibi gösterilmez. */
export function BarChart({ bars, max = 100, unit = "%", height = 170, highlightLast = true, ariaLabel }: { bars: Bar[]; max?: number; unit?: string; height?: number; highlightLast?: boolean; ariaLabel: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const many = bars.length > 14;
  return (
    <div role="img" aria-label={ariaLabel} className="relative">
      <div className="relative flex items-end gap-1.5 border-b border-line-2" style={{ height }}>
        {[0.5, 1].map((g) => (
          <span key={g} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `${g * 100}%` }}>
            <span className="absolute -top-2.5 right-0 bg-surface pl-1 text-[10px] text-faint num">{Math.round(max * g)}{unit}</span>
          </span>
        ))}
        {bars.map((b, i) => {
          const last = highlightLast && i === bars.length - 1;
          return (
            <div key={i} className="relative flex h-full min-w-0 flex-1 items-end justify-center" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} onPointerDown={() => setHover(i)}>
              {b.value === null ? (
                <span className="mb-1 h-px w-3 bg-line-2" />
              ) : (
                <div className="w-full max-w-9 rounded-t-[5px] transition-[height] duration-500" style={{ height: `${Math.max(2, (b.value / max) * 100)}%`, background: last ? "#00ff66" : "rgba(0,255,102,0.38)", opacity: hover !== null && hover !== i ? 0.55 : 1 }} />
              )}
              {hover === i && (
                <div className="pointer-events-none absolute bottom-full z-10 mb-1.5 whitespace-nowrap rounded-lg border border-line-2 bg-raised px-2.5 py-1.5 text-center shadow-lg">
                  <p className="text-[11px] text-mute">{b.title}</p>
                  <p className="num text-[13px] font-semibold">{b.value === null ? <span className="text-faint">Kayıt yok</span> : `${b.value}${unit}`}</p>
                  {b.sub && <p className="text-[10px] text-faint">{b.sub}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {bars.map((b, i) => (
          <span key={i} className={`min-w-0 flex-1 truncate text-center text-[10px] ${many ? "text-transparent" : "text-faint"} ${many && i % Math.ceil(bars.length / 6) === 0 ? "!text-faint" : ""}`}>{b.label}</span>
        ))}
      </div>
    </div>
  );
}
