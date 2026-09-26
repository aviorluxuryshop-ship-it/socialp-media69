'use client';

import type { EnrollmentStatus } from '@prisma/client';
import { ENROLLMENT_STATUS_LABELS } from '@/lib/labels';

export function EnrollmentStatusSelect({
  action,
  defaultValue,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValue: EnrollmentStatus;
}) {
  return (
    <form action={action}>
      <select
        name="status"
        defaultValue={defaultValue}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-[var(--color-mist)] px-2 py-1 text-xs"
      >
        {Object.entries(ENROLLMENT_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </form>
  );
}
