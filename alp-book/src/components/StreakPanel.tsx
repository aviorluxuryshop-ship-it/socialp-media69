"use client";

import { Flame, Trophy } from "lucide-react";
import { useStore } from "@/lib/store";
import { bestStreak, streak } from "@/lib/stats";
import { Heatmap } from "./charts/Heatmap";

export function StreakPanel() {
  const habits = useStore((s) => s.habits);
  const logs = useStore((s) => s.logs);
  const data = { habits, logs };
  const cur = streak(data);
  const best = Math.max(bestStreak(data), cur);

  return (
    <section className="card p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="label">Seri</p>
          <p className="mt-1 flex items-baseline gap-2">
            <Flame className="self-center text-amber" size={26} style={{ filter: "drop-shadow(0 0 8px #ffb020)" }} />
            <span className="text-5xl font-bold tracking-tight text-glow text-neon">{cur}</span>
            <span className="text-sm text-mute">gün</span>
          </p>
        </div>
        <div className="rounded-xl border border-line bg-black/40 px-3 py-2 text-right">
          <p className="label flex items-center justify-end gap-1"><Trophy size={11} /> Rekor</p>
          <p className="font-mono text-xl font-bold">{best}</p>
        </div>
      </div>
      <Heatmap data={data} />
      <p className="mt-3 text-[11px] text-mute">Bir gün, alışkanlıkların en az yarısı tamamlanırsa seriyi sürdürür.</p>
    </section>
  );
}
