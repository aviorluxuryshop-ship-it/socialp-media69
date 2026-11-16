import type { Metadata } from "next";
import Link from "next/link";
import Gallery, { type GalleryGroup } from "@/components/Gallery";
import Icon from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import SocialLinks from "@/components/SocialLinks";
import { gallerySeries } from "@/data/content";
import { getProduct } from "@/data/products";

export const metadata: Metadata = {
  title: "Galeri",
  description: "Prime Kids takımları çocukların üzerinde: sokak, denim, tek renk ve şeritli serilerden fotoğraflar. Beğendiğiniz kareden ürüne geçin.",
  alternates: { canonical: "/galeri" },
};

export default function GalleryPage() {
  const groups: GalleryGroup[] = gallerySeries.map((s) => ({
    id: s.id,
    kicker: s.kicker,
    title: s.title,
    text: s.text,
    shots: s.shots.flatMap((shot) => {
      const p = getProduct(shot.product);
      const c = p?.colors.find((x) => x.id === shot.color);
      return p && c ? [{ image: c.image, alt: c.alt, product: p.name, color: c.name, href: `/urun/${p.slug}?renk=${c.id}` }] : [];
    }),
  }));

  return (
    <>
      <PageHeader
        eyebrow="Galeri"
        title="Takımlar, çocukların üzerinde"
        lead="Fotoğrafları serilere ayırdık. Bir kareye dokunup büyütebilir, beğendiğiniz takımın sayfasına oradan geçebilirsiniz."
      />
      <Gallery groups={groups} />
      <div className="container-x mt-16 sm:mt-24">
        <div className="flex flex-col gap-5 border-t border-line pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[17px] font-semibold">Daha fazlası Instagram’da.</p>
            <SocialLinks className="mt-1" />
          </div>
          <Link href="/urunler" className="btn-primary">Ürünlere Git <Icon name="arrow" size={18} /></Link>
        </div>
      </div>
    </>
  );
}
