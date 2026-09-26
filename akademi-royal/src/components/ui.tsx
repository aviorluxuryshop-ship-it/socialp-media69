import type { ReactNode } from 'react';
import Link from 'next/link';

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-royal)]">{title}</h1>
        {description && <p className="mt-1 text-sm text-[var(--color-royal-dim)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-[var(--color-mist)] bg-white p-5 ${className}`}>{children}</div>;
}

export function Button({
  children,
  href,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
  onClick,
}: {
  children: ReactNode;
  href?: string;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const base = 'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition disabled:opacity-60';
  const styles = {
    primary: 'bg-[var(--color-royal)] text-white hover:opacity-90',
    secondary: 'border border-[var(--color-mist)] text-[var(--color-royal)] hover:bg-[var(--color-mist)]',
    danger: 'bg-red-600 text-white hover:opacity-90',
  }[variant];

  if (href) {
    return (
      <Link href={href} className={`${base} ${styles} ${className}`}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--color-mist)] p-10 text-center">
      <p className="font-medium text-[var(--color-royal)]">{title}</p>
      {description && <p className="mt-1 text-sm text-[var(--color-royal-dim)]">{description}</p>}
    </div>
  );
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const styles = {
    default: 'bg-[var(--color-mist)] text-[var(--color-royal)]',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
  }[tone];
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>{children}</span>;
}

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--color-royal)]">
      {children}
    </label>
  );
}

export const inputClass =
  'mt-1 w-full rounded-md border border-[var(--color-mist)] px-3 py-2 text-sm outline-none focus:border-[var(--color-royal)]';
