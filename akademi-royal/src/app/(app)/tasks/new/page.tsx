import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, PageHeader } from '@/components/ui';
import { TaskForm } from '../TaskForm';

export default async function NewTaskPage() {
  await requirePermission('tasks.create');
  const staffRows = await prisma.staff.findMany({ where: { isActive: true }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
  const staff = staffRows.map((s) => ({ id: s.id, name: s.fullName }));

  return (
    <div>
      <PageHeader title="Yeni Görev" description="Görev bilgilerini girin, isterseniz doğrudan bir personele atayın." />
      <Card className="max-w-2xl">
        <TaskForm staff={staff} />
      </Card>
    </div>
  );
}
