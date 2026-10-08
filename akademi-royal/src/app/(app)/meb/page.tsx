import Link from 'next/link';
import { hasPermission, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge, Button, EmptyState, PageHeader } from '@/components/ui';
import { ConfirmForm } from '@/components/ConfirmForm';
import { formatDateTR } from '@/lib/form-utils';
import { deleteMebProcessAction } from './actions';

export default async function MebPage() {
  const user = await requirePermission('meb.view');

  const processes = await prisma.mebProcess.findMany({
    include: {
      enrollment: {
        include: {
          student: { select: { id: true, fullName: true } },
          courseGroup: { include: { course: { select: { name: true } } } },
        },
      },
    },
    orderBy: { expiresAt: 'asc' },
  });

  const canCreate = hasPermission(user, 'meb.create');
  const canEdit = hasPermission(user, 'meb.edit');
  const canDelete = hasPermission(user, 'meb.delete');
  const today = new Date();

  return (
    <div>
      <PageHeader
        title="MEB Sınav Süreçleri"
        description="Öğrencilerin Milli Eğitim Bakanlığı sınav süreç bilgileri."
        action={canCreate ? <Button href="/meb/new">+ Yeni MEB Süreci</Button> : undefined}
      />

      {processes.length === 0 ? (
        <EmptyState title="Kayıtlı MEB süreci yok" description="Yeni MEB Süreci butonuyla ilk kaydı oluşturabilirsiniz." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-mist)] bg-[var(--color-surface)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-mist)]/50 text-[var(--color-royal-dim)]">
              <tr>
                <th className="px-4 py-2 font-medium">Öğrenci</th>
                <th className="px-4 py-2 font-medium">Eğitim</th>
                <th className="px-4 py-2 font-medium">Sınav Grup No</th>
                <th className="px-4 py-2 font-medium">Süreç Dolma Tarihi</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {processes.map((p) => {
                const overdue = p.expiresAt < today;
                return (
                  <tr key={p.id} className="border-t border-[var(--color-mist)] hover:bg-[var(--color-mist)]/30">
                    <td className="px-4 py-2">
                      <Link href={`/students/${p.enrollment.student.id}`} className="font-medium text-[var(--color-royal)] hover:underline">
                        {p.enrollment.student.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{p.enrollment.courseGroup.course.name}</td>
                    <td className="px-4 py-2">{p.groupNumber ?? '—'}</td>
                    <td className="px-4 py-2">
                      {formatDateTR(p.expiresAt)} {overdue && <Badge tone="danger">Süresi Doldu</Badge>}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <Link href={`/meb/${p.id}/edit`} className="text-xs text-[var(--color-royal)] hover:underline">
                            Düzenle
                          </Link>
                        )}
                        {canDelete && (
                          <ConfirmForm
                            action={deleteMebProcessAction.bind(null, '/meb', p.id)}
                            confirmText="Bu MEB süreci silinsin mi?"
                            className="text-xs text-red-600 hover:underline"
                          >
                            Sil
                          </ConfirmForm>
                        )}
                      </div>
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
