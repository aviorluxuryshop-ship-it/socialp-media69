import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/sepet", "/odeme", "/siparis-onay"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
