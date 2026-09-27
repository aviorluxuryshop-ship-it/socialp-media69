'use client';

import { useActionState, useState } from 'react';
import { createEnrollmentAction, type FormState } from '@/app/(app)/students/actions';
import { Button, FieldLabel, inputClass } from '@/components/ui';

const initialState: FormState = {};

type StudentOption = { id: string; label: string };

export function GroupEnrollForm({
  courseGroupId,
  returnTo,
  defaultPrice,
  students,
}: {
  courseGroupId: string;
  returnTo: string;
  defaultPrice: string;
  students: StudentOption[];
}) {
  const [state, formAction, pending] = useActionState(createEnrollmentAction, initialState);
  const [totalAmount, setTotalAmount] = useState(defaultPrice);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="courseGroupId" value={courseGroupId} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div>
        <FieldLabel htmlFor="studentId">Öğrenci *</FieldLabel>
        <select id="studentId" name="studentId" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Seçiniz…
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor="totalAmount">Toplam Ücret (₺) *</FieldLabel>
          <input
            id="totalAmount"
            name="totalAmount"
            type="number"
            step="0.01"
            required
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="discountAmount">İndirim (₺)</FieldLabel>
          <input id="discountAmount" name="discountAmount" type="number" step="0.01" defaultValue="0" className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="installmentCount">Taksit Sayısı</FieldLabel>
          <input id="installmentCount" name="installmentCount" type="number" min="1" defaultValue="1" className={inputClass} />
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
