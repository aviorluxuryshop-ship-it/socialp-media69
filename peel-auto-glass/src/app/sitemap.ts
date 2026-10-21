import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/business";

// Public marketing and policy pages only. The protected experiment route and
// noindex pages (image credits) are deliberately absent.
const paths = [
  "/",
  "/services",
  "/services/windshield-repair",
  "/services/windshield-replacement",
  "/services/side-window-replacement",
  "/services/rear-windshield-replacement",
  "/how-it-works",
  "/auto-glass-guide",
  "/about",
  "/faq",
  "/contact",
  "/privacy-policy",
  "/terms-of-service",
  "/cookie-policy",
  "/warranty-and-service-policy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl ?? "http://localhost:3000";
  return paths.map((p) => ({
    url: `${base}${p === "/" ? "" : p}`,
    changeFrequency: p === "/" ? "monthly" : "yearly",
    priority: p === "/" ? 1 : p === "/contact" || p.startsWith("/services") ? 0.8 : 0.6,
  }));
}
