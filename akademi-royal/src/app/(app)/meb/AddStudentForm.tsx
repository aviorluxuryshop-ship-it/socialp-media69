'use client';

import { addStudentToMebProcessAction } from './actions';
import { Button, FieldLabel, inputClass } from '@/components/ui';

type EnrollmentOption = { id: string; label: string };

export function AddStudentForm({ mebProcessId, options }: { mebProcessId: string; options: EnrollmentOption[] }) {
  const action = addStudentToMebProcessAction.bind(null, mebProcessId);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <div className="flex-1 min-w-[200px]">
        <FieldLabel htmlFor="enrollmentId">Öğrenci Ekle</FieldLabel>
        <select id="enrollmentId" name="enrollmentId" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Seçiniz…
          </option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit">+ Ekle</Button>
    </form>
  );
}
