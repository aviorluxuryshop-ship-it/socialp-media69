'use client';

import { useActionState } from 'react';
import { saveExpenseCategoryAction, type FormState } from '../actions';
import { inputClass } from '@/components/ui';

const initialState: FormState = {};

export function CategoryForm() {
  const [state, formAction, pending] = useActionState(saveExpenseCategoryAction, initialState);

  return (
    <form action={formAction} className="flex items-start gap-2">
      <div className="flex-1">
        <input name="name" required placeholder="Yeni kategori adı" className={inputClass} />
        {state.error && <p className="mt-1 text-sm text-red-600">{state.error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--color-royal)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? 'Ekleniyor…' : 'Ekle'}
      </button>
    </form>
  );
}
