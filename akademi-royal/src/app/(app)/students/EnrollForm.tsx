'use client';

import { useActionState, useState } from 'react';
import { createEnrollmentAction, type FormState } from './actions';
import { Button, FieldLabel, inputClass } from '@/components/ui';

const initialState: FormState = {};

type CourseOption = { id: string; label: string; defaultPrice: string };

export function EnrollForm({ studentId, courses }: { studentId: string; courses: CourseOption[] }) {
  const [state, formAction, pending] = useActionState(createEnrollmentAction, initialState);
  const [totalAmount, setTotalAmount] = useState('');

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="studentId" value={studentId} />

      <div>
        <FieldLabel htmlFor="courseId">Eğitim *</FieldLabel>
        <select
          id="courseId"
          name="courseId"
          required
          defaultValue=""
          className={inputClass}
          onChange={(e) => {
            const selected = courses.find((c) => c.id === e.target.value);
            if (selected) setTotalAmount(selected.defaultPrice);
          }}
        >
          <option value="" disabled>
            Seçiniz…
          </option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
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
        <Button href={`/students/${studentId}`} variant="secondary">
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
