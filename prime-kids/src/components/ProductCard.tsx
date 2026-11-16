import Image from "next/image";
import Link from "next/link";
import { categoryLabel, sizeRange, type Product } from "@/data/products";
import { fmt } from "@/lib/site-helpers";

/** Ürün kartı. Fotoğraf 2:3 oranında gösterilir; takımın tamamı (üst + alt) kadrajda kalır. */
export default function ProductCard({
  product,
  priority = false,
  sizes = "(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw",
}: {
  product: Product;
  priority?: boolean;
  sizes?: string;
}) {
  const cover = product.colors[0];
  return (
    <article className="group relative">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-sand">
        <Image
          src={cover.image}
          alt={cover.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        {product.badge && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-cream/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">
            {product.badge}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-[12px] text-mute">{categoryLabel(product.category)} · {sizeRange(product)}</p>
        <h3 className="mt-1 text-[15px] font-semibold leading-snug sm:text-[16px]">
          <Link href={`/urun/${product.slug}`} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <p className="text-[15px] font-semibold tabular-nums">{fmt(product.price)}</p>
          <ul className="flex items-center gap-1.5" aria-label={`${product.colors.length} renk seçeneği`}>
            {product.colors.map((c) => (
              <li key={c.id} title={c.name} className="h-3.5 w-3.5 rounded-full border border-black/15" style={{ background: c.hex }} />
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
