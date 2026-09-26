'use client';

import { useActionState } from 'react';
import { saveStudentAction, type FormState } from './actions';
import { Button, FieldLabel, inputClass } from '@/components/ui';
import { formatDateInput } from '@/lib/form-utils';
import { STUDENT_STATUS_LABELS } from '@/lib/labels';

const initialState: FormState = {};

type StudentFormData = {
  id: string;
  fullName: string;
  nationalId: string | null;
  phone: string;
  email: string | null;
  birthDate: Date | null;
  address: string | null;
  source: string | null;
  status: string;
};

export function StudentForm({ student }: { student?: StudentFormData }) {
  const [state, formAction, pending] = useActionState(saveStudentAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {student && <input type="hidden" name="id" value={student.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="fullName">Ad Soyad *</FieldLabel>
          <input id="fullName" name="fullName" defaultValue={student?.fullName} required className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="phone">Telefon *</FieldLabel>
          <input id="phone" name="phone" defaultValue={student?.phone} required className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="nationalId">TC Kimlik No</FieldLabel>
          <input id="nationalId" name="nationalId" defaultValue={student?.nationalId ?? ''} className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="email">E-posta</FieldLabel>
          <input id="email" name="email" type="email" defaultValue={student?.email ?? ''} className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="birthDate">Doğum Tarihi</FieldLabel>
          <input id="birthDate" name="birthDate" type="date" defaultValue={formatDateInput(student?.birthDate)} className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="source">Kaynak</FieldLabel>
          <input id="source" name="source" defaultValue={student?.source ?? ''} placeholder="ör. Instagram, Referans" className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="status">Durum</FieldLabel>
          <select id="status" name="status" defaultValue={student?.status ?? 'LEAD'} className={inputClass}>
            {Object.entries(STUDENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="address">Adres</FieldLabel>
        <textarea id="address" name="address" defaultValue={student?.address ?? ''} rows={2} className={inputClass} />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
        <Button href="/students" variant="secondary">
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
