'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { emptyToNull, parseDate } from '@/lib/form-utils';

export type FormState = { error?: string };

export async function saveMebProcessAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = emptyToNull(formData.get('id'));
  const user = await requirePermission(id ? 'meb.edit' : 'meb.create');

  const enrollmentId = emptyToNull(formData.get('enrollmentId'));
  const expiresAt = parseDate(formData.get('expiresAt'));
  const groupNumber = emptyToNull(formData.get('groupNumber'));
  const returnTo = emptyToNull(formData.get('returnTo'));

  if (!enrollmentId || !expiresAt) {
    return { error: 'Eğitim kaydı ve süreç dolma tarihi zorunludur.' };
  }

  try {
    if (id) {
      await prisma.mebProcess.update({ where: { id }, data: { expiresAt, groupNumber } });
    } else {
      await prisma.mebProcess.create({ data: { enrollmentId, expiresAt, groupNumber, createdByUserId: user.id } });
    }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { error: 'Bu eğitim kaydı için zaten bir MEB süreci var.' };
    }
    throw err;
  }

  revalidatePath('/meb');
  if (returnTo) {
    revalidatePath(returnTo);
    redirect(returnTo);
  }
  redirect('/meb');
}

export async function deleteMebProcessAction(returnTo: string, id: string) {
  await requirePermission('meb.delete');
  await prisma.mebProcess.delete({ where: { id } });
  revalidatePath('/meb');
  revalidatePath(returnTo);
}
