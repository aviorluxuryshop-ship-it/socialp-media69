'use client';

import type { TaskStatus } from '@prisma/client';
import { TASK_STATUS_LABELS } from '@/lib/labels';

export function TaskStatusSelect({
  action,
  defaultValue,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValue: TaskStatus;
}) {
  return (
    <form action={action}>
      <select
        name="status"
        defaultValue={defaultValue}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-[var(--color-mist)] px-2 py-1 text-xs"
      >
        {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </form>
  );
}
