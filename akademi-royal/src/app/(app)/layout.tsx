import type { ReactNode } from 'react';
import Image from 'next/image';
import { requireUser, hasPermission } from '@/lib/auth';
import { NAV_ITEMS } from '@/lib/nav';
import { AppSidebar } from '@/components/AppSidebar';
import { AppShell } from '@/components/AppShell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { logoutAction } from './logout-action';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const items = NAV_ITEMS.filter((item) => hasPermission(user, `${item.key}.view`));

  const sidebar = (
    <>
      <div className="border-b border-[var(--color-mist)] px-4 py-4">
        <div className="rounded-md bg-white p-2">
          <Image src="/logo.png" alt="Akademi Royal" width={1372} height={458} className="h-auto w-full" priority />
        </div>
        <p className="mt-2 text-xs text-[var(--color-royal-dim)]">Yönetim Paneli</p>
      </div>
      <AppSidebar items={items} />
    </>
  );

  return (
    <AppShell sidebar={sidebar}>
      <header className="flex items-center justify-between border-b border-[var(--color-mist)] bg-[var(--color-surface)] px-6 py-3">
        <div className="text-sm text-[var(--color-royal-dim)]">
          <span className="font-medium text-[var(--color-royal)]">{user.name}</span> · {user.roleName}
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-[var(--color-royal-dim)] hover:text-[var(--color-royal)]">
              Çıkış Yap
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 bg-[var(--color-mist)]/40 p-6">{children}</main>
    </AppShell>
  );
}
