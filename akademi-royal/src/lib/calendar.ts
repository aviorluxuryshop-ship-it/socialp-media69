import { prisma } from '@/lib/prisma';

export function getMonthGridDays(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month - 1, 1);
  const firstDayIndex = (firstOfMonth.getDay() + 6) % 7; // 0=Pazartesi
  const start = new Date(year, month - 1, 1 - firstDayIndex);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type CalendarItem = {
  id: string;
  date: string; // yyyy-mm-dd
  type: string;
  title: string;
  time?: string;
  deletable: boolean;
  href?: string;
};

export async function getMonthCalendarItems(year: number, month: number): Promise<CalendarItem[]> {
  const rangeStart = new Date(year, month - 1, 1);
  const rangeEnd = new Date(year, month, 0);
  const rangeEndInclusive = new Date(year, month, 0, 23, 59, 59, 999);

  const [groups, events, tasks] = await Promise.all([
    prisma.courseGroup.findMany({
      where: {
        status: { in: ['PLANNED', 'ACTIVE'] },
        startDate: { lte: rangeEnd },
        OR: [{ endDate: null }, { endDate: { gte: rangeStart } }],
      },
      include: { course: true, scheduleSlots: true },
    }),
    prisma.calendarEvent.findMany({ where: { startsAt: { gte: rangeStart, lte: rangeEndInclusive } } }),
    prisma.task.findMany({ where: { dueDate: { gte: rangeStart, lte: rangeEndInclusive }, status: { not: 'CANCELLED' } } }),
  ]);

  const items: CalendarItem[] = [];

  for (const g of groups) {
    if (g.scheduleSlots.length === 0) continue;
    const groupEnd = g.endDate ?? new Date(g.startDate.getFullYear(), g.startDate.getMonth() + 3, g.startDate.getDate());
    const from = g.startDate > rangeStart ? g.startDate : rangeStart;
    const to = groupEnd < rangeEnd ? groupEnd : rangeEnd;

    for (let cursor = new Date(from); cursor <= to; cursor.setDate(cursor.getDate() + 1)) {
      const dow = (cursor.getDay() + 6) % 7;
      for (const slot of g.scheduleSlots) {
        if (slot.dayOfWeek === dow) {
          items.push({
            id: `class-${g.id}-${slot.id}-${isoDate(cursor)}`,
            date: isoDate(cursor),
            type: 'CLASS',
            title: `${g.course.name} — ${g.code}`,
            time: `${slot.startTime}-${slot.endTime}`,
            deletable: false,
            href: `/courses/${g.courseId}/groups/${g.id}`,
          });
        }
      }
    }
  }

  for (const e of events) {
    items.push({
      id: e.id,
      date: isoDate(e.startsAt),
      type: e.type,
      title: e.title,
      time: e.allDay ? undefined : e.startsAt.toISOString().slice(11, 16),
      deletable: true,
    });
  }

  for (const t of tasks) {
    if (!t.dueDate) continue;
    items.push({ id: `task-${t.id}`, date: isoDate(t.dueDate), type: 'TASK_DUE', title: `Görev: ${t.title}`, deletable: false, href: '/tasks' });
  }

  return items;
}
