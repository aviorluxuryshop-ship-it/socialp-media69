'use client';

export function AssignSelect({
  action,
  defaultValue,
  users,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValue: string;
  users: { id: string; name: string }[];
}) {
  return (
    <form action={action}>
      <select
        name="userId"
        defaultValue={defaultValue}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-[var(--color-mist)] px-2 py-1 text-xs"
      >
        <option value="">Havuzda (atanmamış)</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </form>
  );
}
