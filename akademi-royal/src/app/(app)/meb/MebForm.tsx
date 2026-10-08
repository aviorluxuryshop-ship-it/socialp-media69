'use client';

import { useActionState } from 'react';
import { saveMebProcessAction, type FormState } from './actions';
import { Button, FieldLabel, inputClass } from '@/components/ui';
import { formatDateInput } from '@/lib/form-utils';

const initialState: FormState = {};

type CourseOption = { id: string; name: string };
type MebDefaultValues = { id: string; courseId: string; groupNumber: string | null; completionDate: Date; capacity: number | null };

export function MebForm({
  courses,
  defaultValues,
}: {
  courses: CourseOption[];
  defaultValues?: MebDefaultValues;
}) {
  const [state, formAction, pending] = useActionState(saveMebProcessAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {defaultValues && <input type="hidden" name="id" value={defaultValues.id} />}

      <div>
        <FieldLabel htmlFor="courseId">Sürecin Başlayacağı Eğitim *</FieldLabel>
        <select
          id="courseId"
          name="courseId"
          required
          disabled={Boolean(defaultValues)}
          defaultValue={defaultValues?.courseId ?? ''}
          className={inputClass}
        >
          <option value="" disabled>
            Seçiniz…
          </option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {defaultValues && <input type="hidden" name="courseId" value={defaultValues.courseId} />}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor="groupNumber">Sınav Grup Numarası</FieldLabel>
          <input id="groupNumber" name="groupNumber" defaultValue={defaultValues?.groupNumber ?? ''} className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="completionDate">Süreç Tamamlanma Tarihi *</FieldLabel>
          <input
            id="completionDate"
            name="completionDate"
            type="date"
            required
            defaultValue={formatDateInput(defaultValues?.completionDate)}
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="capacity">Kontenjan</FieldLabel>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min="1"
            defaultValue={defaultValues?.capacity ?? ''}
            className={inputClass}
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
        <Button href="/meb" variant="secondary">
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
