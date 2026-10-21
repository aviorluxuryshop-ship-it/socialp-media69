import type { Metadata } from "next";
import { siteUrl } from "@/data/business";

/**
 * Per-page metadata. Canonical and Open Graph URLs are only emitted when the
 * production domain is known (see siteUrl).
 */
const OG_IMAGE = {
  url: "/opengraph-image.jpg",
  width: 1200,
  height: 630,
  alt: "Peel Auto Glass logo beside a dark blue car window reflecting a sunset sky",
};

export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  /** Plain strings get the " | Peel Auto Glass" suffix; use { absolute } to opt out. */
  title: string | { absolute: string };
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  return {
    title,
    description,
    ...(siteUrl ? { alternates: { canonical: path } } : {}),
    openGraph: {
      type: "website",
      siteName: "Peel Auto Glass",
      locale: "en_CA",
      title: typeof title === "string" ? `${title} | Peel Auto Glass` : title.absolute,
      description,
      ...(siteUrl ? { url: path } : {}),
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: typeof title === "string" ? title : title.absolute,
      description,
      images: [OG_IMAGE.url],
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
