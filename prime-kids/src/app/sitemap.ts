import type { MetadataRoute } from "next";
import { products } from "@/data/products";
import { site } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/urunler", "/teslimat-iade"].map((p) => ({ url: `${site.url}${p}` }));
  const items = products.map((p) => ({ url: `${site.url}/urun/${p.slug}` }));
  return [...pages, ...items];
}
