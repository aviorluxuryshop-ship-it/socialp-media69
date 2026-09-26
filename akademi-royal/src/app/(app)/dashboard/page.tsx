import Link from 'next/link';
import { requirePermission } from '@/lib/auth';
import { getMonthCalendarItems, getMonthGridDays, isoDate } from '@/lib/calendar';
import { getMonthlySummary, getRecentStudents, getWeeklyIncomeExpense } from '@/lib/dashboard';
import { Badge, Card, PageHeader } from '@/components/ui';
import { formatCurrencyTR, formatDateTR } from '@/lib/form-utils';
import { ENROLLMENT_STATUS_LABELS } from '@/lib/labels';

const DAY_HEADERS = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];
const MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default async function DashboardPage() {
  const user = await requirePermission('dashboard.view');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const todayIso = isoDate(now);

  const gridDays = getMonthGridDays(year, month);
  const [summary, recentStudents, weekly, monthItems] = await Promise.all([
    getMonthlySummary(),
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
  const todayItems = (itemsByDay.get(todayIso) ?? []).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));

  const maxWeekly = Math.max(...weekly.map((d) => Math.max(d.income, d.expense)), 1);

  return (
    <div>
      <PageHeader title="Dashboard" description={`Hoş geldiniz, ${user.name}.`} />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Bu Ay Yeni Öğrenci" value={String(summary.newStudents)} />
        <Kpi label="Bu Ayın Cirosu" value={formatCurrencyTR(summary.revenueThisMonth)} />
        <Kpi label="Bu Ayın Masrafı" value={formatCurrencyTR(summary.expensesThisMonth)} tone="text-red-600" />
        <Kpi label="Bu Ay Tahsil Edilen" value={formatCurrencyTR(summary.collectedThisMonth)} tone="text-emerald-700" />
        <Kpi label="Bekleyen Tahsilat" value={formatCurrencyTR(summary.pendingTotal)} />
        <Kpi label="Bekleyen Görev" value={String(summary.pendingTasks)} />
      </div>

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
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[var(--color-royal-dim)]">
              {DAY_HEADERS.map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {gridDays.map((d) => {
                const iso = isoDate(d);
                const inMonth = d.getMonth() + 1 === month;
                const count = itemsByDay.get(iso)?.length ?? 0;
                return (
                  <Link
                    key={iso}
                    href={`/calendar?year=${year}&month=${month}&day=${iso}`}
                    className={`flex h-9 flex-col items-center justify-center rounded text-xs hover:bg-[var(--color-mist)] ${
                      inMonth ? '' : 'text-[var(--color-royal-dim)] opacity-40'
                    } ${iso === todayIso ? 'bg-[var(--color-royal)] text-white hover:bg-[var(--color-royal)]' : ''}`}
                  >
                    <span>{d.getDate()}</span>
                    {count > 0 && <span className={`mt-0.5 h-1 w-1 rounded-full ${iso === todayIso ? 'bg-white' : 'bg-[var(--color-royal)]'}`} />}
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Bugünün Planları</h2>
            {todayItems.length === 0 ? (
              <p className="text-sm text-[var(--color-royal-dim)]">Bugün için planlanmış bir etkinlik yok.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {todayItems.map((it) => (
                  <li key={it.id} className="flex items-center gap-2">
                    <span className="w-12 shrink-0 text-xs text-[var(--color-royal-dim)]">{it.time ?? 'Tüm gün'}</span>
                    <span>{it.title}</span>
                  </li>
                ))}
              </ul>
            )}
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

function Kpi({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Card>
      <p className="text-xs text-[var(--color-royal-dim)]">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone ?? 'text-[var(--color-royal)]'}`}>{value}</p>
    </Card>
  );
}
