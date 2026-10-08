'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconCalendar,
  IconCourse,
  IconDashboard,
  IconExam,
  IconExpense,
  IconMoney,
  IconReport,
  IconSettings,
  IconStaff,
  IconStudent,
  IconTask,
} from '@/components/icons';

const NAV_ICONS: Record<string, (props: { className?: string }) => React.ReactElement> = {
  dashboard: IconDashboard,
  students: IconStudent,
  courses: IconCourse,
  meb: IconExam,
  calendar: IconCalendar,
  staff: IconStaff,
  payments: IconMoney,
  expenses: IconExpense,
  tasks: IconTask,
  reports: IconReport,
  settings: IconSettings,
};

export function AppSidebar({ items }: { items: { key: string; label: string; href: string }[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = NAV_ICONS[item.key];
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition ${
              active
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-royal)] hover:bg-[var(--color-mist)]'
            }`}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
