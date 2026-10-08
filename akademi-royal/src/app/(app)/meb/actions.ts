'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { emptyToNull, parseDate } from '@/lib/form-utils';

export type FormState = { error?: string };

export async function saveMebProcessAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = emptyToNull(formData.get('id'));
  const user = await requirePermission(id ? 'meb.edit' : 'meb.create');

  const courseId = emptyToNull(formData.get('courseId'));
  const completionDate = parseDate(formData.get('completionDate'));
  const groupNumber = emptyToNull(formData.get('groupNumber'));
  const capacityRaw = emptyToNull(formData.get('capacity'));
  const capacity = capacityRaw ? Number(capacityRaw) : null;

  if (!courseId || !completionDate) {
    return { error: 'Eğitim ve süreç tamamlanma tarihi zorunludur.' };
  }

  if (id) {
    await prisma.mebProcess.update({ where: { id }, data: { groupNumber, completionDate, capacity } });
    revalidatePath('/meb');
    revalidatePath(`/meb/${id}`);
    redirect(`/meb/${id}`);
  }

  const process = await prisma.mebProcess.create({
    data: { courseId, groupNumber, completionDate, capacity, createdByUserId: user.id },
  });

  revalidatePath('/meb');
  redirect(`/meb/${process.id}`);
}

export async function deleteMebProcessAction(id: string) {
  await requirePermission('meb.delete');
  await prisma.mebProcess.delete({ where: { id } });
  revalidatePath('/meb');
  redirect('/meb');
}

export async function addStudentToMebProcessAction(mebProcessId: string, formData: FormData) {
  await requirePermission('meb.edit');
  const enrollmentId = emptyToNull(formData.get('enrollmentId'));
  if (!enrollmentId) return;

  await prisma.groupEnrollment.update({ where: { id: enrollmentId }, data: { mebProcessId } });
  revalidatePath(`/meb/${mebProcessId}`);
  revalidatePath('/meb');
}

export async function removeStudentFromMebProcessAction(mebProcessId: string, enrollmentId: string) {
  await requirePermission('meb.edit');
  await prisma.groupEnrollment.update({ where: { id: enrollmentId }, data: { mebProcessId: null } });
  revalidatePath(`/meb/${mebProcessId}`);
  revalidatePath('/meb');
}
