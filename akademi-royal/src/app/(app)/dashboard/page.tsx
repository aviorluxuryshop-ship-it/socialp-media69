import Link from 'next/link';
import { requirePermission } from '@/lib/auth';
import { getMonthCalendarItems, getMonthGridDays, isoDate } from '@/lib/calendar';
import { getDashboardDrilldowns, getMonthlySummary, getRecentStudents, getWeeklyIncomeExpense } from '@/lib/dashboard';
import { Badge, Card, PageHeader } from '@/components/ui';
import { KpiBoard, type Kpi } from '@/components/KpiBoard';
import { MiniCalendarBoard } from '@/components/MiniCalendarBoard';
import { formatCurrencyTR, formatDateTR } from '@/lib/form-utils';
import { ENROLLMENT_STATUS_LABELS } from '@/lib/labels';

const MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default async function DashboardPage() {
  const user = await requirePermission('dashboard.view');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const todayIso = isoDate(now);

  const gridDays = getMonthGridDays(year, month);
  const [summary, drilldowns, recentStudents, weekly, monthItems] = await Promise.all([
    getMonthlySummary(),
    getDashboardDrilldowns(),
    getRecentStudents(5),
    getWeeklyIncomeExpense(),
    getMonthCalendarItems(year, month),
  ]);

  const itemsByDay = new Map<string, typeof monthItems>();
  for (const item of monthItems) {
    const list = itemsByDay.get(item.date) ?? [];
    list.push(item);
    itemsByDay.set(item.date, list);
  }

  const calendarDays = gridDays.map((d) => {
    const iso = isoDate(d);
    return {
      iso,
      day: d.getDate(),
      inMonth: d.getMonth() + 1 === month,
      items: (itemsByDay.get(iso) ?? []).map((it) => ({ id: it.id, title: it.title, time: it.time, href: it.href })),
    };
  });

  const maxWeekly = Math.max(...weekly.map((d) => Math.max(d.income, d.expense)), 1);

  const kpis: Kpi[] = [
    {
      key: 'newStudents',
      label: 'Bu Ay Yeni Öğrenci',
      value: String(summary.newStudents),
      rows: drilldowns.newStudents,
      emptyText: 'Bu ay henüz yeni öğrenci kaydı yok.',
    },
    {
      key: 'revenue',
      label: 'Bu Ayın Cirosu',
      value: formatCurrencyTR(summary.revenueThisMonth),
      rows: drilldowns.revenue,
      emptyText: 'Bu ay henüz kayıt/ciro yok.',
    },
    {
      key: 'expenses',
      label: 'Bu Ayın Masrafı',
      value: formatCurrencyTR(summary.expensesThisMonth),
      tone: 'text-red-600',
      rows: drilldowns.expenses,
      emptyText: 'Bu ay henüz masraf kaydı yok.',
    },
    {
      key: 'payments',
      label: 'Bu Ay Tahsil Edilen',
      value: formatCurrencyTR(summary.collectedThisMonth),
      tone: 'text-emerald-700',
      rows: drilldowns.payments,
      emptyText: 'Bu ay henüz tahsilat yok.',
    },
    {
      key: 'pendingInstallments',
      label: 'Bekleyen Tahsilat',
      value: formatCurrencyTR(summary.pendingTotal),
      rows: drilldowns.pendingInstallments,
      emptyText: 'Bekleyen tahsilat yok.',
    },
    {
      key: 'pendingTasks',
      label: 'Bekleyen Görev',
      value: String(summary.pendingTasks),
      rows: drilldowns.pendingTasks,
      emptyText: 'Bekleyen görev yok.',
    },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description={`Hoş geldiniz, ${user.name}.`} showBack={false} />

      <KpiBoard kpis={kpis} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-royal)]">
                Aylık Takvim Planı — {MONTH_NAMES[month - 1]} {year}
              </h2>
              <Link href="/calendar" className="text-xs text-[var(--color-royal)] hover:underline">
                Tümünü Gör →
              </Link>
            </div>
            <MiniCalendarBoard todayIso={todayIso} days={calendarDays} />
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Haftalık Gelir – Gider</h2>
            <div className="flex items-end gap-3" style={{ height: 140 }}>
              {weekly.map((d) => (
                <div key={d.iso} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-full items-end gap-0.5">
                    <div
                      className="w-3 rounded-t bg-emerald-500"
                      style={{ height: `${Math.max(2, (d.income / maxWeekly) * 100)}%` }}
                      title={`Gelir: ${formatCurrencyTR(d.income)}`}
                    />
                    <div
                      className="w-3 rounded-t bg-red-500"
                      style={{ height: `${Math.max(2, (d.expense / maxWeekly) * 100)}%` }}
                      title={`Gider: ${formatCurrencyTR(d.expense)}`}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--color-royal-dim)]">{d.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-[var(--color-royal-dim)]">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Gelir
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500" /> Gider
              </span>
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Son Kayıt Olan Öğrenciler</h2>
          {recentStudents.length === 0 ? (
            <p className="text-sm text-[var(--color-royal-dim)]">Henüz öğrenci kaydı yok.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {recentStudents.map((s) => (
                <li key={s.id} className="border-b border-[var(--color-mist)] pb-3 last:border-0 last:pb-0">
                  <Link href={`/students/${s.id}`} className="font-medium text-[var(--color-royal)] hover:underline">
                    {s.fullName}
                  </Link>
                  <p className="text-xs text-[var(--color-royal-dim)]">{formatDateTR(s.createdAt)}</p>
                  {s.courseName && (
                    <p className="mt-1 text-xs text-[var(--color-royal-dim)]">
                      {s.courseName}
                      {s.enrollmentStatus && (
                        <>
                          {' '}
                          · <Badge>{ENROLLMENT_STATUS_LABELS[s.enrollmentStatus]}</Badge>
                        </>
                      )}
                    </p>
                  )}
                  {s.hasPricing && (
                    <p className="mt-1 text-xs text-[var(--color-royal-dim)]">
                      Ödenen: {formatCurrencyTR(s.paid)} · Kalan: {formatCurrencyTR(s.remaining)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
