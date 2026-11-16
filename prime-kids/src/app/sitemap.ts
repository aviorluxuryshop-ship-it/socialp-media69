import type { MetadataRoute } from "next";
import { getLegalDocs } from "@/content/legal";
import { categories, products } from "@/data/products";
import { site } from "@/data/site";
import { legalCompany } from "@/lib/site-helpers";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({ url: `${site.url}${path}`, priority });
  return [
    u("", 1),
    u("/urunler", 0.9),
    ...categories.map((c) => u(`/urunler?kategori=${c.id}`, 0.8)),
    ...products.map((p) => u(`/urun/${p.slug}`, 0.8)),
    u("/galeri", 0.6),
    u("/hizmetlerimiz", 0.6),
    u("/iletisim", 0.6),
    u("/yasal", 0.3),
    ...getLegalDocs(legalCompany).map((d) => u(`/yasal/${d.slug}`, 0.3)),
  ];
}
