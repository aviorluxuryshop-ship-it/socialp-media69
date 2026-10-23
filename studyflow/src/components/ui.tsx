"use client";

import clsx from "clsx";
import { AlertTriangle, Check, CircleAlert, Info, Loader2, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { useApp } from "@/lib/app";

export function cx(...a: Parameters<typeof clsx>) {
  return clsx(...a);
}

export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return <Loader2 aria-hidden size={size} className={clsx("animate-spin", className)} />;
}

/** Üç noktalı sakin "düşünüyor" göstergesi */
export function Thinking({ label = "Düşünüyor" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-ink-3 text-sm" role="status" aria-live="polite">
      <span className="inline-flex gap-1" aria-hidden>
        <i className="dot-breathe block h-1.5 w-1.5 rounded-full bg-accent" />
        <i className="dot-breathe block h-1.5 w-1.5 rounded-full bg-accent" />
        <i className="dot-breathe block h-1.5 w-1.5 rounded-full bg-accent" />
      </span>
      {label}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx("skeleton", className)} />;
}

export function PageHeader({
  eyebrow,
  title,
  lead,
  actions,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={clsx("mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8", className)}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-display text-[1.9rem] leading-[1.1] sm:text-[2.35rem] text-ink">{title}</h1>
        {lead && <p className="mt-3 text-[1.02rem] leading-relaxed text-ink-2">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-9 flex items-baseline justify-between gap-3 first:mt-0">
      <h2 className="font-display text-xl text-ink">{children}</h2>
      {aside && <div className="text-sm text-ink-3">{aside}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      {icon && <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">{icon}</div>}
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {text && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-3">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: "info" | "warn" | "error" | "ok";
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const t = {
    info: { bg: "bg-surface-2", fg: "text-ink-2", icon: <Info size={18} className="text-ink-3" /> },
    warn: { bg: "bg-warn-soft", fg: "text-ink", icon: <AlertTriangle size={18} className="text-warn" /> },
    error: { bg: "bg-danger-soft", fg: "text-ink", icon: <CircleAlert size={18} className="text-danger" /> },
    ok: { bg: "bg-ok-soft", fg: "text-ink", icon: <Check size={18} className="text-ok" /> },
  }[tone];
  return (
    <div className={clsx("flex gap-3 rounded-2xl border border-line px-4 py-3.5 text-[0.94rem] leading-relaxed", t.bg, t.fg)} role={tone === "error" ? "alert" : "status"}>
      <span className="mt-0.5 shrink-0">{t.icon}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children && <div className={title ? "mt-0.5 text-ink-2" : ""}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-line bg-surface-2 p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={clsx(
              "whitespace-nowrap rounded-xl px-3.5 font-medium transition-colors",
              size === "sm" ? "min-h-8 text-[13.5px]" : "min-h-10 text-[14.5px]",
              on ? "bg-raised text-ink shadow-[var(--shadow-1)]" : "text-ink-3 hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[13px] leading-snug text-ink-3">{hint}</p>}
      {error && <p className="text-[13px] leading-snug text-danger">{error}</p>}
    </div>
  );
}

export function ProgressBar({ value, tone = "accent", label }: { value: number; tone?: "accent" | "ok" | "warn"; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const color = tone === "ok" ? "bg-ok" : tone === "warn" ? "bg-warn" : "bg-accent";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={clsx("h-full rounded-full transition-[width] duration-500 ease-out", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function CheckMark({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden>
      <circle cx="28" cy="28" r="26" className="fill-ok-soft stroke-ok" strokeWidth="1.5" />
      <path d="m17 29 8 8 14-17" className="anim-draw stroke-ok" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Altta açılan (mobil) / ortada açılan (masaüstü) diyalog */
export function Sheet({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    setTimeout(() => ref.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
      <div className="anim-fade absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={clsx(
          "anim-sheet card-raised relative flex max-h-[88dvh] w-full flex-col rounded-b-none sm:rounded-b-[var(--radius-card)]",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 id={id} className="font-display text-lg text-ink">
            {title}
          </h2>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </div>
        <div className="safe-bottom overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmSheet({
  open,
  title,
  text,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="text-[0.97rem] leading-relaxed text-ink-2">{text}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn btn-ghost" onClick={onClose} data-autofocus>
          Vazgeç
        </button>
        <button
          className={clsx("btn", danger ? "btn-danger" : "btn-primary")}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}

export function ToastHost() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="anim-rise card-raised pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-[0.94rem] text-ink"
          role={t.kind === "error" ? "alert" : "status"}
        >
          {t.kind === "ok" ? <Check size={18} className="shrink-0 text-ok" /> : t.kind === "error" ? <CircleAlert size={18} className="shrink-0 text-danger" /> : <Info size={18} className="shrink-0 text-ink-3" />}
          <span className="min-w-0 flex-1">{t.text}</span>
          <button className="text-ink-3 hover:text-ink" onClick={() => dismissToast(t.id)} aria-label="Kapat">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function KeyValue({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
      <dt className="text-ink-3">{k}</dt>
      <dd className="text-right font-medium text-ink">{v}</dd>
    </div>
  );
}
