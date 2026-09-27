'use client';

import { useState } from 'react';
import Link from 'next/link';

type CalItem = { id: string; title: string; time?: string; href?: string };
type Day = { iso: string; day: number; inMonth: boolean; items: CalItem[] };

const DAY_HEADERS = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];

export function MiniCalendarBoard({ todayIso, days }: { todayIso: string; days: Day[] }) {
  const [selected, setSelected] = useState(todayIso);
  const selectedDay = days.find((d) => d.iso === selected);
  const selectedItems = (selectedDay?.items ?? []).slice().sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
  const isToday = selected === todayIso;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[var(--color-royal-dim)]">
        {DAY_HEADERS.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => (
          <button
            key={d.iso}
            type="button"
            onClick={() => setSelected(d.iso)}
            className={`flex h-9 flex-col items-center justify-center rounded text-xs hover:bg-[var(--color-mist)] ${
              d.inMonth ? '' : 'text-[var(--color-royal-dim)] opacity-40'
            } ${d.iso === todayIso ? 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]' : ''} ${
              d.iso === selected && d.iso !== todayIso ? 'ring-2 ring-inset ring-[var(--color-accent)]' : ''
            }`}
          >
            <span>{d.day}</span>
            {d.items.length > 0 && (
              <span className={`mt-0.5 h-1 w-1 rounded-full ${d.iso === todayIso ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-accent)]'}`} />
            )}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-[var(--color-mist)] p-3">
        <h3 className="mb-2 text-sm font-semibold text-[var(--color-royal)]">
          {isToday ? 'Bugünün Planları' : `${selected} Tarihinin Planları`}
        </h3>
        {selectedItems.length === 0 ? (
          <p className="text-sm text-[var(--color-royal-dim)]">Bu tarihte planlanmış bir etkinlik yok.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {selectedItems.map((it) => (
              <li key={it.id} className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-xs text-[var(--color-royal-dim)]">{it.time ?? 'Tüm gün'}</span>
                {it.href ? (
                  <Link href={it.href} className="hover:underline">
                    {it.title}
                  </Link>
                ) : (
                  <span>{it.title}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
