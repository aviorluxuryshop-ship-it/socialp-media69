'use client';

export function AssignSelect({
  action,
  defaultValue,
  staff,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValue: string;
  staff: { id: string; name: string }[];
}) {
  return (
    <form action={action}>
      <select
        name="staffId"
        defaultValue={defaultValue}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-[var(--color-mist)] px-2 py-1 text-xs"
      >
        <option value="">Havuzda (atanmamış)</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </form>
  );
}
