"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { MatrixGrid } from "@/components/MatrixGrid";
import { CategoryBars } from "@/components/charts/CategoryBars";
import { DayBars } from "@/components/charts/DayBars";
import { monthDays, monthName } from "@/lib/dates";
import { categoryTotals } from "@/lib/stats";
import { useStore } from "@/lib/store";

export default function MatrixPage() {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const habits = useStore((s) => s.habits);
  const logs = useStore((s) => s.logs);
  const days = useMemo(() => monthDays(ym.y, ym.m), [ym]);
  const data = { habits, logs };
  const cats = categoryTotals(data, days);
  const shift = (n: number) => setYm(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="label">Alışkanlık matrisi</p>
          <h1 className="mt-1 text-3xl font-bold">{monthName(ym.m)} <span className="text-neon text-glow">{ym.y}</span></h1>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost !px-3" onClick={() => shift(-1)} aria-label="Önceki ay"><ChevronLeft size={18} /></button>
          <button className="btn btn-ghost !px-3" onClick={() => shift(1)} aria-label="Sonraki ay"><ChevronRight size={18} /></button>
        </div>
      </header>

      <section className="card p-4">
        <MatrixGrid days={days} />
        <p className="mt-3 text-[11px] text-mute">Kutuya dokun: tamamlandı. &ldquo;Kaçamak&rdquo; alışkanlıklarda ilk dokunuş temiz, ikinci dokunuş kaçamak, üçüncü sıfırlar.</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        <section className="card card-violet p-5">
          <p className="label">Ay görünümü</p>
          <h2 className="mb-5 mt-1 text-lg font-semibold">Günlük Tamamlanma</h2>
          <DayBars data={data} dates={days} />
        </section>
        <section className="card p-5">
          <p className="label">Ay görünümü</p>
          <h2 className="mb-5 mt-1 text-lg font-semibold">Kategoriye Göre</h2>
          <CategoryBars rows={cats} />
        </section>
      </div>
    </div>
  );
}
