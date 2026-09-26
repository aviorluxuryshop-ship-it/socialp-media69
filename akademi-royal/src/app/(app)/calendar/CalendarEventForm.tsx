'use client';

import { useActionState, useState } from 'react';
import { createCalendarEventAction, type FormState } from './actions';
import { Button, FieldLabel, inputClass } from '@/components/ui';
import { CALENDAR_EVENT_TYPE_LABELS, MANUAL_CALENDAR_EVENT_TYPES } from '@/lib/labels';

const initialState: FormState = {};

export function CalendarEventForm({ defaultDate }: { defaultDate: string }) {
  const [state, formAction, pending] = useActionState(createCalendarEventAction, initialState);
  const [allDay, setAllDay] = useState(true);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <FieldLabel htmlFor="title">Başlık *</FieldLabel>
        <input id="title" name="title" required className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="type">Etkinlik Tipi *</FieldLabel>
          <select id="type" name="type" required defaultValue={MANUAL_CALENDAR_EVENT_TYPES[0]} className={inputClass}>
            {MANUAL_CALENDAR_EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {CALENDAR_EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input id="allDay" name="allDay" type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="h-4 w-4" />
          <FieldLabel htmlFor="allDay">Tüm gün</FieldLabel>
        </div>
        <div>
          <FieldLabel htmlFor="startsAt">Başlangıç *</FieldLabel>
          <input
            id="startsAt"
            name="startsAt"
            type={allDay ? 'date' : 'datetime-local'}
            required
            defaultValue={allDay ? defaultDate : `${defaultDate}T09:00`}
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="endsAt">Bitiş</FieldLabel>
          <input id="endsAt" name="endsAt" type={allDay ? 'date' : 'datetime-local'} className={inputClass} />
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="description">Açıklama</FieldLabel>
        <textarea id="description" name="description" rows={2} className={inputClass} />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
        <Button href="/calendar" variant="secondary">
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
