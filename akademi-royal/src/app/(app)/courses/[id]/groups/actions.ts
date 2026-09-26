'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CourseGroupStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { emptyToNull, parseDate } from '@/lib/form-utils';

export type FormState = { error?: string };

const STATUSES: CourseGroupStatus[] = ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

export async function saveCourseGroupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = emptyToNull(formData.get('id'));
  await requirePermission(id ? 'courses.edit' : 'courses.create');

  const courseId = emptyToNull(formData.get('courseId'));
  const trainerId = emptyToNull(formData.get('trainerId'));
  const code = emptyToNull(formData.get('code'));
  const startDate = parseDate(formData.get('startDate'));

  if (!courseId || !trainerId || !code || !startDate) {
    return { error: 'Eğitmen, grup kodu ve başlangıç tarihi zorunludur.' };
  }

  const statusRaw = String(formData.get('status') ?? 'PLANNED');
  const status = STATUSES.includes(statusRaw as CourseGroupStatus) ? (statusRaw as CourseGroupStatus) : 'PLANNED';
  const capacityRaw = emptyToNull(formData.get('capacity'));

  const data = {
    courseId,
    trainerId,
    code,
    startDate,
    endDate: parseDate(formData.get('endDate')),
    capacity: capacityRaw ? Number(capacityRaw) : null,
    status,
  };

  let group;
  try {
    group = id ? await prisma.courseGroup.update({ where: { id }, data }) : await prisma.courseGroup.create({ data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { error: 'Bu grup kodu zaten kullanılıyor.' };
    }
    throw err;
  }

  revalidatePath(`/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}/groups/${group.id}`);
  redirect(`/courses/${courseId}/groups/${group.id}`);
}

export async function deleteCourseGroupAction(courseId: string, groupId: string) {
  await requirePermission('courses.delete');
  try {
    await prisma.courseGroup.delete({ where: { id: groupId } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      redirect(
        `/courses/${courseId}/groups/${groupId}?error=${encodeURIComponent('Bu gruba kayıtlı öğrenci veya ders programı var, önce onları kaldırın.')}`,
      );
    }
    throw err;
  }
  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}`);
}

export async function addScheduleSlotAction(courseId: string, groupId: string, formData: FormData) {
  await requirePermission('courses.edit');

  const dayOfWeek = Number(formData.get('dayOfWeek'));
  const startTime = emptyToNull(formData.get('startTime'));
  const endTime = emptyToNull(formData.get('endTime'));
  if (!startTime || !endTime || Number.isNaN(dayOfWeek)) return;

  await prisma.courseGroupScheduleSlot.create({
    data: { courseGroupId: groupId, dayOfWeek, startTime, endTime },
  });

  revalidatePath(`/courses/${courseId}/groups/${groupId}`);
}

export async function deleteScheduleSlotAction(courseId: string, groupId: string, slotId: string) {
  await requirePermission('courses.edit');
  await prisma.courseGroupScheduleSlot.delete({ where: { id: slotId } });
  revalidatePath(`/courses/${courseId}/groups/${groupId}`);
}
