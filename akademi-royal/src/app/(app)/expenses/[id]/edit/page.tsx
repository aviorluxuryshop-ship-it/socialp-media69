import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, PageHeader } from '@/components/ui';
import { ExpenseForm } from '../../ExpenseForm';

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('expenses.edit');
  const { id } = await params;

  const [expense, categories] = await Promise.all([
    prisma.expense.findUnique({ where: { id } }),
    prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } }),
  ]);
  if (!expense) notFound();

  const formValue = { ...expense, amount: expense.amount.toString() };

  return (
    <div>
      <PageHeader title="Masrafı Düzenle" description="Gider bilgilerini güncelleyin." />
      <Card className="max-w-lg">
        <ExpenseForm categories={categories} expense={formValue} />
      </Card>
    </div>
  );
}
