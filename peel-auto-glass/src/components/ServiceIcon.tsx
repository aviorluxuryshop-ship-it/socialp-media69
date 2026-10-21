import type { ReactNode } from "react";
import type { ServiceSlug } from "@/data/services";

/**
 * Line icons drawn for this site: a windshield seen from the front, the side
 * glass of a door, and the rear glass. Decorative, so hidden from assistive tech.
 */
const windshield = "M14 13 Q24 10.5 34 13 L41 35 Q24 38.5 7 35 Z";

const glyphs: Record<ServiceSlug, ReactNode> = {
  "windshield-repair": (
    <>
      <path d={windshield} />
      <path d="M24 19.5v9M19.5 24h9M21 21l6 6M27 21l-6 6" />
    </>
  ),
  "windshield-replacement": (
    <>
      <path d={windshield} />
      <path d="M30 24a6 6 0 1 1-1.76-4.24M30 17.5v4.5h-4.5" />
    </>
  ),
  "side-window-replacement": (
    <>
      <path d="M9 34l6.5-19H33q3.2 0 5 4.2L43 34Z" />
      <path d="M26 15v19" />
    </>
  ),
  "rear-windshield-replacement": (
    <>
      <path d="M13 14.5Q24 12 35 14.5L41.5 33Q24 36 6.5 33Z" />
      <path d="M10.5 22.5Q24 25 37.5 22.5M9 27.5Q24 30.5 39 27.5" />
    </>
  ),
};

export function ServiceIcon({ slug, className = "size-9" }: { slug: ServiceSlug; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {glyphs[slug]}
    </svg>
  );
}
