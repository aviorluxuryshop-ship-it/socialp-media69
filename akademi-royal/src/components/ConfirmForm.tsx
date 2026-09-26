'use client';

import type { ReactNode } from 'react';

export function ConfirmForm({
  action,
  confirmText,
  children,
  className = '',
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirmText: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
