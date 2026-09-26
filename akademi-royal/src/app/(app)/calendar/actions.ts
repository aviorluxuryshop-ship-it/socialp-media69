'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CalendarEventType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { emptyToNull } from '@/lib/form-utils';
import { MANUAL_CALENDAR_EVENT_TYPES } from '@/lib/labels';

export type FormState = { error?: string };

export async function createCalendarEventAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('calendar.create');

  const title = emptyToNull(formData.get('title'));
  const typeRaw = String(formData.get('type') ?? '');
  const startsAtRaw = emptyToNull(formData.get('startsAt'));
  const allDay = formData.get('allDay') === 'on';

  if (!title || !startsAtRaw || !MANUAL_CALENDAR_EVENT_TYPES.includes(typeRaw as CalendarEventType)) {
    return { error: 'Başlık, tarih ve etkinlik tipi zorunludur.' };
  }

  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) return { error: 'Geçersiz tarih.' };

  const endsAtRaw = emptyToNull(formData.get('endsAt'));
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null;

  const returnMonth = `${startsAt.getFullYear()}-${startsAt.getMonth() + 1}`;

  await prisma.calendarEvent.create({
    data: {
      title,
      type: typeRaw as CalendarEventType,
      startsAt,
      endsAt,
      allDay,
      description: emptyToNull(formData.get('description')),
      createdByUserId: user.id,
    },
  });

  revalidatePath('/calendar');
  const [year, month] = returnMonth.split('-');
  redirect(`/calendar?year=${year}&month=${month}`);
}

export async function deleteCalendarEventAction(year: number, month: number, day: string, id: string) {
  await requirePermission('calendar.delete');
  await prisma.calendarEvent.delete({ where: { id } });
  revalidatePath('/calendar');
  redirect(`/calendar?year=${year}&month=${month}&day=${day}`);
}
