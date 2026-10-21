import type { MetadataRoute } from "next";
import { isPlaceholderContact, site } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: isPlaceholderContact ? { userAgent: "*", disallow: "/" } : { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
