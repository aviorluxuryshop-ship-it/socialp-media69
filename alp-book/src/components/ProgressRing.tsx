"use client";

import { motion } from "framer-motion";

/** Sade ilerleme halkası. value: 0–1, null ise "veri yok" gösterir. */
export function ProgressRing({ value, size = 132, stroke = 9, caption }: { value: number | null; size?: number; stroke?: number; caption?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={value === null ? "Henüz değerlendirilecek kayıt yok" : `Tamamlanma yüzde ${Math.round(value * 100)}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e1e24" strokeWidth={stroke} />
        {value !== null && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#00ff66"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - value) }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        )}
      </svg>
      <div className="absolute text-center">
        <p className="num text-[30px] font-semibold leading-none tracking-tight">{value === null ? "—" : <>{Math.round(value * 100)}<span className="text-lg text-mute">%</span></>}</p>
        {caption && <p className="mt-1 text-[11px] text-mute">{caption}</p>}
      </div>
    </div>
  );
}
