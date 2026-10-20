"use client";

import clsx from "clsx";
import { Minus, Plus, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { sfx } from "@/lib/sound";

/**
 * Sayısal giriş. Yazarken doğrular: geçerliyse hemen kaydeder, geçersizse mesaj gösterir ve kaydetmez.
 * Boş bırakmak "kaydı sil" anlamına gelir. Tarih değişince `key` ile sıfırlanır.
 */
export function NumberField({
  id,
  value,
  onCommit,
  min = 0,
  max,
  suffix,
  placeholder = "—",
  width = "w-24",
  label,
  decimal = false,
}: {
  id?: string;
  value: number | undefined;
  onCommit: (n: number | undefined) => void;
  min?: number;
  max: number;
  suffix?: string;
  placeholder?: string;
  width?: string;
  label: string;
  /** Ondalık sayı (virgül veya nokta) kabul eder. */
  decimal?: boolean;
}) {
  const [text, setText] = useState(value === undefined ? "" : String(value));
  const [err, setErr] = useState<string | null>(null);

  // Değer dışarıdan değişirse (ör. hazır süre düğmesi) metni eşitle.
  useEffect(() => {
    setText((t) => ((t === "" ? undefined : Number(t.replace(",", "."))) === value ? t : value === undefined ? "" : String(value)));
    if (value !== undefined) setErr(null);
  }, [value]);

  function change(raw: string) {
    const t = (decimal ? raw.replace(/[^\d.,]/g, "").slice(0, 10) : raw.replace(/[^\d]/g, "").slice(0, 7));
    setText(t);
    if (t === "") {
      setErr(null);
      onCommit(undefined);
      return;
    }
    const n = Number(t.replace(",", "."));
    if (Number.isNaN(n) || n < min || n > max) {
      setErr(`${min} – ${max} arasında bir değer gir`);
      return;
    }
    setErr(null);
    onCommit(decimal ? Math.round(n * 100) / 100 : n);
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input id={id} className={clsx("input num text-center", width)} inputMode={decimal ? "decimal" : "numeric"} aria-label={label} aria-invalid={err ? true : undefined} placeholder={placeholder} value={text} onChange={(e) => change(e.target.value)} />
        {suffix && <span className="text-[13px] text-mute">{suffix}</span>}
      </div>
      {err && <p role="alert" className="text-[11px] text-rose">{err}</p>}
    </div>
  );
}

export function ClearButton({ onClick, label = "Temizle" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={() => {
      sfx.clear();
      onClick();
    }} className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2 text-[12px] text-mute transition-colors hover:text-text">
      <X size={13} /> {label}
    </button>
  );
}

export function YesNo({ value, onChange, name }: { value: boolean | null; onChange: (v: boolean | undefined) => void; name: string }) {
  const opt = (v: boolean, label: string, on: string) => {
    const active = value === v;
    return (
      <button
        key={label}
        type="button"
        role="radio"
        aria-checked={active}
        aria-label={`${name}: ${label}`}
        onClick={() => {
          if (active) sfx.clear();
          else if (v) sfx.yes();
          else sfx.no();
          onChange(active ? undefined : v);
        }}
        className={clsx("min-h-[40px] min-w-[76px] rounded-[9px] px-4 text-[13px] font-semibold transition-colors", active ? on : "text-mute hover:text-text")}
      >
        {label}
      </button>
    );
  };
  return (
    <div role="radiogroup" aria-label={name} className="inline-flex rounded-[11px] border border-line-2 bg-ink p-0.5">
      {opt(true, "Evet", "bg-accent/15 text-accent shadow-[inset_0_0_0_1px_rgba(0,255,102,0.35)]")}
      {opt(false, "Hayır", "bg-rose/15 text-rose shadow-[inset_0_0_0_1px_rgba(242,103,122,0.35)]")}
    </div>
  );
}

export function Stepper({ value, onChange, max, label }: { value: number | undefined; onChange: (n: number | undefined) => void; max: number; label: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <button type="button" aria-label={`${label}: azalt`} disabled={value === undefined || value <= 0} onClick={() => {
          sfx.step(false);
          onChange(Math.max(0, (value ?? 0) - 1));
        }} className="btn btn-quiet !min-h-[44px] !w-11 !px-0">
        <Minus size={16} />
      </button>
      <span className={clsx("num w-12 text-center text-2xl font-semibold", value === undefined && "text-faint")} aria-live="polite">{value ?? "—"}</span>
      <button type="button" aria-label={`${label}: artır`} disabled={value !== undefined && value >= max} onClick={() => {
          sfx.step(true);
          onChange(Math.min(max, (value ?? 0) + 1));
        }} className="btn btn-quiet !min-h-[44px] !w-11 !px-0">
        <Plus size={16} />
      </button>
    </div>
  );
}

export function Row({ id, emoji, question, group, children, hint, highlight }: { id: string; emoji: string; question: string; group: string; children: ReactNode; hint?: ReactNode; highlight?: boolean }) {
  return (
    <div id={`row-${id}`} className={clsx("scroll-mt-24 px-4 py-4 transition-colors duration-700 sm:px-5", highlight && "bg-accent/[0.05]")}>
      <div className="mb-2.5 flex items-start gap-2.5">
        <span aria-hidden className="mt-px text-[16px] leading-5">{emoji}</span>
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-5">{question}</p>
          <p className="text-[11px] text-faint">{group}</p>
        </div>
      </div>
      <div className="pl-[26px]">{children}</div>
      {hint && <div className="mt-2 pl-[26px] text-[12px] text-mute">{hint}</div>}
    </div>
  );
}
