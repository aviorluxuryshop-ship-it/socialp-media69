import { requirePermission } from '@/lib/auth';
import { Badge, Card, PageHeader, inputClass } from '@/components/ui';
import { formatCurrencyTR } from '@/lib/form-utils';
import { defaultMonthRange, getCourseReport, getExpenseReport, getIncomeReport } from '@/lib/reports';

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await requirePermission('reports.view');
  const params = await searchParams;
  const defaults = defaultMonthRange();
  const from = params.from || defaults.from;
  const to = params.to || defaults.to;

  const [income, expense, courses] = await Promise.all([getIncomeReport(from, to), getExpenseReport(from, to), getCourseReport(from, to)]);
  const net = income.total - expense.total;
  const maxBar = Math.max(income.total, expense.total, 1);

  return (
    <div>
      <PageHeader title="Raporlar" description="Eğitim, gelir ve gider raporları." />

      <form className="mb-6 flex flex-wrap items-end gap-3">
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
      </form>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-[var(--color-royal-dim)]">Toplam Gelir</p>
          <p className="mt-1 text-xl font-semibold text-emerald-700">{formatCurrencyTR(income.total)}</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-royal-dim)]">Toplam Gider</p>
          <p className="mt-1 text-xl font-semibold text-red-600">{formatCurrencyTR(expense.total)}</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-royal-dim)]">Net Fark</p>
          <p className={`mt-1 text-xl font-semibold ${net >= 0 ? 'text-[var(--color-royal)]' : 'text-red-600'}`}>{formatCurrencyTR(net)}</p>
        </Card>
      </div>

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Gelir – Gider Karşılaştırması</h2>
        <div className="space-y-2">
          <BarRow label="Gelir" value={income.total} max={maxBar} color="bg-emerald-500" />
          <BarRow label="Gider" value={expense.total} max={maxBar} color="bg-red-500" />
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
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

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Gider Raporu</h2>
          <p className="mb-3 text-sm text-[var(--color-royal-dim)]">{expense.count} masraf kaydı (reddedilenler hariç)</p>
          <h3 className="mb-1 text-xs font-medium text-[var(--color-royal-dim)]">Kategoriye Göre</h3>
          <SimpleTable rows={expense.byCategory} />
        </Card>
      </div>

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
                  <th className="py-2 pr-4 font-medium">Kayıt</th>
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

function SimpleTable({ rows }: { rows: { label: string; amount: number }[] }) {
  if (rows.length === 0) return <p className="text-sm text-[var(--color-royal-dim)]">Kayıt yok.</p>;
  return (
    <ul className="space-y-1 text-sm">
      {rows.map((r) => (
        <li key={r.label} className="flex justify-between">
          <span className="text-[var(--color-royal-dim)]">{r.label}</span>
          <Badge>{formatCurrencyTR(r.amount)}</Badge>
        </li>
      ))}
    </ul>
  );
}
