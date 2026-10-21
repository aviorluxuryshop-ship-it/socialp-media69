import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "outline-light" | "outline-dark" | "light";

const base =
  "inline-flex min-h-12 items-center justify-center gap-2.5 rounded-md px-6 py-3 text-[0.95rem] font-semibold tracking-tight transition-colors duration-200 [&_svg]:size-[1.15em] [&_svg]:shrink-0";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-deep",
  light: "bg-white text-ink hover:bg-mist",
  "outline-light": "border border-white/40 text-white hover:border-white hover:bg-white/10",
  "outline-dark": "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-white",
};

export function ButtonLink({
  href,
  variant = "primary",
  children,
  className = "",
  external = false,
}: {
  href: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
  external?: boolean;
}) {
  const cls = `${base} ${variants[variant]} ${className}`;
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  // Internal page routes use the client router; tel:, mailto: and #anchors stay plain links.
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={cls}>
      {children}
    </a>
  );
}
