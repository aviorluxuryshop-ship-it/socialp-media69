import Link from 'next/link';
import { hasPermission, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge, Button, EmptyState, PageHeader } from '@/components/ui';
import { formatCurrencyTR } from '@/lib/form-utils';

export default async function CoursesPage() {
  const user = await requirePermission('courses.view');

  const courses = await prisma.course.findMany({
    include: { _count: { select: { groups: true } } },
    orderBy: { name: 'asc' },
  });

  return (
    <div>
      <PageHeader
        title="Eğitimler"
        description="Eğitim programları, gruplar ve ders programı."
        action={hasPermission(user, 'courses.create') ? <Button href="/courses/new">+ Yeni Eğitim</Button> : undefined}
      />

      {courses.length === 0 ? (
        <EmptyState title="Kayıtlı eğitim yok" description="Yeni Eğitim butonuyla ilk programı oluşturabilirsiniz." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-mist)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-mist)]/50 text-[var(--color-royal-dim)]">
              <tr>
                <th className="px-4 py-2 font-medium">Eğitim Adı</th>
                <th className="px-4 py-2 font-medium">Kategori</th>
                <th className="px-4 py-2 font-medium">Süre</th>
                <th className="px-4 py-2 font-medium">Ücret</th>
                <th className="px-4 py-2 font-medium">Grup Sayısı</th>
                <th className="px-4 py-2 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-t border-[var(--color-mist)] hover:bg-[var(--color-mist)]/30">
                  <td className="px-4 py-2">
                    <Link href={`/courses/${c.id}`} className="font-medium text-[var(--color-royal)] hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{c.category ?? '—'}</td>
                  <td className="px-4 py-2">{c.durationHours ? `${c.durationHours} saat` : '—'}</td>
                  <td className="px-4 py-2">{formatCurrencyTR(c.defaultPrice as never)}</td>
                  <td className="px-4 py-2">{c._count.groups}</td>
                  <td className="px-4 py-2">
                    <Badge tone={c.isActive ? 'success' : 'default'}>{c.isActive ? 'Aktif' : 'Pasif'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
