import { requirePermission } from '@/lib/auth';
import { EmptyState, PageHeader } from '@/components/ui';

export default async function ExpensesPage() {
  await requirePermission('expenses.view');

  return (
    <div>
      <PageHeader title="Masraflar" description="Gider kayıtları ve kategorileri." />
      <EmptyState title="Bu modül Faz 6'da geliştirilecek" description="Masraf ekleme ve onay akışı yakında burada." />
    </div>
  );
}
