import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductBuy from "@/components/ProductBuy";
import ProductCard from "@/components/ProductCard";
import { categoryLabel, getProduct, products } from "@/data/products";
import { site } from "@/data/site";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  return {
    title: p.name,
    description: `${p.short}. ${p.description}`,
    openGraph: { images: [{ url: p.colors[0].image, width: 1024, height: 1536 }] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();

  const related = products.filter((x) => x.slug !== p.slug).sort((a, b) => Number(b.category === p.category) - Number(a.category === p.category)).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.colors.map((c) => `${site.url}${c.image}`),
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      priceCurrency: site.currency,
      price: p.price,
      availability: "https://schema.org/InStock",
      url: `${site.url}/urun/${p.slug}`,
    },
  };

  return (
    <div className="container-x pb-28 pt-6 lg:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Konum" className="mb-6 text-[13px] text-mute">
        <Link href="/" className="hover:text-ink">Ana sayfa</Link> /{" "}
        <Link href={`/urunler?kategori=${p.category}`} className="hover:text-ink">{categoryLabel(p.category)}</Link> /{" "}
        <span className="text-ink">{p.name}</span>
      </nav>

      <ProductBuy product={p} />

      <section className="mt-24">
        <h2 className="h-display text-2xl sm:text-3xl">Bunlara da göz atın</h2>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {related.map((r) => (
            <ProductCard key={r.slug} product={r} />
          ))}
        </div>
      </section>
    </div>
  );
}
