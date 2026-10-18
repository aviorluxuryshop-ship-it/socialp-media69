"use client";

import { motion } from "framer-motion";
import { ExamPanel } from "@/components/ExamPanel";
import { ProgressRing } from "@/components/ProgressRing";
import { QuickCheckin } from "@/components/QuickCheckin";
import { StreakPanel } from "@/components/StreakPanel";
import { CategoryBars } from "@/components/charts/CategoryBars";
import { DayBars } from "@/components/charts/DayBars";
import { dayName, greeting, lastNDays, prettyDate, todayKey } from "@/lib/dates";
import { categoryTotals, dayScore, pct } from "@/lib/stats";
import { useStore } from "@/lib/store";

const fade = (i: number) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.06, duration: 0.35 } });

export default function Dashboard() {
  const name = useStore((s) => s.profile.name);
  const habits = useStore((s) => s.habits);
  const logs = useStore((s) => s.logs);
  const today = todayKey();
  const data = { habits, logs };
  const score = dayScore(today, data);
  const done = habits.filter((h) => (h.kind === "toggle" ? logs[today]?.v[h.id] === true : logs[today]?.v[h.id] === false)).length;
  const week = lastNDays(7);
  const weekAvg = week.reduce((a, d) => a + dayScore(d, data), 0) / 7;
  const cats = categoryTotals(data, lastNDays(30)).sort((a, b) => b.done / (b.total || 1) - a.done / (a.total || 1));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <motion.header {...fade(0)} className="flex items-center justify-between gap-4">
        <div>
          <p className="label">{dayName(today)} · {prettyDate(today)}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{greeting()}, <span className="text-neon text-glow">{name}</span></h1>
        </div>
      </motion.header>

      <motion.section {...fade(1)} className="card card-neon flex items-center gap-5 p-5">
        <ProgressRing value={score} size={104} stroke={10}>
          <span className="font-mono text-2xl font-bold">{done}<span className="text-sm text-mute">/{habits.length}</span></span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="label">Bugünün ilerlemesi</p>
          <p className="mt-1 text-lg font-semibold leading-snug">
            {score >= 1 ? "Kusursuz gün. Bunu koru." : score >= 0.5 ? "Seri güvende. Devam et." : "Seriyi korumak için en az yarısını tamamla."}
          </p>
          <p className="mt-1 text-xs text-mute">Son 7 gün ortalaman %{pct(weekAvg)}</p>
        </div>
      </motion.section>

      <motion.section {...fade(2)}>
        <p className="label mb-3">Hızlı Check-in</p>
        <QuickCheckin date={today} />
      </motion.section>

      <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        <motion.div {...fade(3)}><StreakPanel /></motion.div>
        <motion.section {...fade(4)} className="card p-5">
          <p className="label">Son 14 gün</p>
          <h2 className="mb-5 mt-1 text-lg font-semibold">Günlük Tamamlanma</h2>
          <DayBars data={data} days={14} />
        </motion.section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        <motion.div {...fade(5)}><ExamPanel /></motion.div>
        <motion.section {...fade(6)} className="card p-5">
          <p className="label">Son 30 gün</p>
          <h2 className="mb-5 mt-1 text-lg font-semibold">Kategori Dağılımı</h2>
          <CategoryBars rows={cats} />
        </motion.section>
      </div>
    </div>
  );
}
