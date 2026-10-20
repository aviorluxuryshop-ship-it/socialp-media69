"use client";

import clsx from "clsx";
import { Check, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, longDate, todayKey } from "@/lib/dates";
import { GROUPS, MEAL_TYPES, ROUTINES } from "@/lib/routines";
import { asWalk, asYesNoMin, daySummary, pct, sleepOf, validMeals } from "@/lib/stats";
import { sfx } from "@/lib/sound";
import { useStore, useUi } from "@/lib/store";
import { fmtDuration, parseTime } from "@/lib/time";
import { uid } from "@/lib/uid";
import type { Meal, Routine, WalkUnit } from "@/lib/types";
import { ClearButton, NumberField, Row, Stepper, YesNo } from "./fields";

export function DayForm({ date, onDate, focus }: { date: string; onDate: (d: string) => void; focus: { id: string; nonce: number } | null }) {
  const entries = useStore((s) => s.entries);
  const goals = useStore((s) => s.goals);
  const e = entries[date];
  const today = todayKey();
  const sum = useMemo(() => daySummary(e, goals), [e, goals]);
  const [flash, setFlash] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  // Tablodan bir alana tıklanınca ilgili satıra git ve odaklan.
  useEffect(() => {
    if (!focus) return;
    const row = box.current?.querySelector<HTMLElement>(`#row-${focus.id}`);
    if (!row) return;
    row.scrollIntoView({ block: "center", behavior: "smooth" });
    const target = row.querySelector<HTMLElement>("input, button:not([disabled]), select");
    const t = setTimeout(() => target?.focus({ preventScroll: true }), 250);
    setFlash(focus.id);
    const t2 = setTimeout(() => setFlash(null), 1400);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [focus]);

  return (
    <section ref={box} aria-label="Günlük giriş" className="panel overflow-hidden">
      <header className="border-b border-line px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-quiet btn-sm !w-9 !px-0" aria-label="Önceki gün" onClick={() => onDate(addDays(date, -1))}>
            <ChevronLeft size={16} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="eyebrow">{date === today ? "Bugün" : date > today ? "Gelecek" : "Geçmiş gün"}</p>
            <h2 className="h-title truncate text-[15px]">{longDate(date)}</h2>
          </div>
          <button type="button" className="btn btn-quiet btn-sm !w-9 !px-0" aria-label="Sonraki gün" disabled={date >= today} onClick={() => onDate(addDays(date, 1))}>
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${sum.rate === null ? 0 : sum.rate * 100}%` }} />
          </div>
          <p className="num whitespace-nowrap text-[12px] text-mute">
            {sum.rate === null ? "Henüz değerlendirilecek kayıt yok" : <><b className="text-text">%{pct(sum.rate)}</b> · {sum.done}/{sum.judged} hedef</>}
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between text-[12px] text-faint">
          <span>{sum.total - sum.unrecorded}/{sum.total} alan kayıtlı{sum.unrecorded > 0 && ` · ${sum.unrecorded} boş`}</span>
          <SavedBadge />
        </div>
      </header>

      {date > today ? (
        <p className="px-5 py-10 text-center text-sm text-mute">Bu gün henüz gelmedi. Kayıt girmek için geçmiş ya da bugünkü bir güne dön.</p>
      ) : (
        <div className="divide-hair" key={date}>
          {ROUTINES.map((r) => (
            <Field key={r.id} r={r} date={date} highlight={flash === r.id} />
          ))}
        </div>
      )}
    </section>
  );
}

function SavedBadge() {
  const savedAt = useUi((s) => s.savedAt);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!savedAt) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 2200);
    return () => clearTimeout(t);
  }, [savedAt]);
  return (
    <span aria-live="polite" className={clsx("inline-flex items-center gap-1 text-accent transition-opacity duration-300", show ? "opacity-100" : "opacity-0")}>
      <Check size={13} /> Kaydedildi
    </span>
  );
}

function Field({ r, date, highlight }: { r: Routine; date: string; highlight: boolean }) {
  const e = useStore((s) => s.entries[date]);
  const goals = useStore((s) => s.goals);
  const walkPref = useStore((s) => s.profile.walkUnit);
  const setProfile = useStore((s) => s.setProfile);
  const setValue = useStore((s) => s.setValue);
  const v = e?.[r.id];
  const set = (val: Parameters<typeof setValue>[2]) => setValue(date, r.id, val);
  const base = { id: r.id, emoji: r.emoji, question: r.question, group: GROUPS[r.group].label, highlight };

  switch (r.kind) {
    case "yesno":
      return (
        <Row {...base}>
          <YesNo name={r.label} value={asYesNoMin(v)?.done ?? null} onChange={set} />
        </Row>
      );

    case "yesno_min": {
      const y = asYesNoMin(v);
      return (
        <Row {...base} hint={y?.done ? "Süre isteğe bağlıdır; boş bırakabilirsin." : undefined}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <YesNo name={r.label} value={y?.done ?? null} onChange={(d) => set(d === undefined ? undefined : d ? { done: true, ...(y?.minutes ? { minutes: y.minutes } : {}) } : false)} />
            {y?.done && (
              <NumberField key={`${date}-${r.id}-m`} label={`${r.label} süresi (dakika)`} value={y.minutes} min={1} max={1440} suffix="dk" onCommit={(n) => set(n === undefined ? { done: true } : { done: true, minutes: n })} />
            )}
          </div>
          {y?.done && (
            <div className="mt-2 flex gap-1.5">
              {[30, 60, 90, 120].map((m) => (
                <button key={m} type="button" onClick={() => set({ done: true, minutes: m })} className={clsx("min-h-[32px] rounded-lg border px-2.5 text-[12px] num", y.minutes === m ? "border-accent/40 bg-accent/10 text-accent" : "border-line-2 text-mute hover:text-text")}>
                  {m} dk
                </button>
              ))}
            </div>
          )}
        </Row>
      );
    }

    case "count":
      return (
        <Row {...base} hint={`Hedef: ${goals.waterGlasses} bardak`}>
          <div className="flex items-center gap-3">
            <Stepper label="Su" value={typeof v === "number" ? v : undefined} max={40} onChange={set} />
            <span className="text-[13px] text-mute">bardak</span>
            {typeof v === "number" && <ClearButton onClick={() => set(undefined)} />}
          </div>
        </Row>
      );

    case "time":
      return (
        <Row {...base}>
          <div className="flex items-center gap-2">
            <input id={`field-${r.id}`} type="time" className="input num w-36" aria-label={r.label} value={typeof v === "string" ? v : ""} onChange={(ev) => set(ev.target.value === "" ? undefined : ev.target.value)} />
            {typeof v === "string" && <ClearButton onClick={() => set(undefined)} />}
          </div>
        </Row>
      );

    case "sleep": {
      const m = sleepOf(e);
      const bed = parseTime(e?.uyku_yatis);
      const wake = parseTime(e?.uyku_kalkis);
      return (
        <Row {...base}>
          {m !== null ? (
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="num text-2xl font-semibold" data-testid="sleep-duration">{fmtDuration(m)}</span>
              <span className="text-[12px] text-mute">
                {bed !== null && wake !== null && wake < bed ? "Gece yarısını geçen uyku" : "Aynı gün içinde"} · otomatik hesaplandı
              </span>
            </div>
          ) : bed !== null && wake !== null ? (
            <p className="text-[13px] text-amber">Yatış ve uyanış saati aynı; süre hesaplanamadı. Saatlerden birini düzelt.</p>
          ) : (
            <p className="text-[13px] text-mute">Yatış ve uyanış saatini girince süre otomatik hesaplanır.</p>
          )}
        </Row>
      );
    }

    case "duration":
      return (
        <Row {...base} hint={`Sınır: günde ${goals.screenMaxHours} saat`}>
          <ScreenField key={`${date}-${r.id}`} value={typeof v === "number" ? v : undefined} onCommit={set} />
        </Row>
      );

    case "walk": {
      const w = asWalk(v);
      const unit: WalkUnit = w?.unit ?? walkPref;
      return (
        <Row {...base} hint={w ? `Kaydedilen ölçü: ${w.unit === "steps" ? "adım sayısı" : "yürüyüş süresi (dakika)"}. Ölçüyü değiştirmek için önce temizle.` : `Hedef: ${unit === "steps" ? `${goals.steps} adım` : `${goals.walkMinutes} dk`}`}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div role="radiogroup" aria-label="Ölçü birimi" className={clsx("inline-flex rounded-[11px] border border-line-2 bg-ink p-0.5", w && "opacity-60")}>
              {(["steps", "min"] as const).map((u) => (
                <button key={u} type="button" role="radio" aria-checked={unit === u} disabled={!!w} onClick={() => setProfile({ walkUnit: u })} className={clsx("min-h-[40px] rounded-[9px] px-3.5 text-[13px] font-semibold", unit === u ? "bg-raised text-text shadow-[inset_0_0_0_1px_var(--color-line-2)]" : "text-mute")}>
                  {u === "steps" ? "Adım" : "Dakika"}
                </button>
              ))}
            </div>
            <NumberField key={`${date}-${r.id}-${unit}`} id={`field-${r.id}`} label={unit === "steps" ? "Adım sayısı" : "Yürüyüş süresi (dakika)"} value={w?.value} min={0} max={unit === "steps" ? 200000 : 1440} width="w-28" suffix={unit === "steps" ? "adım" : "dk"} onCommit={(n) => set(n === undefined ? undefined : { unit, value: n })} />
            {w && <ClearButton onClick={() => set(undefined)} />}
          </div>
        </Row>
      );
    }

    case "meals":
      return (
        <Row {...base}>
          <MealsField date={date} meals={Array.isArray(v) ? v : []} onChange={set} />
        </Row>
      );
  }
}

function ScreenField({ value, onCommit }: { value: number | undefined; onCommit: (n: number | undefined) => void }) {
  const [h, setH] = useState(value === undefined ? "" : String(Math.floor(value / 60)));
  const [m, setM] = useState(value === undefined ? "" : String(value % 60));
  const [err, setErr] = useState<string | null>(null);

  function update(nh: string, nm: string) {
    setH(nh);
    setM(nm);
    if (nh === "" && nm === "") {
      setErr(null);
      onCommit(undefined);
      return;
    }
    const hh = nh === "" ? 0 : Number(nh);
    const mm = nm === "" ? 0 : Number(nm);
    if (mm > 59) return setErr("Dakika 0 – 59 arasında olmalı");
    if (hh > 24 || hh * 60 + mm > 1440) return setErr("Bir günde en fazla 24 saat girilebilir");
    setErr(null);
    onCommit(hh * 60 + mm);
  }
  const digits = (s: string) => s.replace(/\D/g, "").slice(0, 2);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input id="field-ekran" className="input num w-20 text-center" inputMode="numeric" aria-label="Ekran süresi, saat" aria-invalid={err ? true : undefined} placeholder="0" value={h} onChange={(ev) => update(digits(ev.target.value), m)} />
        <span className="text-[13px] text-mute">sa</span>
        <input className="input num w-20 text-center" inputMode="numeric" aria-label="Ekran süresi, dakika" aria-invalid={err ? true : undefined} placeholder="0" value={m} onChange={(ev) => update(h, digits(ev.target.value))} />
        <span className="text-[13px] text-mute">dk</span>
        {(h !== "" || m !== "") && <ClearButton onClick={() => update("", "")} />}
      </div>
      {err && <p role="alert" className="mt-1 text-[11px] text-rose">{err}</p>}
    </div>
  );
}

function MealsField({ date, meals, onChange }: { date: string; meals: Meal[]; onChange: (m: Meal[] | undefined) => void }) {
  const count = validMeals(meals).length;
  const commit = (next: Meal[]) => onChange(next.length ? next : undefined);
  const patch = (id: string, p: Partial<Meal>) => commit(meals.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const add = () => {
    sfx.add();
    commit([...meals, { id: uid(), type: MEAL_TYPES[Math.min(meals.length, MEAL_TYPES.length - 1)], items: "" }]);
  };

  return (
    <div className="space-y-3">
      {meals.map((m, i) => (
        <div key={m.id} className="rounded-xl border border-line bg-ink/60 p-2.5">
          <div className="flex items-center gap-2">
            <select aria-label={`${i + 1}. öğün türü`} className="input !min-h-[40px] !w-auto !py-1.5 text-[14px]" value={m.type} onChange={(ev) => patch(m.id, { type: ev.target.value })}>
              {MEAL_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <button type="button" aria-label={`${i + 1}. öğünü sil`} onClick={() => {
                sfx.clear();
                commit(meals.filter((x) => x.id !== m.id));
              }} className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-mute hover:text-rose">
              <Trash2 size={15} />
            </button>
          </div>
          <input id={i === 0 ? "field-beslenme" : undefined} className="input mt-2 !min-h-[40px]" aria-label={`${i + 1}. öğün: ne yedin`} placeholder="Ne yedin? (ör. yumurta, peynir, çay)" value={m.items} onChange={(ev) => patch(m.id, { items: ev.target.value.slice(0, 300) })} />
          <input className="input mt-2 !min-h-[40px] text-[14px]" aria-label={`${i + 1}. öğün notu`} placeholder="Not (isteğe bağlı)" value={m.note ?? ""} onChange={(ev) => patch(m.id, { note: ev.target.value.slice(0, 300) })} />
        </div>
      ))}
      <button type="button" onClick={add} className="btn btn-quiet btn-sm">
        <Plus size={15} /> Öğün ekle
      </button>
      {count === 0 && meals.length > 0 && <p className="text-[12px] text-mute">Öğün, "ne yedin" alanı doldurulunca kayıtlı sayılır.</p>}
      <span className="sr-only">{date}</span>
    </div>
  );
}
