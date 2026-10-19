"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { addDays, fromKey, prettyDate, todayKey } from "@/lib/dates";
import { dayScore } from "@/lib/stats";
import type { AppData } from "@/lib/types";

const LEVELS = ["#161616", "#0a3d1f", "#0c7a38", "#00c653", "#00ff66"];
const level = (s: number) => (s <= 0 ? 0 : s < 0.34 ? 1 : s < 0.67 ? 2 : s < 1 ? 3 : 4);

/** GitHub tarzı ısı haritası: sütun = hafta (Pzt başlangıçlı). */
export function Heatmap({ data, weeks = 18 }: { data: Pick<AppData, "habits" | "logs">; weeks?: number }) {
  const today = todayKey();
  const cells = useMemo(() => {
    const dow = (fromKey(today).getDay() + 6) % 7; // 0=Pzt
    const start = addDays(today, -(weeks - 1) * 7 - dow);
    return Array.from({ length: weeks * 7 }, (_, i) => {
      const date = addDays(start, i);
      return { date, score: date > today ? -1 : dayScore(date, data), col: Math.floor(i / 7), row: i % 7 };
    });
  }, [data, weeks, today]);

  return (
    <div className="scroll-hide overflow-x-auto">
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateRows: "repeat(7, 1fr)", gridAutoFlow: "column", gridAutoColumns: "minmax(12px, 1fr)", minWidth: weeks * 15 }}
      >
        {cells.map((c, i) =>
          c.score < 0 ? (
            <span key={c.date} />
          ) : (
            <motion.span
              key={c.date}
              title={`${prettyDate(c.date)} · %${Math.round(c.score * 100)}`}
              className="aspect-square rounded-[3px]"
              style={{
                background: LEVELS[level(c.score)],
                boxShadow: level(c.score) === 4 ? "0 0 6px rgba(0,255,102,.7)" : undefined,
                outline: c.date === today ? "1px solid #8a2be2" : undefined,
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.004, 0.5), duration: 0.25 }}
            />
          ),
        )}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-mute">
        az
        {LEVELS.map((l) => (
          <span key={l} className="h-2.5 w-2.5 rounded-[3px]" style={{ background: l }} />
        ))}
        çok
      </div>
    </div>
  );
}
