"use client";

import clsx from "clsx";
import { CalendarCheck, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { DayPanel } from "@/components/calendar/DayPanel";
import { addMonths, firstOfMonth, longDate, monthGrid, monthLabel, todayKey, dayNum } from "@/lib/dates";
import { plansByDate } from "@/lib/plans";
import { sfx } from "@/lib/sound";
import { useStore } from "@/lib/store";

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function CalendarPage() {
  const plans = useStore((s) => s.plans);
  const exams = useStore((s) => s.exams);
  const today = todayKey();
  const [selected, setSelected] = useState(today);
  const [view, setView] = useState(firstOfMonth(today));
  const panel = useRef<HTMLDivElement>(null);

  const grid = useMemo(() => monthGrid(view), [view]);
  const byDate = useMemo(() => plansByDate(plans), [plans]);
  const examDates = useMemo(() => new Set(exams.map((e) => e.date)), [exams]);

  const monthPlans = plans.filter((p) => p.date.startsWith(view.slice(0, 7)));
  const monthDone = monthPlans.filter((p) => p.done).length;

  const pick = useCallback((d: string) => {
    sfx.open();
    setSelected(d);
    if (!d.startsWith(view.slice(0, 7))) setView(firstOfMonth(d));
    if (window.matchMedia("(max-width: 1279px)").matches) setTimeout(() => panel.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }, [view]);

  const goMonth = (n: number) => {
    sfx.nav();
    setView(firstOfMonth(addMonths(view, n)));
  };
  const goToday = () => {
    sfx.nav();
    setView(firstOfMonth(today));
    setSelected(today);
  };

  return (
    <div className="mx-auto max-w-[1280px]">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Takvim</p>
          <h1 className="h-title mt-1 text-[28px] md:text-[32px]">Planlar</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <button type="button" className="btn btn-quiet btn-sm !w-9 !px-0" aria-label="Önceki ay" onClick={() => goMonth(-1)}>
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[132px] text-center text-[14px] font-semibold" aria-live="polite">{monthLabel(view)}</span>
            <button type="button" className="btn btn-quiet btn-sm !w-9 !px-0" aria-label="Sonraki ay" onClick={() => goMonth(1)}>
              <ChevronRight size={16} />
            </button>
          </div>
          <button type="button" className="btn btn-quiet btn-sm" onClick={goToday}>Bugün</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => { sfx.open(); document.getElementById("plan-title")?.focus(); panel.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
            <Plus size={15} /> Plan ekle
          </button>
        </div>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-label="Aylık takvim" className="min-w-0">
          <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
            <div className="grid grid-cols-7 border-b border-line">
              {WEEKDAYS.map((w) => (
                <div key={w} className="eyebrow py-2.5 text-center !text-[10px]">{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {grid.map((d, i) => {
                const inMonth = d.startsWith(view.slice(0, 7));
                const list = byDate.get(d) ?? [];
                const pending = list.filter((p) => !p.done);
                const isToday = d === today;
                const on = d === selected;
                const hasExam = examDates.has(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => pick(d)}
                    aria-pressed={on}
                    aria-label={`${longDate(d)}${list.length ? `, ${list.length} plan` : ""}${hasExam ? ", sınav var" : ""}`}
                    className={clsx(
                      "relative flex min-h-[58px] flex-col items-stretch gap-1 border-line p-1.5 text-left transition-colors hover:bg-raised/70 md:min-h-[104px] md:p-2",
                      i % 7 !== 6 && "border-r",
                      i < grid.length - 7 && "border-b",
                      on && "bg-raised",
                      !inMonth && "opacity-40",
                    )}
                  >
                    <span className={clsx("num grid h-6 w-6 place-items-center self-start rounded-full text-[12px] font-semibold md:h-7 md:w-7 md:text-[13px]", isToday ? "bg-accent text-[#031a0c]" : on ? "text-text" : "text-mute")}>{dayNum(d)}</span>
                    <span className="hidden min-w-0 flex-col gap-1 md:flex">
                      {list.slice(0, 2).map((p) => (
                        <span key={p.id} className={clsx("truncate rounded-md px-1.5 py-0.5 text-[11px] leading-4", p.done ? "bg-line text-faint line-through" : "bg-accent/10 text-accent")}>
                          {p.time && <span className="num mr-1 opacity-70">{p.time}</span>}
                          {p.title}
                        </span>
                      ))}
                      {list.length > 2 && <span className="px-1 text-[11px] text-mute">+{list.length - 2} daha</span>}
                    </span>
                    <span className="mt-auto flex items-center gap-1 md:hidden">
                      {pending.slice(0, 3).map((p) => <i key={p.id} className="h-1.5 w-1.5 rounded-full bg-accent" />)}
                      {list.length - pending.length > 0 && pending.length < 3 && <i className="h-1.5 w-1.5 rounded-full bg-line-2" />}
                    </span>
                    {hasExam && <i className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber" title="Sınav" />}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="num mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[12px] text-mute">
            <span className="flex items-center gap-1.5"><CalendarCheck size={14} className="text-accent" />{monthLabel(view)}: {monthPlans.length ? `${monthDone}/${monthPlans.length} plan tamamlandı` : "henüz plan yok"}</span>
            <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-accent" /> bekleyen plan</span>
            <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-amber" /> sınav günü (<Link href="/exams" className="underline underline-offset-2 hover:text-text">Sınavlar</Link>)</span>
          </p>
        </section>

        <div ref={panel} className="min-w-0 scroll-mt-6 xl:sticky xl:top-6">
          <DayPanel date={selected} onDate={pick} />
        </div>
      </div>
    </div>
  );
}
