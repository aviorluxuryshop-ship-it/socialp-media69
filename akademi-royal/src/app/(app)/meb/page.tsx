import Link from 'next/link';
import { hasPermission, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge, Button, EmptyState, PageHeader } from '@/components/ui';
import { formatDateTR } from '@/lib/form-utils';

export default async function MebPage() {
  const user = await requirePermission('meb.view');

  const processes = await prisma.mebProcess.findMany({
    include: { course: { select: { id: true, name: true } }, _count: { select: { enrollments: true } } },
    orderBy: { completionDate: 'asc' },
  });

  const canCreate = hasPermission(user, 'meb.create');
  const today = new Date();

  return (
    <div>
      <PageHeader
        title="MEB Sınav Süreçleri"
        description="Milli Eğitim Bakanlığı sınav grupları — her grup bir eğitime bağlıdır."
        action={canCreate ? <Button href="/meb/new">+ Yeni MEB Süreci</Button> : undefined}
      />

      {processes.length === 0 ? (
        <EmptyState title="Kayıtlı MEB süreci yok" description="Yeni MEB Süreci butonuyla ilk grubu oluşturabilirsiniz." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-mist)] bg-[var(--color-surface)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-mist)]/50 text-[var(--color-royal-dim)]">
              <tr>
                <th className="px-4 py-2 font-medium">Eğitim</th>
                <th className="px-4 py-2 font-medium">Sınav Grup No</th>
                <th className="px-4 py-2 font-medium">Öğrenci</th>
                <th className="px-4 py-2 font-medium">Tamamlanma Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p) => {
                const overdue = p.completionDate < today;
                return (
                  <tr key={p.id} className="border-t border-[var(--color-mist)] hover:bg-[var(--color-mist)]/30">
                    <td className="px-4 py-2">
                      <Link href={`/meb/${p.id}`} className="font-medium text-[var(--color-royal)] hover:underline">
                        {p.course.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{p.groupNumber ?? '—'}</td>
                    <td className="px-4 py-2">
                      {p._count.enrollments}
                      {p.capacity ? ` / ${p.capacity}` : ''}
                    </td>
                    <td className="px-4 py-2">
                      {formatDateTR(p.completionDate)} {overdue && <Badge tone="danger">Süresi Doldu</Badge>}
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
