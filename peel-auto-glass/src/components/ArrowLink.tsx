import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

/** Text link with a trailing arrow that nudges on hover. */
export function ArrowLink({
  href,
  children,
  light = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`link-arrow inline-flex items-center gap-2 font-semibold ${
        light ? "text-brand-soft hover:text-white" : "text-brand-deep hover:text-brand"
      } ${className}`}
    >
      {children}
      <ArrowRight aria-hidden className="size-4" />
    </Link>
  );
}
