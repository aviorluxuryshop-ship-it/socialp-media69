import { hasPermission, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { ConfirmForm } from '@/components/ConfirmForm';
import { CategoryForm } from './CategoryForm';
import { deleteExpenseCategoryAction } from '../actions';

export default async function ExpenseCategoriesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requirePermission('expenses.view');
  const { error } = await searchParams;

  const categories = await prisma.expenseCategory.findMany({
    include: { _count: { select: { expenses: true } } },
    orderBy: { name: 'asc' },
  });

  const canManage = hasPermission(user, 'expenses.create');
  const canDelete = hasPermission(user, 'expenses.delete');

  return (
    <div>
      <PageHeader title="Masraf Kategorileri" description="Gider kategorilerini yönetin." />

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {canManage && (
        <Card className="mb-6 max-w-lg">
          <CategoryForm />
        </Card>
      )}

      {categories.length === 0 ? (
        <EmptyState title="Kategori yok" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-mist)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-mist)]/50 text-[var(--color-royal-dim)]">
              <tr>
                <th className="px-4 py-2 font-medium">Ad</th>
                <th className="px-4 py-2 font-medium">Masraf Sayısı</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t border-[var(--color-mist)]">
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2">{c._count.expenses}</td>
                  <td className="px-4 py-2 text-right">
                    {canDelete && c._count.expenses === 0 && (
                      <ConfirmForm
                        action={deleteExpenseCategoryAction.bind(null, c.id)}
                        confirmText="Bu kategori silinsin mi?"
                        className="text-xs text-red-600 hover:underline"
                      >
                        Sil
                      </ConfirmForm>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
