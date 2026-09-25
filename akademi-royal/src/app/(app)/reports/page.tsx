import { requirePermission } from '@/lib/auth';
import { EmptyState, PageHeader } from '@/components/ui';

export default async function ReportsPage() {
  await requirePermission('reports.view');

  return (
    <div>
      <PageHeader title="Raporlar" description="Eğitim, gelir ve gider raporları." />
      <EmptyState title="Bu modül Faz 8'de geliştirilecek" description="Detaylı raporlar yakında burada." />
    </div>
  );
}
