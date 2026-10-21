import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { siteUrl } from "@/data/business";

export type Crumb = { label: string; href: string };

/** Visible trail plus BreadcrumbList data (the data only once the real domain is known). */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const trail: Crumb[] = [{ label: "Home", href: "/" }, ...crumbs];
  const data = siteUrl
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: trail.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.label,
          item: `${siteUrl}${c.href === "/" ? "" : c.href}`,
        })),
      }
    : null;

  return (
    <nav aria-label="Breadcrumb" className="hero-rise">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-white/65">
        {trail.map((c, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={c.href} className="flex items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="font-medium text-white">
                  {c.label}
                </span>
              ) : (
                <>
                  <Link href={c.href} className="underline-offset-4 hover:text-white hover:underline">
                    {c.label}
                  </Link>
                  <ChevronRight aria-hidden className="size-3.5 text-white/40" />
                </>
              )}
            </li>
          );
        })}
      </ol>
      {data && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
        />
      )}
    </nav>
  );
}
