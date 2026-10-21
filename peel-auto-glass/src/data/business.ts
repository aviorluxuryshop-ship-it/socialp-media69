/**
 * Verified business details. Only facts supplied by the business live here.
 * Do not add opening hours, credentials, prices or a service radius until the
 * business confirms them.
 */
export const business = {
  name: "Peel Auto Glass",
  phone: {
    /** Compact form for buttons and the header. */
    short: "437-339-9054",
    /** Full international form for contact blocks. */
    display: "+1 437-339-9054",
    href: "tel:+14373399054",
    e164: "+14373399054",
  },
  email: "peelautoglass@yahoo.com",
  emailHref: "mailto:peelautoglass@yahoo.com",
  address: {
    street: "3443 Wolfedale Rd #4",
    city: "Mississauga",
    region: "Ontario",
    regionCode: "ON",
    country: "Canada",
    countryCode: "CA",
    oneLine: "3443 Wolfedale Rd #4, Mississauga, Ontario, Canada",
  },
  /** Opens turn-by-turn directions to the business address. */
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=" +
    encodeURIComponent("3443 Wolfedale Rd #4, Mississauga, ON, Canada"),
  /** Date the policy pages were last revised. */
  policiesUpdated: "October 21, 2026",
} as const;

/**
 * Canonical site URL, used for canonical links, the sitemap and structured data.
 * Set NEXT_PUBLIC_SITE_URL once the real domain is known. On Vercel we fall back
 * to the project's production hostname. Left undefined locally so no canonical
 * is emitted for a domain we don't know.
 */
export const siteUrl: string | undefined =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);

export const nav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact Us" },
] as const;

export const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-service", label: "Terms of Service" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/warranty-and-service-policy", label: "Warranty & Service Policy" },
] as const;
