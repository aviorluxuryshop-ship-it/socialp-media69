import { requirePermission } from '@/lib/auth';
import { EmptyState, PageHeader } from '@/components/ui';

export default async function StaffPage() {
  await requirePermission('staff.view');

  return (
    <div>
      <PageHeader title="Personeller" description="Personel ve eğitmen yönetimi." />
      <EmptyState title="Bu modül Faz 1'de geliştirilecek" description="Personel listesi ve eğitmen ataması yakında burada." />
    </div>
  );
}
