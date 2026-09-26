'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { emptyToNull, parseDecimal } from '@/lib/form-utils';

export type FormState = { error?: string };

export async function saveCourseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = emptyToNull(formData.get('id'));
  await requirePermission(id ? 'courses.edit' : 'courses.create');

  const name = emptyToNull(formData.get('name'));
  const defaultPrice = parseDecimal(formData.get('defaultPrice'));
  if (!name || defaultPrice === null) {
    return { error: 'Eğitim adı ve ücreti zorunludur.' };
  }

  const durationRaw = emptyToNull(formData.get('durationHours'));

  const data = {
    name,
    category: emptyToNull(formData.get('category')),
    description: emptyToNull(formData.get('description')),
    durationHours: durationRaw ? Number(durationRaw) : null,
    defaultPrice,
    isActive: formData.get('isActive') === 'on',
  };

  const course = id ? await prisma.course.update({ where: { id }, data }) : await prisma.course.create({ data });

  revalidatePath('/courses');
  revalidatePath(`/courses/${course.id}`);
  redirect(`/courses/${course.id}`);
}

export async function deleteCourseAction(id: string) {
  await requirePermission('courses.delete');
  try {
    await prisma.course.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      redirect(`/courses/${id}?error=${encodeURIComponent('Bu eğitime ait gruplar var, önce onları silin.')}`);
    }
    throw err;
  }
  revalidatePath('/courses');
  redirect('/courses');
}
