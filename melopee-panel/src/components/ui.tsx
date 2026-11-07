"use client";

import clsx from "clsx";
import { AlertTriangle, Check, CheckCheck, Clock, UserX, X, XCircle } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { STATUS_LABEL } from "@/lib/constants";
import { initials } from "@/lib/format";
import type { AppointmentStatus } from "@/lib/types";

/* ───────── Yerleşim ───────── */

export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="display text-[34px] text-ink sm:text-[38px]">{title}</h1>
        {sub && <div className="mt-1 text-[14px] text-ink-2">{sub}</div>}
      </div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, sub, action, children, className, pad = true }: { title?: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={clsx("card", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pb-1 pt-4">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-bold text-ink">{title}</h2>}
            {sub && <p className="mt-0.5 text-[13px] text-ink-3">{sub}</p>}
          </div>
          {action && <div className="no-print shrink-0">{action}</div>}
        </header>
      )}
      <div className={clsx(pad && "px-5 pb-5 pt-3")}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, delta, icon, invert }: { label: string; value: ReactNode; hint?: ReactNode; delta?: number | null; icon?: ReactNode; invert?: boolean }) {
  return (
    <div className="card flex min-w-0 flex-col gap-2 px-4 py-4 sm:px-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-ink-2">{label}</span>
        {icon && <span className="text-ink-3" aria-hidden>{icon}</span>}
      </div>
      <div className="num text-[21px] font-bold tracking-tight text-ink sm:text-[26px]">{value}</div>
      {(hint || delta !== undefined) && (
        <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink-3">
          {delta !== undefined && <Delta value={delta} invert={invert} />}
          {hint}
        </div>
      )}
    </div>
  );
}

/** Önceki döneme göre değişim: yön oku + yüzde + metin, renk tek başına anlam taşımaz. */
export function Delta({ value, invert = false }: { value: number | null; invert?: boolean }) {
  if (value === null || !Number.isFinite(value)) return <span className="text-ink-3">— karşılaştırma yok</span>;
  if (Math.round(Math.abs(value) * 100) === 0)
    return <span className="num inline-flex items-center rounded-md bg-sunk px-1.5 py-0.5 font-semibold text-ink-2">±0%</span>;
  const up = value >= 0;
  const good = invert ? !up : up;
  return (
    <span className={clsx("num inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold", good ? "bg-ok-50 text-ok" : "bg-bad-50 text-bad")}>
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {up ? "+" : "−"}
      {Math.abs(Math.round(value * 100))}%
    </span>
  );
}

export function Empty({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      {icon && <div className="mb-1 grid size-11 place-items-center rounded-full bg-rose-50 text-rose">{icon}</div>}
      <p className="font-semibold text-ink">{title}</p>
      {children && <p className="max-w-sm text-[13.5px] text-ink-3">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ───────── Kimlik ───────── */

export function Avatar({ name, color, size = 32 }: { name: string; color?: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: color ?? "#756870" }}
    >
      {initials(name)}
    </span>
  );
}

export function Dot({ color, className }: { color: string; className?: string }) {
  return <span aria-hidden className={clsx("inline-block size-2.5 shrink-0 rounded-full", className)} style={{ background: color }} />;
}

const STATUS_STYLE: Record<AppointmentStatus, { cls: string; Icon: typeof Check }> = {
  planned: { cls: "bg-sunk text-ink-2 border-line-2", Icon: Clock },
  confirmed: { cls: "bg-info-50 text-info border-[#cfdcf0]", Icon: Check },
  completed: { cls: "bg-ok-50 text-ok border-[#cde5d6]", Icon: CheckCheck },
  cancelled: { cls: "bg-bad-50 text-bad border-[#efd0d0]", Icon: XCircle },
  noshow: { cls: "bg-warn-50 text-warn border-[#efdcb9]", Icon: UserX },
};

export function StatusBadge({ status, size = "md" }: { status: AppointmentStatus; size?: "sm" | "md" }) {
  const { cls, Icon } = STATUS_STYLE[status];
  return (
    <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-full border font-semibold", cls, size === "sm" ? "px-1.5 py-px text-[11px]" : "px-2 py-0.5 text-[12px]")}>
      <Icon size={size === "sm" ? 11 : 13} aria-hidden strokeWidth={2.4} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "rose" | "gold" | "warn" | "info" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-semibold",
        tone === "neutral" && "bg-sunk text-ink-2",
        tone === "rose" && "bg-rose-50 text-rose-700",
        tone === "gold" && "bg-[#f6efe2] text-[#7d5f2e]",
        tone === "warn" && "bg-warn-50 text-warn",
        tone === "info" && "bg-info-50 text-info",
      )}
    >
      {children}
    </span>
  );
}

/* ───────── Form ───────── */

export function Field({ label, hint, error, children, className, required }: { label: string; hint?: string; error?: string | null; children: (id: string, describedBy?: string) => ReactNode; className?: string; required?: boolean }) {
  const id = useId();
  const descId = hint || error ? `${id}-d` : undefined;
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-2">
        {label}
        {required && <span className="text-rose"> *</span>}
      </label>
      {children(id, descId)}
      {(error || hint) && (
        <p id={descId} className={clsx("text-[12.5px]", error ? "font-semibold text-bad" : "text-ink-3")} role={error ? "alert" : undefined}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label, size = "md" }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string; size?: "sm" | "md" }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[11px] border border-line bg-sunk p-[3px]">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={clsx(
              "inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[8px] font-semibold transition-colors",
              size === "sm" ? "min-h-[28px] px-2.5 text-[12.5px]" : "min-h-[34px] px-3.5 text-[13.5px]",
              on ? "bg-surface text-ink shadow-[0_1px_3px_rgb(42_32_36/0.12)]" : "text-ink-2 hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ───────── Katmanlar ───────── */

function useLockScroll(on: boolean) {
  useEffect(() => {
    if (!on) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [on]);
}

function useEscape(on: boolean, fn: () => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!on) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && ref.current();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [on]);
}

/** Açıldığında odağı içeri alır, kapanınca tetikleyiciye geri verir; Tab ile dışarı kaçmaz. */
function useFocusTrap(on: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!on) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const sel = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const first = el?.querySelector<HTMLElement>("[data-autofocus]") ?? el?.querySelector<HTMLElement>(sel);
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !el) return;
      const items = [...el.querySelectorAll<HTMLElement>(sel)].filter((x) => x.offsetParent !== null);
      if (!items.length) return;
      const a = items[0]!;
      const z = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [on]);
  return ref;
}

export function Modal({ open, onClose, title, children, footer, width = 560 }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; width?: number }) {
  useLockScroll(open);
  useEscape(open, onClose);
  const ref = useFocusTrap(open);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
      <div className="anim-fade absolute inset-0 bg-[rgb(42_32_36/0.38)] backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="anim-pop relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-surface shadow-[var(--shadow-pop)] sm:rounded-2xl"
        style={{ maxWidth: width }}
      >
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="display text-[24px]">{title}</h2>
          <button type="button" className="btn btn-ghost btn-icon -mr-2" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, children, footer, width = 520 }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: number }) {
  useLockScroll(open);
  useEscape(open, onClose);
  const ref = useFocusTrap(open);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="anim-fade absolute inset-0 bg-[rgb(42_32_36/0.3)]" onClick={onClose} aria-hidden />
      <div ref={ref} role="dialog" aria-modal="true" className="anim-slide relative flex h-full w-full flex-col bg-surface shadow-[var(--shadow-pop)]" style={{ maxWidth: width }}>
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">{title}</div>
          <button type="button" className="btn btn-ghost btn-icon -mr-2" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <footer className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3.5">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function Confirm({ open, title, children, confirmLabel = "Sil", onConfirm, onClose }: { open: boolean; title: string; children: ReactNode; confirmLabel?: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={440}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} data-autofocus>
            Vazgeç
          </button>
          <button
            type="button"
            className="btn btn-primary !bg-bad hover:!bg-[#962424]"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3 text-[14.5px] text-ink-2">
        <AlertTriangle className="mt-0.5 shrink-0 text-bad" size={20} aria-hidden />
        <div>{children}</div>
      </div>
    </Modal>
  );
}

/* ───────── Bildirim ───────── */

type ToastItem = { id: number; text: string };
let pushToast: (t: string) => void = () => {};
export const toast = (t: string) => pushToast(t);

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    pushToast = (text) => {
      const id = Date.now() + Math.random();
      setItems((x) => [...x, { id, text }]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3600);
    };
    return () => {
      pushToast = () => {};
    };
  }, []);
  return (
    <div aria-live="polite" className="no-print pointer-events-none fixed inset-x-0 bottom-5 z-[200] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div key={t.id} className="anim-pop pointer-events-auto flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[14px] font-semibold text-white shadow-[var(--shadow-pop)]">
          <Check size={16} className="text-[#9fd8b4]" aria-hidden />
          {t.text}
        </div>
      ))}
    </div>
  );
}
