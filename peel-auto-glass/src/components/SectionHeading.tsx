import type { ReactNode } from "react";

/** Eyebrow + heading + optional lead. A blue/red hairline echoes the logo. */
export function SectionHeading({
  eyebrow,
  title,
  children,
  dark = false,
  as: Tag = "h2",
  index,
  className = "",
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  dark?: boolean;
  as?: "h1" | "h2";
  /** Optional section number, shown before the eyebrow (e.g. "01"). */
  index?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p
        className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] ${dark ? "text-brand-soft" : "text-brand-deep"}`}
      >
        <span aria-hidden className="flex h-0.5 w-9">
          <span className="w-2/3 bg-brand" />
          <span className="w-1/3 bg-signal" />
        </span>
        {index && (
          <span aria-hidden className={`tabular-nums ${dark ? "text-white/45" : "text-muted"}`}>
            {index}
          </span>
        )}
        {eyebrow}
      </p>
      <Tag
        className={`mt-4 text-3xl font-bold leading-[1.08] sm:text-4xl lg:text-[2.75rem] ${dark ? "text-white" : "text-ink"}`}
      >
        {title}
      </Tag>
      {children && (
        <div className={`mt-5 max-w-2xl text-lg leading-relaxed ${dark ? "text-white/75" : "text-muted"}`}>
          {children}
        </div>
      )}
    </div>
  );
}
