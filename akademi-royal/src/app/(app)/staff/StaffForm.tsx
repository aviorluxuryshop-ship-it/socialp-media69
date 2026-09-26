'use client';

import { useActionState, useState } from 'react';
import { saveStaffAction, type FormState } from './actions';
import { Button, FieldLabel, inputClass } from '@/components/ui';
import { formatDateInput } from '@/lib/form-utils';

const initialState: FormState = {};

type StaffFormData = {
  id: string;
  fullName: string;
  position: string;
  phone: string | null;
  email: string | null;
  hireDate: Date;
  birthDate: Date | null;
  address: string | null;
  salaryAmount: unknown;
  notes: string | null;
  isActive: boolean;
  trainer: { specialty: string; payType: string; payRate: unknown; bio: string | null } | null;
};

export function StaffForm({ staff }: { staff?: StaffFormData }) {
  const [state, formAction, pending] = useActionState(saveStaffAction, initialState);
  const [isTrainer, setIsTrainer] = useState(Boolean(staff?.trainer));

  return (
    <form action={formAction} className="space-y-6">
      {staff && <input type="hidden" name="id" value={staff.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="fullName">Ad Soyad *</FieldLabel>
          <input id="fullName" name="fullName" defaultValue={staff?.fullName} required className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="position">Pozisyon *</FieldLabel>
          <input id="position" name="position" defaultValue={staff?.position} required className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="phone">Telefon</FieldLabel>
          <input id="phone" name="phone" defaultValue={staff?.phone ?? ''} className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="email">E-posta</FieldLabel>
          <input id="email" name="email" type="email" defaultValue={staff?.email ?? ''} className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="hireDate">İşe Giriş Tarihi *</FieldLabel>
          <input
            id="hireDate"
            name="hireDate"
            type="date"
            defaultValue={formatDateInput(staff?.hireDate)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="birthDate">Doğum Tarihi</FieldLabel>
          <input id="birthDate" name="birthDate" type="date" defaultValue={formatDateInput(staff?.birthDate)} className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="salaryAmount">Maaş (₺)</FieldLabel>
          <input
            id="salaryAmount"
            name="salaryAmount"
            type="number"
            step="0.01"
            defaultValue={staff?.salaryAmount ? String(staff.salaryAmount) : ''}
            className={inputClass}
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input id="isActive" name="isActive" type="checkbox" defaultChecked={staff?.isActive ?? true} className="h-4 w-4" />
          <FieldLabel htmlFor="isActive">Aktif personel</FieldLabel>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="address">Adres</FieldLabel>
        <textarea id="address" name="address" defaultValue={staff?.address ?? ''} rows={2} className={inputClass} />
      </div>

      <div>
        <FieldLabel htmlFor="notes">Notlar</FieldLabel>
        <textarea id="notes" name="notes" defaultValue={staff?.notes ?? ''} rows={2} className={inputClass} />
      </div>

      <div className="rounded-lg border border-[var(--color-mist)] p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-royal)]">
          <input
            type="checkbox"
            name="isTrainer"
            checked={isTrainer}
            onChange={(e) => setIsTrainer(e.target.checked)}
            className="h-4 w-4"
          />
          Bu personel bir eğitmen
        </label>

        {isTrainer && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="specialty">Uzmanlık Alanı *</FieldLabel>
              <input id="specialty" name="specialty" defaultValue={staff?.trainer?.specialty} className={inputClass} />
            </div>
            <div>
              <FieldLabel htmlFor="payType">Ücretlendirme Tipi</FieldLabel>
              <select id="payType" name="payType" defaultValue={staff?.trainer?.payType ?? 'MONTHLY'} className={inputClass}>
                <option value="HOURLY">Saatlik</option>
                <option value="MONTHLY">Aylık</option>
                <option value="PER_SESSION">Ders Başı</option>
                <option value="FIXED">Sabit</option>
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="payRate">Ücret (₺)</FieldLabel>
              <input
                id="payRate"
                name="payRate"
                type="number"
                step="0.01"
                defaultValue={staff?.trainer?.payRate ? String(staff.trainer.payRate) : ''}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="bio">Kısa Özgeçmiş</FieldLabel>
              <textarea id="bio" name="bio" defaultValue={staff?.trainer?.bio ?? ''} rows={2} className={inputClass} />
            </div>
          </div>
        )}
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
        <Button href="/staff" variant="secondary">
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
