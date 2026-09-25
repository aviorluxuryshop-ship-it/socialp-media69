'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppSidebar({ items }: { items: { key: string; label: string; href: string }[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              active
                ? 'bg-[var(--color-royal)] text-white'
                : 'text-[var(--color-royal)] hover:bg-[var(--color-mist)]'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
