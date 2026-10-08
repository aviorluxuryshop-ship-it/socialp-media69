'use client';

import { useActionState } from 'react';
import { saveMebProcessAction, type FormState } from './actions';
import { Button, FieldLabel, inputClass } from '@/components/ui';
import { formatDateInput } from '@/lib/form-utils';

const initialState: FormState = {};

type EnrollmentOption = { id: string; label: string };
type MebDefaultValues = { id: string; enrollmentId: string; groupNumber: string | null; expiresAt: Date };

export function MebForm({
  enrollments,
  returnTo,
  defaultValues,
}: {
  enrollments: EnrollmentOption[];
  returnTo: string;
  defaultValues?: MebDefaultValues;
}) {
  const [state, formAction, pending] = useActionState(saveMebProcessAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {defaultValues && <input type="hidden" name="id" value={defaultValues.id} />}
      {defaultValues && <input type="hidden" name="enrollmentId" value={defaultValues.enrollmentId} />}
      <input type="hidden" name="returnTo" value={returnTo} />

      <div>
        <FieldLabel htmlFor="enrollmentId">Sınava Gireceği Eğitim *</FieldLabel>
        <select
          id="enrollmentId"
          name={defaultValues ? undefined : 'enrollmentId'}
          required
          disabled={Boolean(defaultValues)}
          defaultValue={defaultValues?.enrollmentId ?? ''}
          className={inputClass}
        >
          <option value="" disabled>
            Seçiniz…
          </option>
          {enrollments.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="groupNumber">Sınav Grup Numarası</FieldLabel>
          <input id="groupNumber" name="groupNumber" defaultValue={defaultValues?.groupNumber ?? ''} className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="expiresAt">Süreç Dolma Tarihi *</FieldLabel>
          <input
            id="expiresAt"
            name="expiresAt"
            type="date"
            required
            defaultValue={formatDateInput(defaultValues?.expiresAt)}
            className={inputClass}
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
        <Button href={returnTo} variant="secondary">
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
