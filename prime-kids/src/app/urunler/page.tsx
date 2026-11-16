import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ProductCard from "@/components/ProductCard";
import { categories, products, type Category } from "@/data/products";

type Search = Promise<{ kategori?: string; sirala?: string }>;

const sorts = [
  { id: "onerilen", label: "Önerilen" },
  { id: "fiyat-artan", label: "Fiyat: artan" },
  { id: "fiyat-azalan", label: "Fiyat: azalan" },
];

const findCategory = (id?: string) => categories.find((c) => c.id === id);

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const cat = findCategory((await searchParams).kategori);
  return {
    title: cat ? `${cat.label} Takımları` : "Ürünler",
    description: cat
      ? `Prime Kids ${cat.label.toLocaleLowerCase("tr")} koleksiyonu: ${cat.blurb}.`
      : "Prime Kids koleksiyonu: kız ve erkek çocuklar için denim, eşofman, şardonlu ve gömlek ceket takımlar. 2–14 yaş.",
    alternates: { canonical: cat ? `/urunler?kategori=${cat.id}` : "/urunler" },
  };
}

export default async function Shop({ searchParams }: { searchParams: Search }) {
  const { kategori, sirala = "onerilen" } = await searchParams;
  const cat = findCategory(kategori);

  const list = cat ? products.filter((p) => p.category === (cat.id as Category)) : [...products];
  if (sirala === "fiyat-artan") list.sort((a, b) => a.price - b.price);
  if (sirala === "fiyat-azalan") list.sort((a, b) => b.price - a.price);

  const href = (k?: string, s?: string) => {
    const q = new URLSearchParams();
    if (k) q.set("kategori", k);
    if (s && s !== "onerilen") q.set("sirala", s);
    const str = q.toString();
    return `/urunler${str ? `?${str}` : ""}`;
  };

  return (
    <>
      <PageHeader
        eyebrow="Koleksiyon"
        title={cat ? cat.label : "Tüm Ürünler"}
        lead={cat ? cat.blurb : "Üstü altı birlikte tasarlanmış takımlar. Her ürün sayfasında renk seçenekleri, beden rehberi ve kumaş bilgisi yer alır."}
      />
      <div className="container-x">
        <div className="flex flex-col gap-3 border-y border-line py-3 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Kategori" className="hide-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:gap-2 sm:px-0">
            <Chip active={!cat} href={href(undefined, sirala)}>Tümü</Chip>
            {categories.map((c) => (
              <Chip key={c.id} active={cat?.id === c.id} href={href(c.id, sirala)}>{c.label}</Chip>
            ))}
          </nav>
          <nav aria-label="Sıralama" className="flex items-center gap-x-1 text-[13.5px]">
            <span className="mr-1 text-mute">Sırala:</span>
            {sorts.map((s) => (
              <Link
                key={s.id}
                href={href(cat?.id, s.id)}
                scroll={false}
                aria-current={sirala === s.id ? "true" : undefined}
                className={`inline-flex min-h-[44px] items-center px-2 underline-offset-4 ${sirala === s.id ? "font-semibold text-ink underline" : "text-mute hover:text-ink"}`}
              >
                {s.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-5 text-[13.5px] text-mute" role="status">{list.length} ürün</p>

        <h2 className="sr-only">Ürün listesi</h2>
        <div className="mt-4 grid grid-cols-2 gap-x-3.5 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
          {list.map((p, i) => (
            <ProductCard key={p.slug} product={p} priority={i < 4} />
          ))}
        </div>
      </div>
    </>
  );
}

function Chip({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`inline-flex min-h-[44px] shrink-0 items-center rounded-full border px-3.5 text-[14px] font-semibold sm:px-4 transition-colors ${
        active ? "border-ink bg-ink text-cream" : "border-line bg-white/60 hover:border-ink"
      }`}
    >
      {children}
    </Link>
  );
}
