import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { MebForm } from '../MebForm';

export default async function NewMebProcessPage() {
  await requirePermission('meb.create');

  const courses = await prisma.course.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });

  return (
    <div>
      <PageHeader title="Yeni MEB Süreci" description="Bir eğitim için MEB sınav sürecini (grubunu) başlatın; ardından öğrenci ekleyebilirsiniz." />
      <Card className="max-w-2xl">
        {courses.length === 0 ? (
          <EmptyState title="Aktif eğitim yok" description="Önce Eğitimler modülünden bir eğitim oluşturun." />
        ) : (
          <MebForm courses={courses.map((c) => ({ id: c.id, name: c.name }))} />
        )}
      </Card>
    </div>
  );
}
