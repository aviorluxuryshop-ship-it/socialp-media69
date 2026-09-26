'use client';

import { useActionState } from 'react';
import { saveTaskAction, type FormState } from './actions';
import { Button, FieldLabel, inputClass } from '@/components/ui';
import { TASK_PRIORITY_LABELS } from '@/lib/labels';

const initialState: FormState = {};

export function TaskForm({ users }: { users: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(saveTaskAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <FieldLabel htmlFor="title">Görev Adı *</FieldLabel>
        <input id="title" name="title" required className={inputClass} />
      </div>

      <div>
        <FieldLabel htmlFor="description">Açıklama</FieldLabel>
        <textarea id="description" name="description" rows={3} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor="dueDate">Son Tarih</FieldLabel>
          <input id="dueDate" name="dueDate" type="date" className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="priority">Öncelik</FieldLabel>
          <select id="priority" name="priority" defaultValue="MEDIUM" className={inputClass}>
            {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="assignedToUserId">Atanan Personel</FieldLabel>
          <select id="assignedToUserId" name="assignedToUserId" defaultValue="" className={inputClass}>
            <option value="">Havuzda bırak</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
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
        <Button href="/tasks" variant="secondary">
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
