import Link from 'next/link';
import { hasPermission, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge, Button, EmptyState, PageHeader, inputClass } from '@/components/ui';

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requirePermission('staff.view');
  const { q } = await searchParams;

  const staff = await prisma.staff.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { position: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    include: { trainer: true },
    orderBy: { fullName: 'asc' },
  });

  return (
    <div>
      <PageHeader
        title="Personeller"
        description="Personel ve eğitmen yönetimi."
        action={hasPermission(user, 'staff.create') ? <Button href="/staff/new">+ Yeni Personel</Button> : undefined}
      />

      <form className="mb-4">
        <input name="q" defaultValue={q ?? ''} placeholder="İsim veya pozisyona göre ara…" className={`${inputClass} max-w-sm`} />
      </form>

      {staff.length === 0 ? (
        <EmptyState title="Kayıtlı personel yok" description="Yeni Personel butonuyla ilk kaydı oluşturabilirsiniz." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-mist)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-mist)]/50 text-[var(--color-royal-dim)]">
              <tr>
                <th className="px-4 py-2 font-medium">Ad Soyad</th>
                <th className="px-4 py-2 font-medium">Pozisyon</th>
                <th className="px-4 py-2 font-medium">Telefon</th>
                <th className="px-4 py-2 font-medium">Eğitmen</th>
                <th className="px-4 py-2 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-t border-[var(--color-mist)] hover:bg-[var(--color-mist)]/30">
                  <td className="px-4 py-2">
                    <Link href={`/staff/${s.id}`} className="font-medium text-[var(--color-royal)] hover:underline">
                      {s.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{s.position}</td>
                  <td className="px-4 py-2">{s.phone ?? '—'}</td>
                  <td className="px-4 py-2">{s.trainer ? <Badge tone="success">Eğitmen</Badge> : '—'}</td>
                  <td className="px-4 py-2">
                    <Badge tone={s.isActive ? 'success' : 'default'}>{s.isActive ? 'Aktif' : 'Pasif'}</Badge>
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
