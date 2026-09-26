import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { ExpenseForm } from '../ExpenseForm';

export default async function NewExpensePage() {
  await requirePermission('expenses.create');
  const categories = await prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } });

  return (
    <div>
      <PageHeader title="Yeni Masraf" description="Gider bilgilerini girin." />
      <Card className="max-w-lg">
        {categories.length === 0 ? (
          <EmptyState title="Önce bir masraf kategorisi oluşturun" description="Kategoriler sayfasından ekleyebilirsiniz." />
        ) : (
          <ExpenseForm categories={categories} />
        )}
      </Card>
    </div>
  );
}
