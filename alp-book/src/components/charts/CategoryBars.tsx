"use client";

import { motion } from "framer-motion";
import { CATEGORIES, type Category } from "@/lib/types";

/** Yatay neon çubuklar: kategori başına tamamlanan / toplam. */
export function CategoryBars({ rows }: { rows: { category: Category; done: number; total: number }[] }) {
  if (!rows.length) return <p className="text-sm text-mute">Henüz veri yok.</p>;
  return (
    <div className="space-y-3">
      {rows.map(({ category, done, total }, i) => {
        const { label, color } = CATEGORIES[category];
        const p = total ? done / total : 0;
        return (
          <div key={category}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium text-white/90">{label}</span>
              <span className="font-mono text-mute">
                {done}/{total} · %{Math.round(p * 100)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#1a1a1a]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color, boxShadow: `0 0 12px ${color}88` }}
                initial={{ width: 0 }}
                animate={{ width: `${p * 100}%` }}
                transition={{ delay: i * 0.06, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
