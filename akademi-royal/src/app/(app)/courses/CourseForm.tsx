'use client';

import { useActionState } from 'react';
import { saveCourseAction, type FormState } from './actions';
import { Button, FieldLabel, inputClass } from '@/components/ui';

const initialState: FormState = {};

type CourseFormData = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  durationHours: number | null;
  defaultPrice: unknown;
  isActive: boolean;
};

export function CourseForm({ course }: { course?: CourseFormData }) {
  const [state, formAction, pending] = useActionState(saveCourseAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {course && <input type="hidden" name="id" value={course.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="name">Eğitim Adı *</FieldLabel>
          <input id="name" name="name" defaultValue={course?.name} required className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="category">Kategori</FieldLabel>
          <input id="category" name="category" defaultValue={course?.category ?? ''} className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="durationHours">Süre (saat)</FieldLabel>
          <input
            id="durationHours"
            name="durationHours"
            type="number"
            defaultValue={course?.durationHours ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="defaultPrice">Standart Ücret (₺) *</FieldLabel>
          <input
            id="defaultPrice"
            name="defaultPrice"
            type="number"
            step="0.01"
            required
            defaultValue={course?.defaultPrice ? String(course.defaultPrice) : ''}
            className={inputClass}
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input id="isActive" name="isActive" type="checkbox" defaultChecked={course?.isActive ?? true} className="h-4 w-4" />
          <FieldLabel htmlFor="isActive">Aktif eğitim</FieldLabel>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="description">Açıklama</FieldLabel>
        <textarea id="description" name="description" defaultValue={course?.description ?? ''} rows={3} className={inputClass} />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
        <Button href="/courses" variant="secondary">
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
