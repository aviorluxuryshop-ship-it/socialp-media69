import { requirePermission } from '@/lib/auth';
import { EmptyState, PageHeader } from '@/components/ui';

export default async function TasksPage() {
  await requirePermission('tasks.view');

  return (
    <div>
      <PageHeader title="Görevler" description="Görev havuzu ve atamalar." />
      <EmptyState title="Bu modül Faz 7'de geliştirilecek" description="Görev oluşturma, atama ve üstlenme yakında burada." />
    </div>
  );
}
