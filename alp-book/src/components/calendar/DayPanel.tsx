"use client";

import clsx from "clsx";
import { Check, ChevronLeft, ChevronRight, Clock, Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/ui";
import { addDays, daysBetween, longDate, todayKey } from "@/lib/dates";
import { plansByDate } from "@/lib/plans";
import { sfx } from "@/lib/sound";
import { useStore } from "@/lib/store";
import type { Plan } from "@/lib/types";

export function DayPanel({ date, onDate }: { date: string; onDate: (d: string) => void }) {
  const plans = useStore((s) => s.plans);
  const exams = useStore((s) => s.exams);
  const courses = useStore((s) => s.courses);
  const addPlan = useStore((s) => s.addPlan);
  const today = todayKey();
  const list = useMemo(() => plansByDate(plans).get(date) ?? [], [plans, date]);
  const dayExams = exams.filter((e) => e.date === date);
  const left = daysBetween(today, date);

  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setErr("Plan için kısa bir başlık yaz.");
      titleRef.current?.focus();
      return;
    }
    if (addPlan({ date, title, time: time || undefined, note })) {
      sfx.add();
      setTitle("");
      setNote("");
      setTime("");
      setErr(null);
      titleRef.current?.focus();
    }
  }

  return (
    <section aria-label="Gün planları" className="panel overflow-hidden">
      <header className="flex items-center gap-2 border-b border-line px-4 py-4 sm:px-5">
        <button type="button" className="btn btn-quiet btn-sm !w-9 !px-0" aria-label="Önceki gün" onClick={() => onDate(addDays(date, -1))}>
          <ChevronLeft size={16} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="eyebrow">{left === 0 ? "Bugün" : left === 1 ? "Yarın" : left === -1 ? "Dün" : left > 0 ? `${left} gün sonra` : `${-left} gün önce`}</p>
          <h2 className="h-title truncate text-[15px]">{longDate(date)}</h2>
        </div>
        <button type="button" className="btn btn-quiet btn-sm !w-9 !px-0" aria-label="Sonraki gün" onClick={() => onDate(addDays(date, 1))}>
          <ChevronRight size={16} />
        </button>
      </header>

      <form onSubmit={submit} className="space-y-2.5 border-b border-line px-4 py-4 sm:px-5" aria-label="Yeni plan ekle">
        <input id="plan-title" ref={titleRef} className="input" placeholder="Ne planlıyorsun? (ör. Proje teslimi)" aria-label="Plan başlığı" aria-invalid={err ? true : undefined} value={title} maxLength={120} onChange={(e) => { setTitle(e.target.value); setErr(null); }} />
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-[12px] text-mute">
            <Clock size={14} />
            <span className="sr-only">Saat (isteğe bağlı)</span>
            <input type="time" className="input num !w-[130px]" aria-label="Plan saati (isteğe bağlı)" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          {!showNote && (
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setShowNote(true)}>Not ekle</button>
          )}
          <button className="btn btn-primary ml-auto">
            <Plus size={16} /> Ekle
          </button>
        </div>
        {showNote && <input className="input" placeholder="Not (isteğe bağlı)" aria-label="Plan notu" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />}
        {err && <p role="alert" className="text-[12px] text-rose">{err}</p>}
      </form>

      <div className="px-4 py-2 sm:px-5">
        {dayExams.map((e) => {
          const c = courses.find((x) => x.id === e.courseId);
          return (
            <Link key={e.id} href="/exams" className="my-2 flex items-center gap-3 rounded-xl border border-amber/30 bg-amber/[0.06] px-3 py-2.5">
              <i className="h-2 w-2 rounded-full bg-amber" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{c?.name ?? "Ders"} · {e.title}</span>
              <span className="text-[11px] text-amber">Sınav</span>
            </Link>
          );
        })}
        {list.length === 0 && dayExams.length === 0 ? (
          <div className="py-5">
            <EmptyState title="Bu gün için plan yok" body="Yukarıdan bir plan ekleyebilirsin. İstersen saat de verebilirsin." />
          </div>
        ) : (
          <ul className="divide-hair">
            {list.map((p) => (
              <PlanItem key={p.id} plan={p} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function PlanItem({ plan }: { plan: Plan }) {
  const toggle = useStore((s) => s.togglePlan);
  const update = useStore((s) => s.updatePlan);
  const remove = useStore((s) => s.removePlan);
  const [edit, setEdit] = useState(false);
  const [t, setT] = useState(plan.title);
  const [tm, setTm] = useState(plan.time ?? "");
  const [n, setN] = useState(plan.note ?? "");

  if (edit) {
    return (
      <li className="space-y-2 py-3">
        <input className="input" aria-label="Plan başlığı" value={t} maxLength={120} onChange={(e) => setT(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <input type="time" className="input num !w-[130px]" aria-label="Plan saati" value={tm} onChange={(e) => setTm(e.target.value)} />
          <input className="input min-w-0 flex-1" placeholder="Not" aria-label="Plan notu" value={n} maxLength={500} onChange={(e) => setN(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!t.trim()}
            onClick={() => {
              update(plan.id, { title: t.trim(), time: tm || undefined, note: n.trim() || undefined });
              sfx.save();
              setEdit(false);
            }}
          >
            <Check size={14} /> Kaydet
          </button>
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => { setT(plan.title); setTm(plan.time ?? ""); setN(plan.note ?? ""); setEdit(false); }}>
            <X size={14} /> Vazgeç
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex items-start gap-3 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={plan.done}
        aria-label={`${plan.title} planını ${plan.done ? "tamamlanmadı olarak işaretle" : "tamamlandı olarak işaretle"}`}
        onClick={() => {
          if (!plan.done) sfx.done();
          else sfx.clear();
          toggle(plan.id);
        }}
        className={clsx("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors", plan.done ? "border-accent bg-accent text-[#031a0c]" : "border-line-2 hover:border-accent/60")}
      >
        {plan.done && <Check size={14} strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={clsx("text-[14px] font-medium leading-snug", plan.done && "text-faint line-through")}>{plan.title}</p>
        {(plan.time || plan.note) && (
          <p className="mt-0.5 text-[12px] text-mute">
            {plan.time && <span className="num mr-2 inline-flex items-center gap-1"><Clock size={11} />{plan.time}</span>}
            {plan.note}
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-0.5">
        <button type="button" aria-label={`${plan.title} planını düzenle`} className="grid h-9 w-9 place-items-center rounded-lg text-mute hover:text-text" onClick={() => setEdit(true)}>
          <Pencil size={14} />
        </button>
        <button type="button" aria-label={`${plan.title} planını sil`} className="grid h-9 w-9 place-items-center rounded-lg text-mute hover:text-rose" onClick={() => { sfx.clear(); remove(plan.id); }}>
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}
