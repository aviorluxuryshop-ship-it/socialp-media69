import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { categories, products, type Category } from "@/data/products";

export const metadata: Metadata = {
  title: "Tüm Ürünler",
  description: "Kız ve erkek çocuk takımları: şardonlu eşofman, denim, kargo ve daha fazlası.",
};

const sorts = [
  { id: "onerilen", label: "Önerilen" },
  { id: "fiyat-artan", label: "Fiyat: Düşükten yükseğe" },
  { id: "fiyat-azalan", label: "Fiyat: Yüksekten düşüğe" },
] as const;

export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; sirala?: string }>;
}) {
  const { kategori, sirala = "onerilen" } = await searchParams;
  const cat = categories.find((c) => c.id === kategori)?.id as Category | undefined;

  let list = cat ? products.filter((p) => p.category === cat) : [...products];
  if (sirala === "fiyat-artan") list.sort((a, b) => a.price - b.price);
  if (sirala === "fiyat-azalan") list.sort((a, b) => b.price - a.price);

  const href = (k?: string, s?: string) => {
    const q = new URLSearchParams();
    if (k) q.set("kategori", k);
    if (s && s !== "onerilen") q.set("sirala", s);
    const str = q.toString();
    return `/urunler${str ? `?${str}` : ""}`;
  };

  const title = cat ? categories.find((c) => c.id === cat)!.label : "Tüm Ürünler";

  return (
    <div className="container-x pb-8 pt-10">
      <p className="eyebrow">Koleksiyon</p>
      <h1 className="h-display mt-2 text-4xl sm:text-5xl">{title}</h1>

      <div className="mt-8 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Kategori" className="flex flex-wrap gap-2">
          <Chip active={!cat} href={href(undefined, sirala)}>Tümü</Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={cat === c.id} href={href(c.id, sirala)}>
              {c.label}
            </Chip>
          ))}
        </nav>
        <nav aria-label="Sıralama" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px]">
          <span className="text-mute">Sırala:</span>
          {sorts.map((s) => (
            <Link
              key={s.id}
              href={href(cat, s.id)}
              aria-current={sirala === s.id ? "true" : undefined}
              className={sirala === s.id ? "font-bold text-ink underline underline-offset-4" : "text-mute hover:text-ink"}
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </div>

      <p className="mt-5 text-[14px] text-mute">{list.length} ürün</p>

      {list.length ? (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {list.map((p, i) => (
            <ProductCard key={p.slug} product={p} priority={i < 4} />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center text-mute">Bu kategoride ürün bulunamadı.</p>
      )}
    </div>
  );
}

function Chip({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`rounded-full border px-4 py-2 text-[14px] font-semibold transition ${
        active ? "border-ink bg-ink text-cream" : "border-line bg-white/60 hover:border-ink"
      }`}
    >
      {children}
    </Link>
  );
}
