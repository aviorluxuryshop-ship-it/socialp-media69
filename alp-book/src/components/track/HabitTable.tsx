"use client";

import clsx from "clsx";
import { Check, Minus, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { dayNum, longDate, shortDay, todayKey } from "@/lib/dates";
import { ROUTINES } from "@/lib/routines";
import { asWalk, asYesNoMin, daySummary, pct, sleepOf, statusOf, validMeals, type Status } from "@/lib/stats";
import { sfx } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { fmtNum } from "@/lib/time";
import type { DayEntry, Routine } from "@/lib/types";

const compactHM = (min: number) => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h}s${String(m).padStart(2, "0")}` : `${h}s`;
};

const STATUS_TEXT: Record<Status, string> = { done: "tamamlandı", missed: "hedef dışı veya hayır", recorded: "kaydedildi", unrecorded: "kaydedilmedi" };

function Cell({ r, e, status }: { r: Routine; e: DayEntry | undefined; status: Status }) {
  const v = e?.[r.id];
  const tone = status === "done" ? "text-accent" : status === "missed" ? "text-rose" : status === "recorded" ? "text-sky" : "text-faint";
  let main: React.ReactNode = <Minus size={12} className="text-line-2" aria-hidden />;
  let sub: string | null = null;
  switch (r.kind) {
    case "yesno":
    case "yesno_min": {
      if (status === "done") main = <Check size={17} strokeWidth={2.6} />;
      if (status === "missed") main = <X size={16} strokeWidth={2.4} />;
      const y = asYesNoMin(v);
      if (y?.minutes) sub = `${y.minutes}dk`;
      break;
    }
    case "count":
      if (typeof v === "number") main = <span className="num text-[13px] font-semibold">{v}</span>;
      break;
    case "time":
      if (typeof v === "string") main = <span className="num text-[12px] font-medium">{v}</span>;
      break;
    case "sleep": {
      const m = sleepOf(e);
      if (m !== null) main = <span className="num text-[12px] font-semibold">{compactHM(m)}</span>;
      break;
    }
    case "duration":
      if (typeof v === "number") main = <span className="num text-[12px] font-semibold">{compactHM(v)}</span>;
      break;
    case "nap":
      if (typeof v === "number") main = <span className="num text-[12px] font-semibold">{v === 0 ? "yok" : compactHM(v)}</span>;
      break;
    case "walk": {
      const w = asWalk(v);
      if (w) {
        main = <span className="num text-[12px] font-semibold">{fmtNum(w.value)}</span>;
        sub = w.unit === "steps" ? "adım" : "dk";
      }
      break;
    }
    case "meals": {
      const n = validMeals(v).length;
      if (n) {
        main = <span className="num text-[13px] font-semibold">{n}</span>;
        sub = "öğün";
      }
      break;
    }
  }
  return (
    <span className={clsx("flex flex-col items-center justify-center leading-none", tone)}>
      {main}
      {sub && <span className="mt-0.5 text-[9px] font-medium text-mute">{sub}</span>}
    </span>
  );
}

export function HabitTable({
  dates,
  selected,
  onSelect,
  onEditField,
}: {
  dates: string[];
  selected: string;
  onSelect: (d: string) => void;
  /** Tabloda doğrudan değiştirilemeyen (sayı/saat/süre…) hücreler için günlük formdaki alana git. */
  onEditField: (date: string, routineId: string) => void;
}) {
  const entries = useStore((s) => s.entries);
  const goals = useStore((s) => s.goals);
  const setValue = useStore((s) => s.setValue);
  const today = todayKey();
  const wrap = useRef<HTMLDivElement>(null);
  const compact = dates.length > 10;

  const summaries = useMemo(() => dates.map((d) => daySummary(entries[d], goals)), [dates, entries, goals]);

  // Seçili sütun görünür kalsın (özellikle ay görünümünde).
  useEffect(() => {
    const el = wrap.current?.querySelector<HTMLElement>(`[data-col="${selected}"]`);
    const box = wrap.current;
    if (!el || !box) return;
    const target = el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2;
    box.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [selected, dates]);

  function cycle(r: Routine, d: string) {
    const e = entries[d];
    const y = asYesNoMin(e?.[r.id]);
    if (y?.minutes) return onEditField(d, r.id); // süreyi yanlışlıkla silmemek için formda düzenlenir
    if (!y) {
      setValue(d, r.id, true);
      sfx.yes();
    } else if (y.done) {
      setValue(d, r.id, false);
      sfx.no();
    } else {
      setValue(d, r.id, undefined);
      sfx.clear();
    }
    onSelect(d);
  }

  const colW = compact ? 40 : 38;

  return (
    <div ref={wrap} className="scroll-thin relative overflow-x-auto rounded-[18px] border border-line bg-surface" tabIndex={0} aria-label="Günlük rutin tablosu, yatay kaydırılabilir">
      <table className="w-full border-separate border-spacing-0 text-left" style={{ minWidth: 104 + dates.length * colW }}>
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 z-20 w-[104px] min-w-[104px] border-b border-line bg-surface px-2.5 py-2 text-left md:w-[190px] md:min-w-[190px] md:px-3">
              <span className="eyebrow">Rutin</span>
            </th>
            {dates.map((d) => {
              const on = d === selected;
              const isToday = d === today;
              const future = d > today;
              return (
                <th key={d} scope="col" data-col={d} className="border-b border-line p-0.5 text-center" style={{ minWidth: colW }}>
                  <button
                    type="button"
                    onClick={() => onSelect(d)}
                    aria-pressed={on}
                    aria-label={longDate(d)}
                    className={clsx("flex w-full flex-col items-center rounded-lg py-1.5 transition-colors", on ? "bg-raised ring-1 ring-line-2" : "hover:bg-raised/60", future && "opacity-40")}
                  >
                    <span className={clsx("text-[10px] font-medium uppercase", isToday ? "text-accent" : "text-faint")}>{shortDay(d)}</span>
                    <span className={clsx("num text-[14px] font-semibold", on ? "text-text" : "text-mute")}>{dayNum(d)}</span>
                    <span className={clsx("mt-0.5 h-[3px] w-3 rounded-full", isToday ? "bg-accent" : "bg-transparent")} />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {ROUTINES.map((r, ri) => (
            <tr key={r.id} className="group">
              <th scope="row" className={clsx("sticky left-0 z-10 border-b border-line bg-surface px-2.5 py-0 text-left font-normal md:px-3", ri === ROUTINES.length - 1 && "border-b-0")}>
                <div className="flex h-11 items-center gap-1.5 md:gap-2" title={r.question}>
                  <span aria-hidden className="text-[15px]">{r.emoji}</span>
                  <span className="truncate text-[13px] font-medium text-text/90">{r.label}</span>
                </div>
              </th>
              {dates.map((d) => {
                const e = entries[d];
                const status = statusOf(r, e, goals);
                const future = d > today;
                const direct = r.kind === "yesno" || r.kind === "yesno_min";
                return (
                  <td key={d} className={clsx("border-b border-line p-0.5 text-center", ri === ROUTINES.length - 1 && "border-b-0", d === selected && "bg-raised/50")}>
                    <button
                      type="button"
                      disabled={future}
                      onClick={() => (direct ? cycle(r, d) : (onSelect(d), onEditField(d, r.id)))}
                      aria-label={`${r.label}, ${longDate(d)}: ${STATUS_TEXT[status]}`}
                      className={clsx("flex h-10 w-full items-center justify-center rounded-lg transition-colors hover:bg-raised disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent", status === "done" && "bg-accent/[0.07]", status === "missed" && "bg-rose/[0.07]")}
                    >
                      <Cell r={r} e={e} status={status} />
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="sticky left-0 z-10 border-t border-line-2 bg-surface px-2.5 py-2 text-left md:px-3">
              <span className="eyebrow">Gün %</span>
            </th>
            {dates.map((d, i) => {
              const s = summaries[i];
              return (
                <td key={d} className="border-t border-line-2 py-2 text-center">
                  <span className={clsx("num text-[12px] font-semibold", s.rate === null ? "text-faint" : s.rate >= 0.7 ? "text-accent" : s.rate >= 0.4 ? "text-amber" : "text-rose")} title={s.rate === null ? "Bu gün için değerlendirilecek kayıt yok" : `${s.done}/${s.judged} hedefe ulaşıldı`}>
                    {s.rate === null ? "—" : pct(s.rate)}
                  </span>
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
