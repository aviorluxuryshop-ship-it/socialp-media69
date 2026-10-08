import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { ExpenseForm } from '../ExpenseForm';

export default async function NewExpensePage() {
  await requirePermission('expenses.create');
  const [categories, accountRows] = await Promise.all([
    prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } }),
    prisma.financialAccount.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ]);
  const accounts = accountRows.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div>
      <PageHeader title="Yeni Masraf" description="Gider bilgilerini girin; ödeme doğrudan kaydedilir." />
      <Card className="max-w-lg">
        {categories.length === 0 ? (
          <EmptyState title="Önce bir masraf kategorisi oluşturun" description="Kategoriler sayfasından ekleyebilirsiniz." />
        ) : accounts.length === 0 ? (
          <EmptyState title="Önce bir hesap oluşturun" description="Hesaplarım sayfasından bir kasa/banka hesabı ekleyin." />
        ) : (
          <ExpenseForm categories={categories} accounts={accounts} />
        )}
      </Card>
    </div>
  );
}
