"use client";

import clsx from "clsx";
import type { Status } from "@/lib/stats";

const COLOR: Record<Status, string> = {
  done: "bg-accent/80",
  missed: "bg-rose/60",
  recorded: "bg-sky/50",
  unrecorded: "bg-line",
};
export const STATUS_LABEL: Record<Status, string> = { done: "Tamamlandı", missed: "Hedef dışı / Hayır", recorded: "Kaydedildi", unrecorded: "Kaydedilmedi" };

/** Günlük durum şeridi: her gün bir hücre. Tutarlılığı tek bakışta gösterir. */
export function Strip({ cells, ariaLabel }: { cells: { title: string; status: Status }[]; ariaLabel: string }) {
  return (
    <div role="img" aria-label={ariaLabel} className="flex gap-[3px]">
      {cells.map((c, i) => (
        <span key={i} title={`${c.title} · ${STATUS_LABEL[c.status]}`} className={clsx("h-7 min-w-0 flex-1 rounded-[4px]", COLOR[c.status])} />
      ))}
    </div>
  );
}

export function StripLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-mute">
      {(["done", "missed", "unrecorded"] as Status[]).map((s) => (
        <span key={s} className="flex items-center gap-1.5">
          <i className={clsx("h-2.5 w-2.5 rounded-[3px]", COLOR[s])} /> {STATUS_LABEL[s]}
        </span>
      ))}
    </div>
  );
}
