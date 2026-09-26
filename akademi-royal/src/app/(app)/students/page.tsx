import Link from 'next/link';
import { hasPermission, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge, Button, EmptyState, PageHeader, inputClass } from '@/components/ui';
import { formatCurrencyTR } from '@/lib/form-utils';
import { STUDENT_STATUS_LABELS } from '@/lib/labels';

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const user = await requirePermission('students.view');
  const { q, status } = await searchParams;

  const students = await prisma.student.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { fullName: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
                { nationalId: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {},
        status ? { status: status as never } : {},
      ],
    },
    include: {
      enrollments: {
        include: { courseGroup: { include: { course: true } }, pricing: { include: { installments: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <PageHeader
        title="Öğrenciler"
        description="Öğrenci kayıtları, eğitim ve ödeme durumları."
        action={hasPermission(user, 'students.create') ? <Button href="/students/new">+ Yeni Öğrenci</Button> : undefined}
      />

      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q ?? ''} placeholder="İsim, telefon veya TC ile ara…" className={`${inputClass} max-w-sm`} />
        <select name="status" defaultValue={status ?? ''} className={inputClass}>
          <option value="">Tüm Durumlar</option>
          {Object.entries(STUDENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border border-[var(--color-mist)] px-3 py-2 text-sm font-medium text-[var(--color-royal)] hover:bg-[var(--color-mist)]">
          Filtrele
        </button>
      </form>

      {students.length === 0 ? (
        <EmptyState title="Kayıtlı öğrenci yok" description="Yeni Öğrenci butonuyla ilk kaydı oluşturabilirsiniz." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-mist)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-mist)]/50 text-[var(--color-royal-dim)]">
              <tr>
                <th className="px-4 py-2 font-medium">Ad Soyad</th>
                <th className="px-4 py-2 font-medium">Telefon</th>
                <th className="px-4 py-2 font-medium">Aldığı Eğitim(ler)</th>
                <th className="px-4 py-2 font-medium">Toplam Ücret</th>
                <th className="px-4 py-2 font-medium">Ödenen</th>
                <th className="px-4 py-2 font-medium">Kalan</th>
                <th className="px-4 py-2 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const totals = s.enrollments.reduce(
                  (acc, e) => {
                    if (!e.pricing) return acc;
                    const paid = e.pricing.installments.reduce((sum, i) => sum + Number(i.paidAmount), 0);
                    acc.total += Number(e.pricing.finalAmount);
                    acc.paid += paid;
                    return acc;
                  },
                  { total: 0, paid: 0 },
                );
                const remaining = totals.total - totals.paid;

                return (
                  <tr key={s.id} className="border-t border-[var(--color-mist)] hover:bg-[var(--color-mist)]/30">
                    <td className="px-4 py-2">
                      <Link href={`/students/${s.id}`} className="font-medium text-[var(--color-royal)] hover:underline">
                        {s.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{s.phone}</td>
                    <td className="px-4 py-2">{s.enrollments.map((e) => e.courseGroup.course.name).join(', ') || '—'}</td>
                    <td className="px-4 py-2">{totals.total ? formatCurrencyTR(totals.total) : '—'}</td>
                    <td className="px-4 py-2">{totals.total ? formatCurrencyTR(totals.paid) : '—'}</td>
                    <td className="px-4 py-2">{totals.total ? formatCurrencyTR(remaining) : '—'}</td>
                    <td className="px-4 py-2">
                      <Badge>{STUDENT_STATUS_LABELS[s.status]}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
