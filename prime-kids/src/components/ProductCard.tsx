import Image from "next/image";
import Link from "next/link";
import { categoryLabel, fmt, type Product } from "@/data/products";

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
    <Link href={`/urun/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-sand">
        <Image
          src={cover.image}
          alt={`${product.name} — ${cover.name}`}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover object-top transition duration-500 group-hover:scale-[1.04]"
        />
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11.5px] font-bold uppercase tracking-wide text-ink">
            {product.badge}
          </span>
        )}
      </div>
      <div className="mt-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-mute">
            {categoryLabel(product.category)}
          </p>
          <h3 className="mt-1 text-[16px] font-semibold leading-snug group-hover:text-cobalt">
            {product.name}
          </h3>
        </div>
        <p className="shrink-0 pt-4 text-[15px] font-bold">{fmt(product.price)}</p>
      </div>
      <ul className="mt-2.5 flex items-center gap-1.5" aria-label="Renk seçenekleri">
        {product.colors.map((c) => (
          <li
            key={c.id}
            title={c.name}
            className="h-3.5 w-3.5 rounded-full border border-black/15"
            style={{ background: c.hex }}
          />
        ))}
        {product.colors.length > 1 && (
          <li className="ml-1 text-[12px] text-mute">{product.colors.length} renk</li>
        )}
      </ul>
    </Link>
  );
}
