import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, PageHeader } from '@/components/ui';
import { TaskForm } from '../TaskForm';

export default async function NewTaskPage() {
  await requirePermission('tasks.create');
  const users = await prisma.user.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true }, orderBy: { name: 'asc' } });

  return (
    <div>
      <PageHeader title="Yeni Görev" description="Görev bilgilerini girin, isterseniz doğrudan bir personele atayın." />
      <Card className="max-w-2xl">
        <TaskForm users={users} />
      </Card>
    </div>
  );
}
