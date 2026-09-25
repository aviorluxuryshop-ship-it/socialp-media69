import { requirePermission } from '@/lib/auth';
import { Card, PageHeader } from '@/components/ui';

export default async function DashboardPage() {
  const user = await requirePermission('dashboard.view');

  return (
    <div>
      <PageHeader title="Dashboard" description={`Hoş geldiniz, ${user.name}.`} />
      <Card>
        <p className="text-sm text-[var(--color-royal-dim)]">
          Rolünüz: <span className="font-medium text-[var(--color-royal)]">{user.roleName}</span>
        </p>
        <p className="mt-2 text-sm text-[var(--color-royal-dim)]">
          Aylık özet, bugünün planı ve gelir-gider grafiği Faz 9'da bu sayfaya eklenecek. Diğer modüller
          geliştirildikçe verileriniz burada özetlenecek.
        </p>
      </Card>
    </div>
  );
}
