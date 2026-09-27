'use client';

import { useActionState } from 'react';
import { createStaffLoginAction, resetStaffLoginPasswordAction, type LoginFormState } from './actions';
import { Button, FieldLabel, inputClass } from '@/components/ui';

const initialState: LoginFormState = {};

type RoleOption = { id: string; name: string };

export function CreateStaffLoginForm({ staffId, roles }: { staffId: string; roles: RoleOption[] }) {
  const action = createStaffLoginAction.bind(null, staffId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <FieldLabel htmlFor="email">E-posta *</FieldLabel>
        <input id="email" name="email" type="email" required className={inputClass} />
      </div>
      <div>
        <FieldLabel htmlFor="password">Şifre *</FieldLabel>
        <input id="password" name="password" type="password" required minLength={8} className={inputClass} />
      </div>
      <div>
        <FieldLabel htmlFor="roleId">Rol *</FieldLabel>
        <select id="roleId" name="roleId" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Seçiniz…
          </option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Oluşturuluyor…' : 'Panel Girişi Oluştur'}
      </Button>
    </form>
  );
}

export function ResetStaffLoginPasswordForm({ staffId }: { staffId: string }) {
  const action = resetStaffLoginPasswordAction.bind(null, staffId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex-1">
        <FieldLabel htmlFor="password">Yeni Şifre</FieldLabel>
        <input id="password" name="password" type="password" required minLength={8} className={inputClass} />
        {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? 'Kaydediliyor…' : 'Şifreyi Sıfırla'}
      </Button>
    </form>
  );
}
