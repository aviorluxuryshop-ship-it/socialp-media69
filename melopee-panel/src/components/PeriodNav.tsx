"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Segmented } from "@/components/ui";
import { periodOf, shiftPeriod, type Period, type PeriodKind } from "@/lib/dates";

const KIND_LABEL: Record<PeriodKind, string> = { day: "Günlük", week: "Haftalık", month: "Aylık" };

/** Günlük / haftalık / aylık dönem seçici ve ileri-geri gezinme. */
export function PeriodNav({ period, onChange, today }: { period: Period; onChange: (p: Period) => void; today: string }) {
  const current = periodOf(period.kind, today);
  const isCurrent = current.start === period.start;
  const unit = period.kind === "day" ? "gün" : period.kind === "week" ? "hafta" : "ay";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented<PeriodKind>
        label="Dönem türü"
        value={period.kind}
        onChange={(k) => onChange(periodOf(k, period.start <= today && today <= period.end ? today : period.start))}
        options={(["day", "week", "month"] as PeriodKind[]).map((k) => ({ value: k, label: KIND_LABEL[k] }))}
      />
      <div className="flex items-center gap-1">
        <button type="button" className="btn btn-secondary btn-icon" onClick={() => onChange(shiftPeriod(period, -1))} aria-label={`Önceki ${unit}`}>
          <ChevronLeft size={18} />
        </button>
        <span className="num min-w-[150px] px-2 text-center text-[14px] font-bold" aria-live="polite">
          {period.label}
        </span>
        <button type="button" className="btn btn-secondary btn-icon" onClick={() => onChange(shiftPeriod(period, 1))} aria-label={`Sonraki ${unit}`}>
          <ChevronRight size={18} />
        </button>
        {!isCurrent && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(current)}>
            Bu {unit}
          </button>
        )}
      </div>
    </div>
  );
}
