import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductBuy from "@/components/ProductBuy";
import ProductCard from "@/components/ProductCard";
import { categoryLabel, getProduct, products, sizeRange, stockOf } from "@/data/products";
import { site } from "@/data/site";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  const description = `${p.short}. ${sizeRange(p)}, ${p.colors.length} renk. ${p.fabric.composition}.`;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/urun/${p.slug}` },
    openGraph: { title: p.name, description, images: [{ url: p.colors[0].image, width: 1024, height: 1536, alt: p.colors[0].alt }] },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const p = getProduct((await params).slug);
  if (!p) notFound();

  const related = products
    .filter((x) => x.slug !== p.slug)
    .sort((a, b) => Number(b.category === p.category) - Number(a.category === p.category))
    .slice(0, 4);

  const inStock = p.colors.some((c) => p.sizes.some((s) => stockOf(p, c.id, s) > 0));
  const url = `${site.url}/urun/${p.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description: p.description,
      image: p.colors.map((c) => `${site.url}${c.image}`),
      sku: p.slug,
      brand: { "@type": "Brand", name: site.name },
      material: p.fabric.composition,
      color: p.colors.map((c) => c.name).join(", "),
      audience: { "@type": "PeopleAudience", suggestedMinAge: parseInt(p.sizes[0]), suggestedMaxAge: parseInt(p.sizes[p.sizes.length - 1]) },
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: site.currency,
        price: p.price,
        availability: `https://schema.org/${inStock ? "InStock" : "OutOfStock"}`,
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: site.name },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: site.url },
        { "@type": "ListItem", position: 2, name: categoryLabel(p.category), item: `${site.url}/urunler?kategori=${p.category}` },
        { "@type": "ListItem", position: 3, name: p.name, item: url },
      ],
    },
  ];

  return (
    <div className="container-x pb-24 pt-4 lg:pb-0 lg:pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Sayfa konumu" className="mb-3 text-[13px] text-mute lg:mb-6">
        <ol className="flex flex-wrap items-center">
          <li><Link href="/urunler" className="inline-flex min-h-[40px] items-center hover:text-ink">Ürünler</Link><span className="mx-2" aria-hidden>/</span></li>
          <li><Link href={`/urunler?kategori=${p.category}`} className="inline-flex min-h-[40px] items-center hover:text-ink">{categoryLabel(p.category)}</Link><span className="mx-2 hidden sm:inline" aria-hidden>/</span></li>
          <li aria-current="page" className="hidden text-ink sm:block">{p.name}</li>
        </ol>
      </nav>

      <ProductBuy product={p} />

      <section className="mt-16 sm:mt-24" aria-labelledby="benzer">
        <h2 id="benzer" className="h-display text-[24px] sm:text-3xl">Bunlar da ilginizi çekebilir</h2>
        <div className="mt-6 grid grid-cols-2 gap-x-3.5 gap-y-9 sm:gap-x-5 lg:grid-cols-4">
          {related.map((r) => (
            <ProductCard key={r.slug} product={r} />
          ))}
        </div>
      </section>
    </div>
  );
}
