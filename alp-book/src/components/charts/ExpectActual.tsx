"use client";

import { motion } from "framer-motion";
import type { Course, Exam } from "@/lib/types";

/** Beklenti (mor) vs gerçekleşen (neon) — sınav başına çift sütun + fark. */
export function ExpectActual({ exams, courses }: { exams: Exam[]; courses: Course[] }) {
  const done = exams.filter((e) => e.expected !== null && e.actual !== null).sort((a, b) => a.date.localeCompare(b.date));
  if (!done.length) {
    return <p className="py-6 text-center text-sm text-mute">Beklenti ve sonucu girdiğin sınavlar burada kıyaslanır.</p>;
  }
  const name = (e: Exam) => courses.find((c) => c.id === e.courseId)?.name ?? "Ders";
  return (
    <div>
      <div className="scroll-hide overflow-x-auto">
        <div className="relative flex h-44 items-end gap-4 pb-0" style={{ minWidth: done.length * 64 }}>
          {[25, 50, 75, 100].map((g) => (
            <span key={g} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/5" style={{ bottom: `${g}%` }}>
              <span className="absolute -top-2 left-0 font-mono text-[9px] text-mute/60">{g}</span>
            </span>
          ))}
          {done.map((e, i) => {
            const diff = (e.actual as number) - (e.expected as number);
            return (
              <div key={e.id} className="relative flex h-full flex-1 items-end justify-center gap-1.5">
                <Bar h={e.expected as number} i={i} color="#8a2be2" glow="rgba(138,43,226,.5)" />
                <Bar h={e.actual as number} i={i + 0.5} color="#00ff66" glow="rgba(0,255,102,.5)" />
                <span
                  className="absolute -top-5 font-mono text-[10px] font-bold"
                  style={{ color: diff >= 0 ? "#00ff66" : "#ff3b6b" }}
                >
                  {diff >= 0 ? "+" : ""}
                  {diff}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex gap-4" style={{ minWidth: done.length * 64 }}>
          {done.map((e) => (
            <span key={e.id} className="flex-1 truncate text-center text-[10px] text-mute" title={`${name(e)} · ${e.title}`}>
              {name(e)}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 flex gap-4 text-[11px] text-mute">
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-violet" /> Beklentim</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-neon" /> Gerçekleşen</span>
      </div>
    </div>
  );
}

function Bar({ h, i, color, glow }: { h: number; i: number; color: string; glow: string }) {
  return (
    <div className="flex h-full w-5 items-end">
      <motion.div
        className="w-full rounded-t-md"
        style={{ background: color, boxShadow: `0 0 12px ${glow}` }}
        initial={{ height: 0 }}
        animate={{ height: `${Math.max(h, 2)}%` }}
        transition={{ delay: i * 0.08, type: "spring", stiffness: 80, damping: 16 }}
      />
    </div>
  );
}
