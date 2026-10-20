"use client";

import { CalendarDays, ChevronLeft, ChevronRight, ListPlus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AddRoutineForm } from "@/components/AddRoutineForm";
import { EmptyState, Segmented } from "@/components/ui";
import { useRoutines } from "@/lib/useRoutines";
import { DayForm } from "@/components/track/DayForm";
import { HabitTable } from "@/components/track/HabitTable";
import { addDays, addMonths, monthDaysOf, monthLabel, prettyDate, shortMonth, todayKey, weekDays, isValidKey } from "@/lib/dates";
import { useStore } from "@/lib/store";

type Mode = "week" | "month";

export default function TrackPage() {
  const today = todayKey();
  const [selected, setSelected] = useState(today);
  const [mode, setMode] = useState<Mode>("week");
  const [focus, setFocus] = useState<{ id: string; nonce: number } | null>(null);
  const routines = useRoutines();
  const [adding, setAdding] = useState(false);
  const hasAny = useStore((s) => Object.keys(s.entries).length > 0);

  const dates = useMemo(() => (mode === "week" ? weekDays(selected) : monthDaysOf(selected)), [mode, selected]);
  const first = dates[0];
  const last = dates[dates.length - 1];
  const label = mode === "month" ? monthLabel(first) : `${prettyDate(first)} – ${prettyDate(last)}${first.slice(0, 4) !== last.slice(0, 4) ? "" : ` ${last.slice(0, 4)}`}`;

  const clamp = (d: string) => (d > today ? today : d);
  const move = (dir: -1 | 1) => setSelected(clamp(mode === "week" ? addDays(selected, dir * 7) : addMonths(selected, dir)));
  const canNext = last < today;

  const onEditField = useCallback((_date: string, id: string) => setFocus({ id, nonce: Date.now() }), []);

  return (
    <div className="mx-auto max-w-[1280px]">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Günlük takip</p>
          <h1 className="h-title mt-1 text-[28px] md:text-[32px]">Rutin tablosu</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Görünüm" size="sm" value={mode} onChange={setMode} options={[{ value: "week", label: "Hafta" }, { value: "month", label: "Ay" }]} />
          <div className="flex items-center gap-1">
            <button type="button" className="btn btn-quiet btn-sm !w-9 !px-0" aria-label={mode === "week" ? "Önceki hafta" : "Önceki ay"} onClick={() => move(-1)}>
              <ChevronLeft size={16} />
            </button>
            <span className="num min-w-[150px] text-center text-[13px] font-semibold" aria-live="polite">{label}</span>
            <button type="button" className="btn btn-quiet btn-sm !w-9 !px-0" aria-label={mode === "week" ? "Sonraki hafta" : "Sonraki ay"} disabled={!canNext} onClick={() => move(1)}>
              <ChevronRight size={16} />
            </button>
          </div>
          <label className="relative">
            <span className="sr-only">Tarihe git</span>
            <CalendarDays size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <input type="date" className="input num !min-h-9 !w-[158px] !py-1 !pl-9 text-[13px]" max={today} value={selected} onChange={(e) => isValidKey(e.target.value) && setSelected(clamp(e.target.value))} />
          </label>
          <button type="button" className="btn btn-quiet btn-sm" aria-expanded={adding} onClick={() => setAdding((v) => !v)}>
            <ListPlus size={15} /> Rutin ekle
          </button>
          <button type="button" className="btn btn-quiet btn-sm" disabled={selected === today} onClick={() => setSelected(today)}>
            Bugün
          </button>
        </div>
      </header>

      {adding && (
        <section className="panel mb-5 p-4 sm:p-5" aria-label="Rutin ekle">
          <AddRoutineForm />
        </section>
      )}

      {routines.length === 0 ? (
        <EmptyState title="Henüz rutin yok" body="Takip etmek istediğin ilk rutini yaz; sistem türünü (Evet/Hayır, sayı, saat) kendisi algılar." action={<button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding(true)}><ListPlus size={15} /> Rutin ekle</button>} />
      ) : (
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-3">
          {!hasAny && (
            <p className="rounded-xl border border-dashed border-line-2 px-4 py-3 text-[13px] leading-relaxed text-mute">
              Henüz hiç kayıt yok. Evet/Hayır hücrelerine dokunarak hızlıca işaretle; sayı, saat ve öğün gibi alanlar için hücreye dokunup <b className="text-text">Günlük giriş</b> bölümünü kullan. Boş hücreler başarısızlık sayılmaz.
            </p>
          )}
          <HabitTable dates={dates} selected={selected} onSelect={(d) => setSelected(d)} onEditField={onEditField} />
          <Legend />
        </div>
        <div className="min-w-0 xl:sticky xl:top-6">
          <DayForm date={selected} onDate={(d) => setSelected(clamp(d))} focus={focus} />
        </div>
      </div>
      )}
      <span className="sr-only">{shortMonth(selected)}</span>
    </div>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 px-1 text-[11.5px] text-mute">
      <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-[3px] bg-accent/70" /> Tamamlandı / hedefte</li>
      <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-[3px] bg-rose/70" /> Hayır / hedef dışı</li>
      <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-[3px] bg-sky/60" /> Kaydedildi (hedefsiz)</li>
      <li className="flex items-center gap-1.5"><i className="h-px w-2.5 bg-line-2" /> Kaydedilmedi — yüzdeye katılmaz</li>
    </ul>
  );
}
