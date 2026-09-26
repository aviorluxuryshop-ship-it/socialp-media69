export function emptyToNull(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? '').trim();
  return s === '' ? null : s;
}

export function parseDate(value: FormDataEntryValue | null): Date | null {
  const s = emptyToNull(value);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseDecimal(value: FormDataEntryValue | null): number | null {
  const s = emptyToNull(value);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function formatDateInput(value: Date | null | undefined): string {
  if (!value) return '';
  return value.toISOString().slice(0, 10);
}

export function formatDateTR(value: Date | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('tr-TR').format(value);
}

export function formatCurrencyTR(value: number | { toString(): string } | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'number' ? value : Number(value.toString());
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
}
