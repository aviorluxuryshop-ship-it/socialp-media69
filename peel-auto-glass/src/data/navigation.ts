import { services } from "./services";

export const homeLink = { href: "/", label: "Home" } as const;

export type NavItem = { href: string; label: string; children?: { href: string; label: string; text: string }[] };

export const nav: NavItem[] = [
  {
    href: "/services",
    label: "Services",
    children: services.map((s) => ({ href: `/services/${s.slug}`, label: s.title, text: s.summary })),
  },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/auto-glass-guide", label: "Guide" },
  { href: "/about", label: "About Us" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact Us" },
];
