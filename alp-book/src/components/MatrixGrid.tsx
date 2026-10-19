"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { shortDay, todayKey } from "@/lib/dates";
import { CATEGORIES, type Habit } from "@/lib/types";
import { Burst } from "./Burst";

/** Stack tarzı matris: satır = alışkanlık, sütun = gün. Dokun → neon patlama. */
export function MatrixGrid({ days }: { days: string[] }) {
  const habits = useStore((s) => s.habits);
  const logs = useStore((s) => s.logs);
  const setValue = useStore((s) => s.setValue);
  const today = todayKey();
  const wrap = useRef<HTMLDivElement>(null);
  const [bursts, setBursts] = useState<Record<string, number>>({});

  const tap = (h: Habit, d: string) => {
    const v = logs[d]?.v[h.id];
    let next: boolean | undefined;
    if (h.kind === "toggle") next = v ? undefined : true;
    else next = v === undefined ? false : v === false ? true : undefined; // boş → temiz → kaçamak → boş
    setValue(d, h.id, next);
    const success = h.kind === "toggle" ? next === true : next === false;
    if (success) setBursts((b) => ({ ...b, [`${h.id}${d}`]: (b[`${h.id}${d}`] ?? 0) + 1 }));
  };

  useEffect(() => {
    // Bugünün sütununu görünür alana kaydır.
    const el = wrap.current;
    const th = el?.querySelector<HTMLElement>(`[data-day="${today}"]`);
    if (el && th) el.scrollLeft = Math.max(0, th.offsetLeft - el.clientWidth + 90);
  }, [days, today]);

  if (!habits.length) return <p className="p-6 text-sm text-mute">Önce alışkanlık ekle.</p>;

  return (
    <div ref={wrap} className="scroll-hide overflow-x-auto">
      <table className="border-separate" style={{ borderSpacing: 4 }}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-[116px] bg-[#101010] pr-2 text-left align-bottom" />
            {days.map((d) => (
              <th key={d} data-day={d} className="w-9 min-w-9 pb-1 text-center font-mono text-[10px] font-normal" style={{ color: d === today ? "#00ff66" : "#8b8b93" }}>
                <div>{shortDay(d)[0]}</div>
                <div className={d === today ? "font-bold" : ""}>{Number(d.slice(8))}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {habits.map((h) => {
            const cat = CATEGORIES[h.category];
            return (
              <tr key={h.id}>
                <td className="sticky left-0 z-10 bg-[#101010] pr-2">
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <i className="h-5 w-1 shrink-0 rounded-full" style={{ background: cat.color }} />
                    <span className="line-clamp-2 max-w-[100px] leading-tight">{h.name}</span>
                  </span>
                </td>
                {days.map((d) => {
                  const v = logs[d]?.v[h.id];
                  const ok = h.kind === "toggle" ? v === true : v === false;
                  const bad = h.kind === "avoid" && v === true;
                  const future = d > today;
                  return (
                    <td key={d} className="p-0">
                      <motion.button
                        disabled={future}
                        onClick={() => tap(h, d)}
                        whileTap={{ scale: 0.8 }}
                        aria-label={`${h.name} ${d}`}
                        className="relative grid h-9 w-9 place-items-center rounded-lg border disabled:opacity-25"
                        style={{
                          borderColor: ok ? cat.color : bad ? "#ff3b6b" : d === today ? "#3a3a3a" : "#222",
                          background: ok ? `${cat.color}26` : bad ? "#ff3b6b22" : "#0b0b0b",
                          boxShadow: ok ? `0 0 10px -2px ${cat.color}` : undefined,
                        }}
                      >
                        {ok && <Check size={16} strokeWidth={3} style={{ color: cat.color }} />}
                        {bad && <X size={16} strokeWidth={3} className="text-danger" />}
                        {bursts[`${h.id}${d}`] ? <Burst key={bursts[`${h.id}${d}`]} color={cat.color} radius={22} /> : null}
                      </motion.button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
