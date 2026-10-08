import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { MebForm } from '../MebForm';

export default async function NewMebProcessPage() {
  await requirePermission('meb.create');

  const enrollments = await prisma.groupEnrollment.findMany({
    where: { mebProcess: null, status: { not: 'CANCELLED' } },
    include: {
      student: { select: { fullName: true } },
      courseGroup: { include: { course: { select: { name: true } } } },
    },
    orderBy: { enrolledAt: 'desc' },
  });

  const options = enrollments.map((e) => ({
    id: e.id,
    label: `${e.student.fullName} — ${e.courseGroup.course.name} (${e.courseGroup.code})`,
  }));

  return (
    <div>
      <PageHeader title="Yeni MEB Süreci" description="Bir öğrencinin eğitim kaydına MEB sınav süreci bilgisi ekleyin." />
      <Card className="max-w-2xl">
        {options.length === 0 ? (
          <EmptyState
            title="Uygun eğitim kaydı yok"
            description="Tüm eğitim kayıtlarının MEB süreci zaten var ya da henüz hiç kayıt yok."
          />
        ) : (
          <MebForm enrollments={options} returnTo="/meb" />
        )}
      </Card>
    </div>
  );
}
