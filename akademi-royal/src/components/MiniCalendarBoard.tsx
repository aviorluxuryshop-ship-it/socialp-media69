'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { createCalendarEventAction, type FormState } from '@/app/(app)/calendar/actions';
import { MANUAL_CALENDAR_EVENT_TYPES, CALENDAR_EVENT_TYPE_LABELS } from '@/lib/labels';

type CalItem = { id: string; title: string; time?: string; href?: string };
type Day = { iso: string; day: number; inMonth: boolean; items: CalItem[] };

const DAY_HEADERS = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];
const initialState: FormState = {};

export function MiniCalendarBoard({ todayIso, days, canCreate }: { todayIso: string; days: Day[]; canCreate: boolean }) {
  const [selected, setSelected] = useState(todayIso);
  const [showAddForm, setShowAddForm] = useState(false);
  const [state, formAction, pending] = useActionState(createCalendarEventAction, initialState);
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
            onClick={() => {
              setSelected(d.iso);
              setShowAddForm(false);
            }}
            className={`flex h-9 flex-col items-center justify-center rounded text-xs transition hover:bg-[var(--color-mist)] hover:scale-105 ${
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
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--color-royal)]">
            {isToday ? 'Bugünün Planları' : `${selected} Tarihinin Planları`}
          </h3>
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="rounded-md border border-[var(--color-mist)] px-2 py-1 text-xs font-medium text-[var(--color-royal)] hover:bg-[var(--color-mist)]"
            >
              {showAddForm ? 'Vazgeç' : '+ Etkinlik Ekle'}
            </button>
          )}
        </div>

        {showAddForm && (
          <form action={formAction} className="mb-3 space-y-2 rounded-md bg-[var(--color-mist)]/30 p-2.5">
            <input type="hidden" name="startsAt" value={`${selected}T09:00`} />
            <input type="hidden" name="returnTo" value="/dashboard" />
            <input type="hidden" name="allDay" value="on" />
            <input
              name="title"
              required
              placeholder="Başlık (ör. Veli toplantısı)"
              className="w-full rounded-md border border-[var(--color-mist)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <div className="flex gap-2">
              <select
                name="type"
                required
                defaultValue={MANUAL_CALENDAR_EVENT_TYPES[0]}
                className="flex-1 rounded-md border border-[var(--color-mist)] px-2.5 py-1.5 text-sm"
              >
                {MANUAL_CALENDAR_EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {CALENDAR_EVENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {pending ? 'Ekleniyor…' : 'Ekle'}
              </button>
            </div>
            {state.error && <p className="text-xs text-red-600">{state.error}</p>}
          </form>
        )}

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
