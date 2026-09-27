import Link from 'next/link';
import { hasPermission, requirePermission } from '@/lib/auth';
import { getMonthCalendarItems, getMonthGridDays, isoDate } from '@/lib/calendar';
import { Badge, Button, Card, PageHeader } from '@/components/ui';
import { CALENDAR_EVENT_TYPE_LABELS, CALENDAR_FILTERS, CALENDAR_FILTER_TYPES, EXTRA_CALENDAR_ITEM_LABELS, type CalendarFilterKey } from '@/lib/labels';
import { ConfirmForm } from '@/components/ConfirmForm';
import { deleteCalendarEventAction } from './actions';

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
const DAY_HEADERS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const TYPE_TONE: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  CLASS: 'default',
  EXAM: 'danger',
  MEETING: 'warning',
  TASK_DUE: 'warning',
  STAFF_LEAVE: 'default',
  HOLIDAY: 'success',
  OTHER: 'default',
  COLLECTION: 'success',
  EXPENSE_DUE: 'info',
};

const ITEM_LABELS: Record<string, string> = { ...CALENDAR_EVENT_TYPE_LABELS, ...EXTRA_CALENDAR_ITEM_LABELS };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; day?: string; filter?: string }>;
}) {
  const user = await requirePermission('calendar.view');
  const { year: yearRaw, month: monthRaw, day, filter: filterRaw } = await searchParams;

  const now = new Date();
  const year = Number(yearRaw) || now.getFullYear();
  const month = Number(monthRaw) || now.getMonth() + 1;
  const filter: CalendarFilterKey = CALENDAR_FILTERS.some((f) => f.key === filterRaw) ? (filterRaw as CalendarFilterKey) : 'all';
  const allowedTypes = CALENDAR_FILTER_TYPES[filter];

  const gridDays = getMonthGridDays(year, month);
  const allItems = await getMonthCalendarItems(year, month);
  const items = allowedTypes ? allItems.filter((it) => allowedTypes.includes(it.type)) : allItems;
  const itemsByDay = new Map<string, typeof items>();
  for (const item of items) {
    const list = itemsByDay.get(item.date) ?? [];
    list.push(item);
    itemsByDay.set(item.date, list);
  }

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const todayIso = isoDate(now);
  const canCreate = hasPermission(user, 'calendar.create');
  const canDelete = hasPermission(user, 'calendar.delete');

  const dayItems = day ? (itemsByDay.get(day) ?? []) : [];

  return (
    <div>
      <PageHeader
        title="Takvim & Planlama"
        description="Dersler, sınavlar, toplantılar, izinler, görev ve tahsilat/ödeme son tarihleri."
        action={canCreate ? <Button href={`/calendar/new?date=${day ?? todayIso}`}>+ Yeni Etkinlik</Button> : undefined}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {CALENDAR_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/calendar?year=${year}&month=${month}${day ? `&day=${day}` : ''}&filter=${f.key}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filter === f.key
                ? 'bg-[var(--color-accent)] text-white'
                : 'border border-[var(--color-mist)] text-[var(--color-royal)] hover:bg-[var(--color-mist)]'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <Link href={`/calendar?year=${prevMonth.year}&month=${prevMonth.month}&filter=${filter}`} className="text-sm text-[var(--color-royal)] hover:underline">
          ← Önceki Ay
        </Link>
        <h2 className="text-lg font-semibold text-[var(--color-royal)]">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <Link href={`/calendar?year=${nextMonth.year}&month=${nextMonth.month}&filter=${filter}`} className="text-sm text-[var(--color-royal)] hover:underline">
          Sonraki Ay →
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-mist)] bg-[var(--color-surface)]">
        <div className="grid grid-cols-7 bg-[var(--color-mist)]/50 text-center text-xs font-medium text-[var(--color-royal-dim)]">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {gridDays.map((d) => {
            const iso = isoDate(d);
            const inMonth = d.getMonth() + 1 === month;
            const dayEvents = itemsByDay.get(iso) ?? [];
            const isSelected = day === iso;
            return (
              <Link
                key={iso}
                href={`/calendar?year=${year}&month=${month}&day=${iso}&filter=${filter}`}
                className={`min-h-24 border-b border-r border-[var(--color-mist)] p-1.5 text-left align-top hover:bg-[var(--color-mist)]/20 ${
                  inMonth ? '' : 'bg-[var(--color-mist)]/10 text-[var(--color-royal-dim)]'
                } ${isSelected ? 'ring-2 ring-inset ring-[var(--color-royal)]' : ''}`}
              >
                <span className={`text-xs ${iso === todayIso ? 'font-bold text-[var(--color-royal)]' : ''}`}>{d.getDate()}</span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div key={ev.id} className="truncate rounded bg-[var(--color-mist)] px-1 py-0.5 text-[10px] text-[var(--color-royal)]">
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && <div className="text-[10px] text-[var(--color-royal-dim)]">+{dayEvents.length - 2} daha</div>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {day && (
        <div className="mt-6">
          <PageHeader title={`${day} — Günlük Ajanda`} showBack={false} />
          {dayItems.length === 0 ? (
            <p className="text-sm text-[var(--color-royal-dim)]">Bu tarihte bir etkinlik yok.</p>
          ) : (
            <div className="space-y-2">
              {dayItems.map((ev) => (
                <Card key={ev.id} className="flex items-center justify-between">
                  <div>
                    <Badge tone={TYPE_TONE[ev.type] ?? 'default'}>{ITEM_LABELS[ev.type] ?? ev.type}</Badge>
                    <span className="ml-2 text-sm font-medium text-[var(--color-royal)]">
                      {ev.href ? (
                        <Link href={ev.href} className="hover:underline">
                          {ev.title}
                        </Link>
                      ) : (
                        ev.title
                      )}
                    </span>
                    {ev.time && <span className="ml-2 text-xs text-[var(--color-royal-dim)]">{ev.time}</span>}
                  </div>
                  {canDelete && ev.deletable && (
                    <ConfirmForm
                      action={deleteCalendarEventAction.bind(null, year, month, day, ev.id)}
                      confirmText="Bu etkinlik silinsin mi?"
                      className="text-xs text-red-600 hover:underline"
                    >
                      Sil
                    </ConfirmForm>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
