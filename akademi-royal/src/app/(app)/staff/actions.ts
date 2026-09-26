'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma, TrainerPayType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { emptyToNull, parseDate, parseDecimal } from '@/lib/form-utils';

export type FormState = { error?: string };

const PAY_TYPES: TrainerPayType[] = ['HOURLY', 'MONTHLY', 'PER_SESSION', 'FIXED'];

export async function saveStaffAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = emptyToNull(formData.get('id'));
  await requirePermission(id ? 'staff.edit' : 'staff.create');

  const fullName = emptyToNull(formData.get('fullName'));
  const position = emptyToNull(formData.get('position'));
  const hireDate = parseDate(formData.get('hireDate'));

  if (!fullName || !position || !hireDate) {
    return { error: 'Ad soyad, pozisyon ve işe giriş tarihi zorunludur.' };
  }

  const isTrainer = formData.get('isTrainer') === 'on';
  const specialty = emptyToNull(formData.get('specialty'));
  if (isTrainer && !specialty) {
    return { error: 'Eğitmen olarak işaretlendi; uzmanlık alanı zorunludur.' };
  }

  const data = {
    fullName,
    position,
    hireDate,
    birthDate: parseDate(formData.get('birthDate')),
    phone: emptyToNull(formData.get('phone')),
    email: emptyToNull(formData.get('email')),
    address: emptyToNull(formData.get('address')),
    salaryAmount: parseDecimal(formData.get('salaryAmount')),
    notes: emptyToNull(formData.get('notes')),
    isActive: formData.get('isActive') === 'on',
  };

  const staffId = id
    ? (await prisma.staff.update({ where: { id }, data })).id
    : (await prisma.staff.create({ data })).id;

  if (isTrainer) {
    const payTypeRaw = String(formData.get('payType') ?? 'MONTHLY');
    const payType = PAY_TYPES.includes(payTypeRaw as TrainerPayType) ? (payTypeRaw as TrainerPayType) : 'MONTHLY';
    const trainerData = {
      specialty: specialty!,
      payType,
      payRate: parseDecimal(formData.get('payRate')) ?? 0,
      bio: emptyToNull(formData.get('bio')),
    };
    await prisma.trainer.upsert({
      where: { staffId },
      update: trainerData,
      create: { staffId, ...trainerData },
    });
  } else {
    await prisma.trainer.deleteMany({ where: { staffId } });
  }

  revalidatePath('/staff');
  revalidatePath(`/staff/${staffId}`);
  redirect(`/staff/${staffId}`);
}

export async function toggleStaffActiveAction(id: string) {
  await requirePermission('staff.edit');
  const staff = await prisma.staff.findUniqueOrThrow({ where: { id } });
  await prisma.staff.update({ where: { id }, data: { isActive: !staff.isActive } });
  revalidatePath('/staff');
  revalidatePath(`/staff/${id}`);
}

export async function deleteStaffAction(id: string) {
  await requirePermission('staff.delete');
  try {
    await prisma.staff.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      redirect(`/staff/${id}?error=${encodeURIComponent('Bu personel bir eğitim grubuna eğitmen olarak atanmış, önce grup atamasını değiştirin.')}`);
    }
    throw err;
  }
  revalidatePath('/staff');
  redirect('/staff');
}
