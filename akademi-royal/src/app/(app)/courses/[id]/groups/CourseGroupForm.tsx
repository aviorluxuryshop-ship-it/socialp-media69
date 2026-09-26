'use client';

import { useActionState } from 'react';
import { saveCourseGroupAction, type FormState } from './actions';
import { Button, FieldLabel, inputClass } from '@/components/ui';
import { formatDateInput } from '@/lib/form-utils';
import { COURSE_GROUP_STATUS_LABELS } from '@/lib/labels';

const initialState: FormState = {};

type GroupFormData = {
  id: string;
  courseId: string;
  trainerId: string;
  code: string;
  startDate: Date;
  endDate: Date | null;
  capacity: number | null;
  status: string;
};

export function CourseGroupForm({
  courseId,
  group,
  trainers,
}: {
  courseId: string;
  group?: GroupFormData;
  trainers: { id: string; fullName: string; specialty: string }[];
}) {
  const [state, formAction, pending] = useActionState(saveCourseGroupAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="courseId" value={courseId} />
      {group && <input type="hidden" name="id" value={group.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="code">Grup Kodu *</FieldLabel>
          <input id="code" name="code" defaultValue={group?.code} required className={inputClass} placeholder="ör. PT-2026-01" />
        </div>
        <div>
          <FieldLabel htmlFor="trainerId">Eğitmen *</FieldLabel>
          <select id="trainerId" name="trainerId" defaultValue={group?.trainerId ?? ''} required className={inputClass}>
            <option value="" disabled>
              Seçiniz…
            </option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName} — {t.specialty}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="startDate">Başlangıç Tarihi *</FieldLabel>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={formatDateInput(group?.startDate)}
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="endDate">Bitiş Tarihi</FieldLabel>
          <input id="endDate" name="endDate" type="date" defaultValue={formatDateInput(group?.endDate)} className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="capacity">Kontenjan</FieldLabel>
          <input id="capacity" name="capacity" type="number" defaultValue={group?.capacity ?? ''} className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="status">Durum</FieldLabel>
          <select id="status" name="status" defaultValue={group?.status ?? 'PLANNED'} className={inputClass}>
            {Object.entries(COURSE_GROUP_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
        <Button href={`/courses/${courseId}`} variant="secondary">
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
