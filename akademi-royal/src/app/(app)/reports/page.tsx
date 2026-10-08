import { requirePermission } from '@/lib/auth';
import { Badge, Card, PageHeader, inputClass } from '@/components/ui';
import { formatCurrencyTR } from '@/lib/form-utils';
import { defaultMonthRange, getCourseReport, getExpenseReport, getIncomeReport, getStudentReport } from '@/lib/reports';

const SHOW_OPTIONS = [
  { key: 'income', label: 'Gelir' },
  { key: 'expense', label: 'Gider' },
  { key: 'courses', label: 'Toplam Kayıt / Eğitim' },
  { key: 'students', label: 'Öğrenci Sayısı' },
] as const;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; show?: string | string[] }>;
}) {
  await requirePermission('reports.view');
  const params = await searchParams;
  const defaults = defaultMonthRange();
  const from = params.from || defaults.from;
  const to = params.to || defaults.to;

  const hasShowParam = params.show !== undefined;
  const rawShow = params.show === undefined ? [] : Array.isArray(params.show) ? params.show : [params.show];
  const show = new Set(hasShowParam ? rawShow.filter((s) => s !== '_') : SHOW_OPTIONS.map((o) => o.key));

  const [income, expense, courses, students] = await Promise.all([
    getIncomeReport(from, to),
    getExpenseReport(from, to),
    getCourseReport(from, to),
    getStudentReport(from, to),
  ]);
  const net = income.total - expense.total;
  const maxBar = Math.max(income.total, expense.total, 1);
  const totalEnrollments = courses.reduce((sum, c) => sum + c.enrollmentCount, 0);

  return (
    <div>
      <PageHeader title="Raporlar" description="Gelir, gider, eğitim ve öğrenci raporları — gösterilecek detayları kendiniz seçebilirsiniz." />

      <form className="mb-6 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-[var(--color-royal-dim)]">Başlangıç</label>
            <input type="date" name="from" defaultValue={from} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-royal-dim)]">Bitiş</label>
            <input type="date" name="to" defaultValue={to} className={inputClass} />
          </div>
          <button type="submit" className="rounded-md border border-[var(--color-mist)] px-3 py-2 text-sm font-medium text-[var(--color-royal)] hover:bg-[var(--color-mist)]">
            Filtrele
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs font-medium text-[var(--color-royal-dim)]">Gösterilecek Detaylar:</span>
          <input type="hidden" name="show" value="_" />
          {SHOW_OPTIONS.map((o) => (
            <label key={o.key} className="flex items-center gap-1.5 text-sm text-[var(--color-royal)]">
              <input type="checkbox" name="show" value={o.key} defaultChecked={show.has(o.key)} className="h-4 w-4" />
              {o.label}
            </label>
          ))}
        </div>
      </form>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {show.has('income') && (
          <Card>
            <p className="text-xs text-[var(--color-royal-dim)]">Toplam Gelir</p>
            <p className="mt-1 text-xl font-semibold text-emerald-700">{formatCurrencyTR(income.total)}</p>
          </Card>
        )}
        {show.has('expense') && (
          <Card>
            <p className="text-xs text-[var(--color-royal-dim)]">Toplam Gider</p>
            <p className="mt-1 text-xl font-semibold text-red-600">{formatCurrencyTR(expense.total)}</p>
          </Card>
        )}
        {show.has('income') && show.has('expense') && (
          <Card>
            <p className="text-xs text-[var(--color-royal-dim)]">Net Fark</p>
            <p className={`mt-1 text-xl font-semibold ${net >= 0 ? 'text-[var(--color-royal)]' : 'text-red-600'}`}>{formatCurrencyTR(net)}</p>
          </Card>
        )}
        {show.has('courses') && (
          <Card>
            <p className="text-xs text-[var(--color-royal-dim)]">Toplam Kayıt</p>
            <p className="mt-1 text-xl font-semibold text-[var(--color-royal)]">{totalEnrollments}</p>
          </Card>
        )}
        {show.has('students') && (
          <Card>
            <p className="text-xs text-[var(--color-royal-dim)]">Yeni Öğrenci Sayısı</p>
            <p className="mt-1 text-xl font-semibold text-[var(--color-royal)]">{students.newStudents}</p>
          </Card>
        )}
      </div>

      {show.has('income') && show.has('expense') && (
        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Gelir – Gider Karşılaştırması</h2>
          <div className="space-y-2">
            <BarRow label="Gelir" value={income.total} max={maxBar} color="bg-emerald-500" />
            <BarRow label="Gider" value={expense.total} max={maxBar} color="bg-red-500" />
          </div>
        </Card>
      )}

      {(show.has('income') || show.has('expense')) && (
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {show.has('income') && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Gelir Raporu</h2>
              <p className="text-sm text-[var(--color-royal-dim)]">
                {income.count} tahsilat · Bekleyen tahsilat toplamı: <span className="font-medium text-[var(--color-royal)]">{formatCurrencyTR(income.totalPending)}</span>
              </p>
              <h3 className="mb-1 mt-4 text-xs font-medium text-[var(--color-royal-dim)]">Ödeme Yöntemine Göre</h3>
              <SimpleTable rows={income.byMethod} />
              <h3 className="mb-1 mt-4 text-xs font-medium text-[var(--color-royal-dim)]">Hesaba Göre</h3>
              <SimpleTable rows={income.byAccount} />
            </Card>
          )}

          {show.has('expense') && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Gider Raporu</h2>
              <p className="mb-3 text-sm text-[var(--color-royal-dim)]">{expense.count} masraf kaydı (reddedilenler hariç)</p>
              <h3 className="mb-1 text-xs font-medium text-[var(--color-royal-dim)]">Kategoriye Göre</h3>
              <SimpleTable rows={expense.byCategory} />
            </Card>
          )}
        </div>
      )}

      {show.has('students') && (
        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Öğrenci Raporu</h2>
          <p className="mb-3 text-sm text-[var(--color-royal-dim)]">Seçilen tarih aralığında {students.newStudents} yeni öğrenci kaydı yapıldı.</p>
          <h3 className="mb-1 text-xs font-medium text-[var(--color-royal-dim)]">Duruma Göre</h3>
          <SimpleTable rows={students.byStatus} isCount />
        </Card>
      )}

      {show.has('courses') && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Eğitim Raporu</h2>
          {courses.length === 0 ? (
            <p className="text-sm text-[var(--color-royal-dim)]">Seçilen tarih aralığında kayıt bulunamadı.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[var(--color-royal-dim)]">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Eğitim</th>
                    <th className="py-2 pr-4 font-medium">Satış Adedi</th>
                    <th className="py-2 pr-4 font-medium">Ciro</th>
                    <th className="py-2 pr-4 font-medium">Bekliyor</th>
                    <th className="py-2 pr-4 font-medium">Devam Ediyor</th>
                    <th className="py-2 pr-4 font-medium">Tamamlandı</th>
                    <th className="py-2 pr-4 font-medium">İptal</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id} className="border-t border-[var(--color-mist)]">
                      <td className="py-2 pr-4 font-medium text-[var(--color-royal)]">{c.name}</td>
                      <td className="py-2 pr-4">{c.enrollmentCount}</td>
                      <td className="py-2 pr-4">{formatCurrencyTR(c.revenue)}</td>
                      <td className="py-2 pr-4">{c.statusCounts.PENDING}</td>
                      <td className="py-2 pr-4">{c.statusCounts.ACTIVE}</td>
                      <td className="py-2 pr-4">{c.statusCounts.COMPLETED}</td>
                      <td className="py-2 pr-4">{c.statusCounts.CANCELLED}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(2, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-[var(--color-royal-dim)]">
        <span>{label}</span>
        <span>{formatCurrencyTR(value)}</span>
      </div>
      <div className="h-3 w-full rounded-full bg-[var(--color-mist)]">
        <div className={`h-3 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SimpleTable({ rows, isCount = false }: { rows: { label: string; amount: number }[]; isCount?: boolean }) {
  if (rows.length === 0) return <p className="text-sm text-[var(--color-royal-dim)]">Kayıt yok.</p>;
  return (
    <ul className="space-y-1 text-sm">
      {rows.map((r) => (
        <li key={r.label} className="flex justify-between">
          <span className="text-[var(--color-royal-dim)]">{r.label}</span>
          <Badge>{isCount ? r.amount : formatCurrencyTR(r.amount)}</Badge>
        </li>
      ))}
    </ul>
  );
}
