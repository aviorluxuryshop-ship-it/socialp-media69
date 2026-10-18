"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { fromKey, lastNDays, shortDay, todayKey } from "@/lib/dates";
import { dayScore } from "@/lib/stats";
import type { AppData } from "@/lib/types";

/** Canlı dikey sütunlar: son N günün tamamlanma oranı. */
export function DayBars({ data, days = 14, dates }: { data: Pick<AppData, "habits" | "logs">; days?: number; dates?: string[] }) {
  const today = todayKey();
  const gap = (dates?.length ?? days) > 14 ? "gap-0.5" : "gap-1.5";
  const rows = useMemo(() => (dates ?? lastNDays(days, today)).map((d) => ({ d, s: dayScore(d, data) })), [data, days, dates, today]);
  return (
    <div>
      <div className={`relative flex h-36 items-end ${gap}`}>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <span key={g} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/5" style={{ bottom: `${g * 100}%` }} />
        ))}
        {rows.map(({ d, s }, i) => (
          <div key={d} className="relative flex h-full flex-1 items-end">
            <motion.div
              className="w-full rounded-t-md"
              style={{
                background: d === today ? "linear-gradient(180deg,#00ff66,#00b347)" : "linear-gradient(180deg,#a96bff,#5b21b6)",
                boxShadow: d === today ? "0 0 14px rgba(0,255,102,.55)" : "0 0 10px rgba(138,43,226,.35)",
                minHeight: 3,
                opacity: s === 0 ? 0.25 : 1,
              }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(s, 0.03) * 100}%` }}
              transition={{ delay: i * 0.03, type: "spring", stiffness: 90, damping: 16 }}
            />
          </div>
        ))}
      </div>
      <div className={`mt-2 flex ${gap}`}>
        {rows.map(({ d }) => (
          <span key={d} className="min-w-0 flex-1 overflow-hidden text-center font-mono text-[8px] text-mute">
            {rows.length <= 14 ? shortDay(d)[0] : fromKey(d).getDate()}
          </span>
        ))}
      </div>
    </div>
  );
}
