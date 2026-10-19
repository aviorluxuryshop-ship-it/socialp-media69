"use client";

import clsx from "clsx";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

export function SectionHead({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="h-title mt-1 text-lg">{title}</h2>
      </div>
      {right}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = "md",
}: {
  value: T | null;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[10px] border border-line-2 bg-ink p-0.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={clsx(
              "rounded-[8px] px-3 text-[13px] font-semibold transition-colors",
              size === "md" ? "min-h-[38px]" : "min-h-[30px]",
              on ? "bg-raised text-text shadow-[inset_0_0_0_1px_var(--color-line-2)]" : "text-mute hover:text-text",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Delta({ value, unit = "puan", invert = false }: { value: number | null; unit?: string; invert?: boolean }) {
  if (value === null) return <span className="text-xs text-faint">karşılaştırma için yeterli veri yok</span>;
  const up = value > 0;
  const flat = value === 0;
  const good = invert ? !up : up;
  const Icon = flat ? ArrowRight : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={clsx("inline-flex items-center gap-1 text-xs font-semibold num", flat ? "text-mute" : good ? "text-accent" : "text-rose")}>
      <Icon size={14} />
      {value > 0 ? "+" : ""}
      {value} {unit}
    </span>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-2 px-5 py-9 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="max-w-sm text-[13px] leading-relaxed text-mute">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
